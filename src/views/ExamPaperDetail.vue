<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { examPaperApi, type ExamPaperWithQuestions, type ExamPaperQuestion } from '@/api/examPaper'
import { questionApi, type Question } from '@/api/question'
import { topicApi, type Topic } from '@/api/topic'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, ArrowUp, ArrowDown, Back, Refresh, Remove } from '@element-plus/icons-vue'
import { DIFFICULTY_LEVELS } from '@/constants/difficulty'

const route = useRoute()
const router = useRouter()
const examPaperId = Number(route.params.id)

const examPaper = ref<ExamPaperWithQuestions | null>(null)
const questions = ref<ExamPaperQuestion[]>([])
const topics = ref<Topic[]>([])
const loading = ref(false)
const randomLoading = ref(false)
const showTopicDialog = ref(false)
const selectedTopicIds = ref<number[]>([])

const showQuestionDialog = ref(false)
const questionList = ref<Question[]>([])
const questionLoading = ref(false)
const questionPage = ref(1)
const questionLevelFilter = ref<number | undefined>(undefined)
const questionTopicFilter = ref<number | undefined>(undefined)
const questionYearFilter = ref<number | undefined>(undefined)

const paperTypeLabel = computed(() => {
  const types: Record<string, string> = { daily: '练习卷', topic: '专题卷', past: '真题卷' }
  return types[examPaper.value?.paper_type || 'daily'] || '未知'
})

const topicStats = computed(() => {
  const counts: Record<string, number> = {}
  for (const q of questions.value) {
    const topicId = q.question?.topic_id
    if (topicId) {
      counts[topicId] = (counts[topicId] || 0) + 1
    }
  }
  return Object.entries(counts).map(([topicId, count]) => {
    const topic = topics.value.find(t => t.id === Number(topicId))
    return { topicName: topic?.title || topicId, count }
  })
})

const loadExamPaper = async () => {
  loading.value = true
  try {
    examPaper.value = await examPaperApi.get(examPaperId)
    questions.value = examPaper.value.questions || []
  } catch (e) {
    console.error('loadExamPaper error:', e)
    ElMessage.error('加载考卷详情失败')
  } finally {
    loading.value = false
  }
}

const loadTopics = async () => {
  try {
    topics.value = await topicApi.list()
  } catch (e) {
    console.error('loadTopics error:', e)
  }
}

const openAddQuestion = async () => {
  if (questions.value.length >= (examPaper.value?.total_questions || 10)) {
    ElMessage.warning('已达到最大题目数量')
    return
  }
  showQuestionDialog.value = true
  await loadQuestionList()
}

const loadQuestionList = async () => {
  questionLoading.value = true
  try {
    const params: { page: number; size: number; difficulty_level?: number; topic_id?: number; source_year?: number; status?: string; sort_order?: string } = {
      page: questionPage.value,
      size: 50,
      difficulty_level: questionLevelFilter.value,
      topic_id: questionTopicFilter.value,
      source_year: questionYearFilter.value,
      status: 'published',
      sort_order: 'asc'
    }
    questionList.value = await questionApi.list(params)
  } catch (e) {
    console.error('loadQuestionList error:', e)
    ElMessage.error('加载题目列表失败')
  } finally {
    questionLoading.value = false
  }
}

const handleQuestionFilter = () => {
  questionPage.value = 1
  loadQuestionList()
}

const handleQuestionPageChange = (newPage: number) => {
  questionPage.value = newPage
  loadQuestionList()
}

const isQuestionAdded = (questionId: number) => {
  return questions.value.some(q => q.question_id === questionId)
}

const addQuestion = async (questionId: number) => {
  try {
    await examPaperApi.addQuestion(examPaperId, { question_id: questionId })
    ElMessage.success('添加成功')
    await loadExamPaper()
  } catch (e) {
    console.error('addQuestion error:', e)
    ElMessage.error('添加失败')
  }
}

const addingAll = ref(false)
const addAllQuestions = async () => {
  const toAdd = questionList.value.filter(q => !isQuestionAdded(q.id))
  if (toAdd.length === 0) {
    ElMessage.warning('当前页面没有可添加的题目')
    return
  }
  addingAll.value = true
  let successCount = 0
  try {
    for (const q of toAdd) {
      await examPaperApi.addQuestion(examPaperId, { question_id: q.id })
      successCount++
    }
    ElMessage.success(`已添加 ${successCount} 道题目`)
    await loadExamPaper()
  } catch (e) {
    console.error('addAllQuestions error:', e)
    ElMessage.error(`已添加 ${successCount} 道，部分添加失败`)
  } finally {
    addingAll.value = false
  }
}

const addRandomQuestions = async () => {
  const ep = examPaper.value
  if (!ep) return

  const remaining = ep.total_questions - questions.value.length
  if (remaining <= 0) {
    ElMessage.warning('考卷题目已满')
    return
  }

  selectedTopicIds.value = []
  showTopicDialog.value = true
}

const confirmAddRandom = async () => {
  const ep = examPaper.value
  if (!ep) return

  randomLoading.value = true
  try {
    const res = await examPaperApi.addRandomQuestions(examPaperId, selectedTopicIds.value.length > 0 ? { topic_ids: selectedTopicIds.value } : undefined)
    const count = (res as any)?.added_count ?? (ep.total_questions - questions.value.length)
    ElMessage.success(`已添加 ${count} 道题目`)
    showTopicDialog.value = false
    await loadExamPaper()
  } catch (e: any) {
    console.error('addRandomQuestions error:', e)
    ElMessage.error(e?.response?.data?.detail || '一键添加失败')
  } finally {
    randomLoading.value = false
  }
}

const clearQuestions = async () => {
  if (questions.value.length === 0) {
    ElMessage.warning('考卷暂无题目')
    return
  }
  try {
    await ElMessageBox.confirm('确定要清空考卷所有题目吗？此操作不可撤销。', '确认清空', {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await examPaperApi.clearQuestions(examPaperId)
    ElMessage.success('已清空所有题目')
    await loadExamPaper()
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error('clearQuestions error:', e)
      ElMessage.error('清空失败')
    }
  }
}

const removeQuestion = async (questionId: number) => {
  try {
    await examPaperApi.removeQuestion(examPaperId, questionId)
    ElMessage.success('移除成功')
    await loadExamPaper()
  } catch (e) {
    console.error('removeQuestion error:', e)
    ElMessage.error('移除失败')
  }
}

const moveUp = async (index: number) => {
  if (index <= 0) return
  const newQuestions = [...questions.value]
  ;[newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]]
  const sorts = newQuestions.map((q, i) => ({ id: q.id, sort: i + 1 }))
  await updateSort(sorts)
}

const moveDown = async (index: number) => {
  if (index >= questions.value.length - 1) return
  const newQuestions = [...questions.value]
  ;[newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]]
  const sorts = newQuestions.map((q, i) => ({ id: q.id, sort: i + 1 }))
  await updateSort(sorts)
}

const updateSort = async (sorts: { id: number; sort: number }[]) => {
  try {
    await examPaperApi.updateSort(examPaperId, sorts)
    await loadExamPaper()
    ElMessage.success('排序更新成功')
  } catch (e) {
    console.error('updateSort error:', e)
    ElMessage.error('排序更新失败')
  }
}

const goBack = () => {
  router.push('/exam-papers')
}

onMounted(async () => {
  await loadTopics()
  await loadExamPaper()
})
</script>

<template>
  <div class="exam-paper-detail-page">
    <div class="header-bar">
      <el-button :icon="Back" @click="goBack">返回列表</el-button>
      <h2 v-if="examPaper">{{ examPaper.title }}</h2>
    </div>

    <el-card v-loading="loading">
      <div class="paper-info" v-if="examPaper">
        <el-descriptions :column="4" border>
          <el-descriptions-item label="等级">
            <el-tag type="primary">{{ DIFFICULTY_LEVELS.find(l => l.value === examPaper.difficulty_level)?.label || ('Level ' + examPaper.difficulty_level) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="examPaper.paper_type === 'daily' ? 'success' : 'info'">
              {{ paperTypeLabel }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="题目数量">
            {{ questions.length }} / {{ examPaper.total_questions }} 题
          </el-descriptions-item>
          <el-descriptions-item label="描述">
            {{ examPaper.description || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="topic-stats" v-if="topicStats.length > 0">
          <span class="stats-label">主题统计：</span>
          <el-tag v-for="s in topicStats" :key="s.topicName" class="topic-tag">
            {{ s.topicName }} <strong>{{ s.count }}</strong>题
          </el-tag>
        </div>
      </div>

      <div class="action-bar">
        <el-button type="primary" :icon="Plus" @click="openAddQuestion">添加题目</el-button>
        <el-button type="success" :icon="Refresh" :loading="randomLoading" @click="addRandomQuestions">一键添加题目</el-button>
        <el-button type="danger" :icon="Remove" @click="clearQuestions">清空题目</el-button>
      </div>

      <el-table :data="questions" stripe>
        <el-table-column prop="sort" label="序号" width="60">
          <template #default="{ row, $index }">
            <span>{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="题目ID" width="120">
          <template #default="{ row }">
            <span>{{ row.question_id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="主题" width="120">
          <template #default="{ row }">
            <span>{{ topics.find(t => t.id === row.question?.topic_id)?.title || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="题目内容" min-width="400">
          <template #default="{ row }">
            <span class="content-text">{{ row.question?.content?.text ? row.question.content.text.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim() : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="难度级别" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.question?.difficulty_level" type="info">{{ DIFFICULTY_LEVELS.find(l => l.value === row.question.difficulty_level)?.label || ('L' + row.question.difficulty_level) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row, $index }">
            <el-button type="primary" link :icon="ArrowUp" @click="moveUp($index)" :disabled="$index === 0">上移</el-button>
            <el-button type="primary" link :icon="ArrowDown" @click="moveDown($index)" :disabled="$index === questions.length - 1">下移</el-button>
            <el-button type="danger" link :icon="Delete" @click="removeQuestion(row.question_id)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加题目弹窗 -->
    <el-dialog v-model="showQuestionDialog" title="选择题目" width="1000px" top="5vh">
      <div class="question-filter-bar">
        <el-select
          v-model="questionTopicFilter"
          clearable
          placeholder="按专题筛选"
          @change="handleQuestionFilter"
          style="width: 200px"
        >
          <el-option v-for="t in topics" :key="t.id" :label="t.title" :value="t.id" />
        </el-select>
        <el-select
          v-model="questionLevelFilter"
          clearable
          placeholder="按难度级别筛选"
          @change="handleQuestionFilter"
          style="width: 180px"
        >
          <el-option v-for="l in DIFFICULTY_LEVELS" :key="l.value" :label="l.label" :value="l.value" />
        </el-select>
        <el-input-number
          v-model="questionYearFilter"
          :min="2000"
          :max="2030"
          :controls="false"
          placeholder="输入年份"
          @change="handleQuestionFilter"
          style="width: 140px"
        />
        <el-button type="success" @click="addAllQuestions" :loading="addingAll">
          添加全部
        </el-button>
      </div>

      <el-table :data="questionList" v-loading="questionLoading" stripe height="500">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="id" label="ID" width="120" />
        <el-table-column label="主题" width="120">
          <template #default="{ row }">
            <span>{{ topics.find(t => t.id === row.topic_id)?.title || row.topic_id || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="题目内容" min-width="400">
          <template #default="{ row }">
            <span class="content-text">{{ row.content?.text ? row.content.text.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim() : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="难度级别" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.difficulty_level" type="info">{{ DIFFICULTY_LEVELS.find(l => l.value === row.difficulty_level)?.label || ('L' + row.difficulty_level) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="isQuestionAdded(row.id)"
              type="info"
              disabled
            >
              已添加
            </el-button>
            <el-button
              v-else
              type="primary"
              @click="addQuestion(row.id)"
            >
              添加
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        :current-page="questionPage"
        :page-size="50"
        layout="prev, pager, next"
        @current-change="handleQuestionPageChange"
        style="margin-top: 15px"
      />
    </el-dialog>

    <!-- 一键添加题目 - 专题选择弹窗 -->
    <el-dialog v-model="showTopicDialog" title="选择专题" width="500px" top="30vh">
      <p style="margin-bottom: 16px; color: #909399; font-size: 14px;">
        按难度等级（{{ examPaper ? (DIFFICULTY_LEVELS.find(l => l.value === examPaper.difficulty_level)?.label || ('Level ' + examPaper.difficulty_level)) : '' }}）从选中的专题中随机选题，补全剩余 {{ examPaper ? examPaper.total_questions - questions.length : 0 }} 题
      </p>
      <el-checkbox-group v-model="selectedTopicIds">
        <el-checkbox v-for="t in topics" :key="t.id" :label="t.id" style="margin-bottom: 12px; display: flex;">
          {{ t.title }}
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="showTopicDialog = false">取消</el-button>
        <el-button type="success" :loading="randomLoading" @click="confirmAddRandom">开始添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.exam-paper-detail-page h2 {
  color: #304156;
  margin: 0;
}

.header-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.paper-info {
  margin-bottom: 20px;
}

.topic-stats {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stats-label {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.topic-tag {
  font-size: 13px;
}

.topic-tag strong {
  font-size: 15px;
  margin: 0 2px;
}

.action-bar {
  margin-bottom: 15px;
}

.question-filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.content-text {
  color: #333;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>