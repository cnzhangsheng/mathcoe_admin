<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { examPaperApi, type ExamPaperWithQuestions, type ExamPaperQuestion } from '@/api/examPaper'
import { questionApi, type Question } from '@/api/question'
import { topicApi, type Topic } from '@/api/topic'
import { ElMessage } from 'element-plus'
import { Plus, Delete, ArrowUp, ArrowDown, Back } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const examPaperId = Number(route.params.id)

const examPaper = ref<ExamPaperWithQuestions | null>(null)
const questions = ref<ExamPaperQuestion[]>([])
const topics = ref<Topic[]>([])
const loading = ref(false)

const showQuestionDialog = ref(false)
const questionList = ref<Question[]>([])
const questionLoading = ref(false)
const questionPage = ref(1)
const questionLevelFilter = ref<number | undefined>(undefined)
const questionTopicFilter = ref<number | undefined>(undefined)

const paperTypeLabel = computed(() => {
  const types: Record<string, string> = { daily: '每日一练', mock: '模拟卷', topic: '专项训练', past: '真题卷' }
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
    const params = {
      page: questionPage.value,
      size: 50,
      difficulty_level: questionLevelFilter.value,
      topic_id: questionTopicFilter.value
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
            <el-tag type="primary">Level {{ examPaper.difficulty_level }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="examPaper.paper_type === 'daily' ? 'success' : examPaper.paper_type === 'mock' ? 'warning' : 'info'">
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
            <el-tag v-if="row.question?.difficulty_level" type="info">L{{ row.question.difficulty_level }}</el-tag>
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
          <el-option label="难度级别 Level 1" :value="1" />
          <el-option label="难度级别 Level 2" :value="2" />
          <el-option label="难度级别 Level 3" :value="3" />
          <el-option label="难度级别 Level 4" :value="4" />
          <el-option label="难度级别 Level 5" :value="5" />
          <el-option label="难度级别 Level 6" :value="6" />
        </el-select>
      </div>

      <el-table :data="questionList" v-loading="questionLoading" stripe height="500">
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
        <el-table-column label="难度级别" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.difficulty_level" type="info">L{{ row.difficulty_level }}</el-tag>
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