<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { questionApi, type Question, type QuestionCreate } from '@/api/question'
import { topicApi, type Topic } from '@/api/topic'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import RichEditor from '@/components/RichEditor.vue'

const questions = ref<Question[]>([])
const topics = ref<Topic[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const topicFilter = ref<number | undefined>(undefined)
const difficultyFilter = ref<string | undefined>(undefined)
const levelFilter = ref<number | undefined>(undefined)
const total = ref(0)

const selectedQuestions = ref<Question[]>([])

const showDialog = ref(false)
const isEdit = ref(false)
const submitting = ref(false)

const formData = ref<{
  title: string
  topic_id: number | undefined
  question_type: string
  content_html: string
  options: { label: string; html: string }[]
  answer: string
  answerMultiple: string[]
  explanation_html: string
  difficulty: string
  level: number | undefined
  source_year: number | undefined
}>({
  title: '',
  topic_id: undefined,
  question_type: 'single',
  content_html: '',
  options: [
    { label: 'A', html: '' },
    { label: 'B', html: '' },
    { label: 'C', html: '' },
    { label: 'D', html: '' }
  ],
  answer: '',
  answerMultiple: [],
  explanation_html: '',
  difficulty: '',
  level: undefined,
  source_year: undefined
})

const editId = ref<number | null>(null)

const answerOptions = computed(() => {
  return formData.value.options.map(opt => ({
    label: opt.label,
    value: opt.label
  }))
})

const loadTopics = async () => {
  try {
    topics.value = await topicApi.list()
  } catch (e) {
    console.error('loadTopics error:', e)
  }
}

const loadQuestions = async () => {
  loading.value = true
  selectedQuestions.value = []
  try {
    const params: { page: number; size: number; topic_id?: number; difficulty?: string; level?: number } = {
      page: page.value,
      size: size.value
    }
    if (topicFilter.value) params.topic_id = topicFilter.value
    if (difficultyFilter.value) params.difficulty = difficultyFilter.value
    if (levelFilter.value) params.level = levelFilter.value
    questions.value = await questionApi.list(params)
    const countResult = await questionApi.getCount(topicFilter.value)
    total.value = countResult?.total || 0
  } catch (e) {
    console.error('loadQuestions error:', e)
    ElMessage.error('加载题目列表失败')
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (selection: Question[]) => {
  selectedQuestions.value = selection
}

const handleFilter = () => {
  page.value = 1
  loadQuestions()
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  loadQuestions()
}

const addOption = () => {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const nextLabel = labels[formData.value.options.length] || String.fromCharCode(65 + formData.value.options.length)
  formData.value.options.push({ label: nextLabel, html: '' })
}

const removeOption = (index: number) => {
  if (formData.value.options.length > 2) {
    formData.value.options.splice(index, 1)
  } else {
    ElMessage.warning('至少需要2个选项')
  }
}

const openCreate = () => {
  isEdit.value = false
  formData.value = {
    title: '',
    topic_id: undefined,
    question_type: 'single',
    content_html: '',
    options: [
      { label: 'A', html: '' },
      { label: 'B', html: '' },
      { label: 'C', html: '' },
      { label: 'D', html: '' }
    ],
    answer: '',
    answerMultiple: [],
    explanation_html: '',
    difficulty: '',
    level: undefined,
    source_year: undefined
  }
  showDialog.value = true
}

const openEdit = (question: Question) => {
  isEdit.value = true
  editId.value = question.id

  const contentHtml = question.content?.text || ''
  const explanationHtml = question.explanation?.text || ''
  const options = question.options || [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' }
  ]

  formData.value = {
    title: question.title,
    topic_id: question.topic_id,
    question_type: question.question_type || 'single',
    content_html: contentHtml,
    options: options.map(opt => ({
      label: opt.label,
      html: opt.text || ''
    })),
    answer: question.question_type === 'multiple' ? '' : question.answer,
    answerMultiple: question.question_type === 'multiple' ? question.answer.split(',') : [],
    explanation_html: explanationHtml,
    difficulty: question.difficulty || '',
    level: question.level,
    source_year: question.source_year
  }
  showDialog.value = true
}

const handleSubmit = async () => {
  if (submitting.value) return

  // 必选字段验证
  if (!formData.value.level) {
    ElMessage.warning('请选择题目级别')
    return
  }
  if (!formData.value.topic_id) {
    ElMessage.warning('请选择所属专题')
    return
  }
  if (!formData.value.question_type) {
    ElMessage.warning('请选择题目类型')
    return
  }

  const contentText = formData.value.content_html.replace(/<[^>]+>/g, '').trim()
  if (!contentText) {
    ElMessage.warning('请输入题目内容')
    return
  }

  const validOptions = formData.value.options.filter(opt => {
    const text = opt.html.replace(/<[^>]+>/g, '').trim()
    // 有文字内容或有图片都算有效选项
    return text.length > 0 || opt.html.includes('<img')
  })
  if (validOptions.length < 2) {
    ElMessage.warning('至少需要2个有效选项')
    return
  }

  let answerStr = ''
  if (formData.value.question_type === 'single') {
    if (!formData.value.answer) {
      ElMessage.warning('请选择答案')
      return
    }
    answerStr = formData.value.answer
  } else {
    if (formData.value.answerMultiple.length === 0) {
      ElMessage.warning('请选择答案')
      return
    }
    answerStr = formData.value.answerMultiple.join(',')
  }

  submitting.value = true
  try {
    const data: QuestionCreate = {
      title: formData.value.title || contentText.substring(0, 50),
      topic_id: formData.value.topic_id,
      question_type: formData.value.question_type,
      content: { text: formData.value.content_html, format: 'html' },
      options: formData.value.options.map(opt => ({
        label: opt.label,
        text: opt.html,
        format: 'html'
      })),
      answer: answerStr,
      explanation: { text: formData.value.explanation_html, format: 'html' },
      difficulty: formData.value.difficulty,
      level: formData.value.level,
      source_year: formData.value.source_year
    }

    if (isEdit.value && editId.value) {
      await questionApi.update(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await questionApi.create(data)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    loadQuestions()
  } catch (e) {
    console.error('handleSubmit error:', e)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (question: Question) => {
  try {
    await ElMessageBox.confirm('确定要删除这道题目吗？', '提示', { type: 'warning' })
    await questionApi.delete(question.id)
    ElMessage.success('删除成功')
    loadQuestions()
  } catch {
    // 用户取消
  }
}

const handleBatchDelete = async () => {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请先选择要删除的题目')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedQuestions.value.length} 道题目吗？`,
      '批量删除',
      { type: 'warning' }
    )
    const ids = selectedQuestions.value.map(q => q.id)
    const result = await questionApi.batchDelete(ids)
    ElMessage.success(result.message)
    loadQuestions()
  } catch {
    // 用户取消
  }
}

onMounted(async () => {
  await loadTopics()
  loadQuestions()
})
</script>

<template>
  <div class="questions-page">
    <h2>题目管理</h2>
    <el-card>
      <div class="action-bar">
        <el-select
          v-model="topicFilter"
          clearable
          placeholder="按专题筛选"
          @change="handleFilter"
          style="width: 200px"
        >
          <el-option v-for="t in topics" :key="t.id" :label="t.title" :value="t.id" />
        </el-select>
        <el-select
          v-model="difficultyFilter"
          clearable
          placeholder="按难度筛选"
          @change="handleFilter"
          style="width: 150px"
        >
          <el-option label="L1-L2" value="L1-L2" />
          <el-option label="L2-L3" value="L2-L3" />
          <el-option label="L3-L4" value="L3-L4" />
        </el-select>
        <el-select
          v-model="levelFilter"
          clearable
          placeholder="按级别筛选"
          @change="handleFilter"
          style="width: 120px"
        >
          <el-option label="级别 1" :value="1" />
          <el-option label="级别 2" :value="2" />
          <el-option label="级别 3" :value="3" />
          <el-option label="级别 4" :value="4" />
          <el-option label="级别 5" :value="5" />
          <el-option label="级别 6" :value="6" />
        </el-select>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增题目</el-button>
        <el-button
          type="danger"
          :icon="Delete"
          @click="handleBatchDelete"
          :disabled="selectedQuestions.length === 0"
        >
          批量删除 ({{ selectedQuestions.length }})
        </el-button>
      </div>

      <el-table :data="questions" v-loading="loading" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="120" />
        <el-table-column prop="topic_id" label="专题" width="120">
          <template #default="{ row }">
            <span>{{ topics.find(t => t.id === row.topic_id)?.title || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="题目" min-width="200" />
        <el-table-column prop="question_type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.question_type === 'single' ? 'primary' : 'warning'">
              {{ row.question_type === 'single' ? '单选' : '多选' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="answer" label="答案" width="80">
          <template #default="{ row }">
            <el-tag type="success">{{ row.answer }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.difficulty">{{ row.difficulty }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="级别" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.level" type="info">L{{ row.level }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="source_year" label="年份" width="80">
          <template #default="{ row }">
            <span>{{ row.source_year || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        :current-page="page"
        :page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        style="margin-top: 20px"
      />
    </el-card>

    <!-- 新增/编辑题目弹窗 -->
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑题目' : '新增题目'" width="900px" top="3vh">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="题目级别" required>
          <el-select v-model="formData.level" placeholder="选择级别" style="width: 100%">
            <el-option label="级别 1" :value="1" />
            <el-option label="级别 2" :value="2" />
            <el-option label="级别 3" :value="3" />
            <el-option label="级别 4" :value="4" />
            <el-option label="级别 5" :value="5" />
            <el-option label="级别 6" :value="6" />
          </el-select>
        </el-form-item>

        <el-form-item label="所属专题" required>
          <el-select v-model="formData.topic_id" placeholder="选择专题" style="width: 100%">
            <el-option v-for="t in topics" :key="t.id" :label="t.title" :value="t.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="题目类型" required>
          <el-radio-group v-model="formData.question_type">
            <el-radio value="single">单选题</el-radio>
            <el-radio value="multiple">多选题</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="题目内容" required>
          <RichEditor v-model="formData.content_html" placeholder="请输入题目内容" height="150px" />
        </el-form-item>

        <el-form-item label="选项" required>
          <div class="options-editor">
            <div v-for="(opt, index) in formData.options" :key="index" class="option-item">
              <el-tag size="large">{{ opt.label }}</el-tag>
              <RichEditor v-model="opt.html" placeholder="选项内容" height="100px" style="flex: 1; margin-left: 10px" />
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="removeOption(index)"
                v-if="formData.options.length > 2"
                style="margin-left: 10px"
              >
                删除
              </el-button>
            </div>
            <el-button type="primary" :icon="Plus" @click="addOption" style="margin-top: 10px">添加选项</el-button>
          </div>
        </el-form-item>

        <el-form-item label="正确答案" required>
          <div v-if="formData.question_type === 'single'">
            <el-radio-group v-model="formData.answer">
              <el-radio v-for="opt in answerOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio>
            </el-radio-group>
          </div>
          <div v-else>
            <el-checkbox-group v-model="formData.answerMultiple">
              <el-checkbox v-for="opt in answerOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</el-checkbox>
            </el-checkbox-group>
          </div>
        </el-form-item>

        <el-form-item label="答案解析">
          <RichEditor v-model="formData.explanation_html" placeholder="请输入答案解析" height="120px" />
        </el-form-item>

        <el-form-item label="难度等级">
          <el-select v-model="formData.difficulty" clearable placeholder="选择难度">
            <el-option label="L1-L2" value="L1-L2" />
            <el-option label="L2-L3" value="L2-L3" />
            <el-option label="L3-L4" value="L3-L4" />
          </el-select>
        </el-form-item>

        <el-form-item label="真题年份">
          <el-input-number v-model="formData.source_year" :min="2000" :max="2030" placeholder="真题年份" :controls="false" style="width: 150px" />
          <el-button v-if="formData.source_year" type="text" @click="formData.source_year = undefined" style="margin-left: 10px">清除</el-button>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.questions-page h2 {
  margin-bottom: 20px;
  color: #304156;
}

.action-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.options-editor {
  width: 100%;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>