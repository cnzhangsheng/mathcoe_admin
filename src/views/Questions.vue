<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { questionApi, type Question, type QuestionCreate } from '@/api/question'
import { topicApi, type Topic } from '@/api/topic'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Upload, Download, FolderOpened } from '@element-plus/icons-vue'
import RichEditor from '@/components/RichEditor.vue'
import { DIFFICULTY_LEVELS } from '@/constants/difficulty'

const questions = ref<Question[]>([])
const topics = ref<Topic[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(30)
const topicFilter = ref<number | undefined>(undefined)
const difficultyLevelFilter = ref<number | undefined>(undefined)
const yearFilter = ref<number | undefined>(undefined)
const statusFilter = ref<string | undefined>(undefined)
const contentFilter = ref<string>('')
const sortOrder = ref<string>('desc')
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
  difficulty_level: number | undefined
  source_year: number | undefined
  tags: string[]
}>({
  title: '',
  topic_id: undefined,
  question_type: 'single',
  content_html: '',
  options: [
    { label: 'A', html: '' },
    { label: 'B', html: '' },
    { label: 'C', html: '' },
    { label: 'D', html: '' },
    { label: 'E', html: '' }
  ],
  answer: '',
  answerMultiple: [],
  explanation_html: '',
  difficulty_level: undefined,
  source_year: undefined,
  tags: []
})

const editId = ref<number | null>(null)

const explanationDialogVisible = ref(false)
const editingExplanationQuestion = ref<Question | null>(null)
const explanationContent = ref('')

const openExplanationDialog = (question: Question) => {
  editingExplanationQuestion.value = question
  explanationContent.value = question.explanation?.text || ''
  explanationDialogVisible.value = true
}

const submitExplanation = async () => {
  const question = editingExplanationQuestion.value
  if (!question) return
  await saveExplanation(question, explanationContent.value)
  explanationDialogVisible.value = false
}

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
    const params: { page: number; size: number; topic_id?: number; difficulty_level?: number; source_year?: number; status?: string; content?: string; sort_order?: string } = {
      page: page.value,
      size: size.value,
      sort_order: sortOrder.value
    }
    if (topicFilter.value) params.topic_id = topicFilter.value
    if (difficultyLevelFilter.value) params.difficulty_level = difficultyLevelFilter.value
    if (yearFilter.value) params.source_year = yearFilter.value
    if (statusFilter.value) params.status = statusFilter.value
    if (contentFilter.value) params.content = contentFilter.value
    questions.value = await questionApi.list(params)
    const countResult = await questionApi.getCount({
      topic_id: topicFilter.value,
      difficulty_level: difficultyLevelFilter.value,
      source_year: yearFilter.value,
      status: statusFilter.value,
      content: contentFilter.value || undefined,
    })
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
      { label: 'D', html: '' },
      { label: 'E', html: '' }
    ],
    answer: '',
    answerMultiple: [],
    explanation_html: '',
    difficulty_level: undefined,
    source_year: undefined
  }
  showDialog.value = true
}

const openEdit = (question: Question) => {
  try {
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
      answer: question.question_type === 'multiple' ? '' : (question.answer || ''),
      answerMultiple: question.question_type === 'multiple' ? (question.answer || '').split(',') : [],
      explanation_html: explanationHtml,
      difficulty_level: question.difficulty_level,
      source_year: question.source_year,
      tags: question.tags || []
    }
    showDialog.value = true
  } catch (e) {
    console.error('openEdit error:', e)
    ElMessage.error('打开编辑对话框失败')
  }
}

const handleSubmit = async () => {
  if (submitting.value) return

  // 必选字段验证
  if (!formData.value.difficulty_level) {
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
      difficulty_level: formData.value.difficulty_level,
      source_year: formData.value.source_year,
      tags: formData.value.tags
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

const handlePublish = async (question: Question) => {
  try {
    await questionApi.publish(question.id)
    ElMessage.success('上架成功')
    loadQuestions()
  } catch (e) {
    console.error('handlePublish error:', e)
    ElMessage.error('上架失败')
  }
}

const handleUnpublish = async (question: Question) => {
  try {
    await ElMessageBox.confirm('确定要下架这道题目吗？下架后用户将不可见。', '提示', { type: 'warning' })
    await questionApi.unpublish(question.id)
    ElMessage.success('下架成功')
    loadQuestions()
  } catch {
    // 用户取消
  }
}

const editingCell = ref<Record<string, boolean>>({})

const showBatchDialog = ref(false)
const batchExcel = ref<File | null>(null)
const batchZip = ref<File | null>(null)
const batchImporting = ref(false)
const batchResult = ref<{ total: number; imported: number; failed: number; errors: { row: number; message: string }[] } | null>(null)

const handleBatchExcelChange = (file: File) => {
  batchExcel.value = file
  return false  // prevent auto-upload
}

const handleBatchZipChange = (file: File) => {
  batchZip.value = file
  return false
}

const openBatchDialog = () => {
  batchExcel.value = null
  batchZip.value = null
  batchResult.value = null
  showBatchDialog.value = true
}

const downloadTemplate = async () => {
  try {
    const response = await questionApi.downloadTemplate()
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'batch_import_template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('downloadTemplate error:', e)
    ElMessage.error('模板下载失败')
  }
}

const submitBatchImport = async () => {
  if (!batchExcel.value) {
    ElMessage.warning('请选择 Excel 文件')
    return
  }

  batchImporting.value = true
  batchResult.value = null
  try {
    const res = await questionApi.batchImport(batchExcel.value, batchZip.value || undefined)
    batchResult.value = res.data
    if (res.data.failed === 0) {
      ElMessage.success(`成功导入 ${res.data.imported} 道题目`)
    } else {
      ElMessage.warning(`导入完成: ${res.data.imported} 成功, ${res.data.failed} 失败`)
    }
    loadQuestions()
  } catch (e) {
    console.error('batchImport error:', e)
    ElMessage.error('批量导入失败')
  } finally {
    batchImporting.value = false
  }
}

const removeBatchFile = (type: 'excel' | 'zip') => {
  if (type === 'excel') batchExcel.value = null
  else batchZip.value = null
}

const startEdit = (id: number, field: string) => {
  editingCell.value[`${id}-${field}`] = true
}

const stopEdit = (id: number, field: string) => {
  editingCell.value[`${id}-${field}`] = false
}

const saveField = async (question: Question, field: string, value: any) => {
  try {
    await questionApi.update(question.id, { [field]: value } as QuestionUpdate)
    ;(question as any)[field] = value
    ElMessage.success('更新成功')
  } catch (e) {
    console.error('saveField error:', e)
    ElMessage.error('更新失败')
  } finally {
    stopEdit(question.id, field)
  }
}

const saveExplanation = async (question: Question, value: string) => {
  try {
    await questionApi.update(question.id, { explanation: { text: value } })
    question.explanation = { text: value }
    ElMessage.success('更新成功')
  } catch (e) {
    console.error('saveExplanation error:', e)
    ElMessage.error('更新失败')
  } finally {
    stopEdit(question.id, 'explanation')
  }
}

const getOptionLabels = (question: Question): string[] => {
  if (!question.options) return ['A', 'B', 'C', 'D', 'E']
  return question.options.map(o => o.label)
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

const handleBatchPublish = async () => {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请先选择要上架的题目')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要上架选中的 ${selectedQuestions.value.length} 道题目吗？`,
      '批量上架',
      { type: 'info' }
    )
    const ids = selectedQuestions.value.map(q => q.id)
    const result = await questionApi.batchPublish(ids)
    ElMessage.success(result.message)
    loadQuestions()
  } catch {
    // 用户取消
  }
}

const handleBatchUnpublish = async () => {
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning('请先选择要下架的题目')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要下架选中的 ${selectedQuestions.value.length} 道题目吗？`,
      '批量下架',
      { type: 'warning' }
    )
    const ids = selectedQuestions.value.map(q => q.id)
    const result = await questionApi.batchUnpublish(ids)
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
      <div class="filter-bar">
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
          v-model="difficultyLevelFilter"
          clearable
          placeholder="按难度级别筛选"
          @change="handleFilter"
          style="width: 160px"
        >
          <el-option v-for="l in DIFFICULTY_LEVELS" :key="l.value" :label="l.label" :value="l.value" />
        </el-select>
        <el-input-number
          v-model="yearFilter"
          :min="2000"
          :max="2030"
          :controls="false"
          placeholder="输入年份"
          @change="handleFilter"
          style="width: 140px"
        />
        <el-select
          v-model="statusFilter"
          clearable
          placeholder="按状态筛选"
          @change="handleFilter"
          style="width: 140px"
        >
          <el-option label="已发布" value="published" />
          <el-option label="未发布" value="unpublished" />
        </el-select>
        <el-input
          v-model="contentFilter"
          clearable
          placeholder="搜索题目内容"
          @change="handleFilter"
          style="width: 200px"
        />
        <el-select
          v-model="sortOrder"
          placeholder="ID排序"
          @change="handleFilter"
          style="width: 120px"
        >
          <el-option label="ID降序" value="desc" />
          <el-option label="ID升序" value="asc" />
        </el-select>
      </div>
      <div class="action-bar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增题目</el-button>
        <el-button type="success" :icon="FolderOpened" @click="openBatchDialog">批量导入</el-button>
        <el-button
          type="danger"
          :icon="Delete"
          @click="handleBatchDelete"
          :disabled="selectedQuestions.length === 0"
        >
          批量删除 ({{ selectedQuestions.length }})
        </el-button>
        <el-button
          type="success"
          @click="handleBatchPublish"
          :disabled="selectedQuestions.length === 0"
        >
          批量上架
        </el-button>
        <el-button
          type="warning"
          @click="handleBatchUnpublish"
          :disabled="selectedQuestions.length === 0"
        >
          批量下架
        </el-button>
      </div>

      <el-table :data="questions" v-loading="loading" stripe @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column label="序号" width="70">
          <template #default="{ $index }">
            <span>{{ (page - 1) * size + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="topic_id" label="专题" width="140">
          <template #default="{ row }">
            <div v-if="!editingCell[`${row.id}-topic`]" @click="startEdit(row.id, 'topic')" style="cursor: pointer; min-height: 24px;">
              <span>{{ topics.find(t => t.id === row.topic_id)?.title || '-' }}</span>
            </div>
            <el-select
              v-else
              :model-value="row.topic_id"
              @change="(val: number) => saveField(row, 'topic_id', val)"
              @visible-change="(visible: boolean) => { if (!visible) stopEdit(row.id, 'topic') }"
              size="small"
              style="width: 130px;"
              autofocus
            >
              <el-option v-for="t in topics" :key="t.id" :label="t.title" :value="t.id" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="题目内容" min-width="400">
          <template #default="{ row }">
            <span class="content-text">{{ row.content?.text ? row.content.text.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim() : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="question_type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.question_type === 'single' ? 'primary' : 'warning'">
              {{ row.question_type === 'single' ? '单选' : '多选' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="answer" label="答案" width="120">
          <template #default="{ row }">
            <div v-if="!editingCell[`${row.id}-answer`]" @click="startEdit(row.id, 'answer')" style="cursor: pointer; min-height: 24px;">
              <el-tag type="success">{{ row.answer || '-' }}</el-tag>
            </div>
            <el-select
              v-else
              :model-value="row.answer"
              @change="(val: string) => saveField(row, 'answer', val)"
              @visible-change="(visible: boolean) => { if (!visible) stopEdit(row.id, 'answer') }"
              size="small"
              style="width: 100px;"
              autofocus
            >
              <el-option v-for="label in getOptionLabels(row)" :key="label" :label="label" :value="label" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="答案解析" min-width="200">
          <template #default="{ row }">
            <div style="cursor: pointer; min-height: 24px;" @click="openExplanationDialog(row)">
              <span class="explanation-text">{{ row.explanation?.text ? row.explanation.text.replace(/<[^>]+>/g, '').trim() || '(空)' : '(空)' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="难度" width="80">
          <template #default="{ row }">
            <div v-if="!editingCell[`${row.id}-difficulty`]" @click="startEdit(row.id, 'difficulty')" style="cursor: pointer; min-height: 24px;">
              <el-tag v-if="row.difficulty_level" type="info">{{ DIFFICULTY_LEVELS.find(l => l.value === row.difficulty_level)?.label || ('L' + row.difficulty_level) }}</el-tag>
              <span v-else>-</span>
            </div>
            <el-select
              v-else
              :model-value="row.difficulty_level"
              @change="(val: number) => saveField(row, 'difficulty_level', val)"
              @visible-change="(visible: boolean) => { if (!visible) stopEdit(row.id, 'difficulty') }"
              size="small"
              style="width: 80px;"
              autofocus
            >
              <el-option v-for="l in DIFFICULTY_LEVELS" :key="l.value" :label="l.label" :value="l.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="160">
          <template #default="{ row }">
            <div v-if="!editingCell[`${row.id}-tags`]" @click="startEdit(row.id, 'tags')" style="cursor: pointer; min-height: 24px;">
              <el-tag v-for="tag in (row.tags || [])" :key="tag" size="small" style="margin: 1px 2px;">{{ tag }}</el-tag>
              <span v-if="!row.tags || row.tags.length === 0" style="color: #c0c4cc;">点击设置标签</span>
            </div>
            <el-select
              v-else
              :model-value="row.tags || []"
              multiple
              filterable
              allow-create
              default-first-option
              size="small"
              style="width: 150px;"
              @change="(val: string[]) => saveField(row, 'tags', val)"
              @blur="() => stopEdit(row.id, 'tags')"
              @visible-change="(visible: boolean) => { if (!visible) stopEdit(row.id, 'tags') }"
              autofocus
            >
              <el-option v-for="tag in (row.tags || [])" :key="tag" :label="tag" :value="tag" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="年份" width="100">
          <template #default="{ row }">
            <div v-if="!editingCell[`${row.id}-year`]" @click="startEdit(row.id, 'year')" style="cursor: pointer; min-height: 24px;">
              <span>{{ row.source_year || '-' }}</span>
            </div>
            <el-input-number
              v-else
              :model-value="row.source_year"
              :min="2000"
              :max="2030"
              size="small"
              :controls="false"
              style="width: 90px;"
              @change="(val: number | undefined) => saveField(row, 'source_year', val || null)"
              @blur="() => stopEdit(row.id, 'year')"
              autofocus
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '未发布' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
            <el-button
              v-if="row.status === 'published'"
              type="warning"
              link
              :icon="Download"
              @click="handleUnpublish(row)"
            >
              下架
            </el-button>
            <el-button
              v-else
              type="success"
              link
              :icon="Upload"
              @click="handlePublish(row)"
            >
              上架
            </el-button>
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

    <!-- 批量导入弹窗 -->
    <el-dialog v-model="showBatchDialog" title="批量导入题目" width="600px" top="10vh">
      <el-form label-width="100px">
        <el-form-item label="Excel 文件" required>
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :on-change="(u) => handleBatchExcelChange(u.raw as File)"
            accept=".xlsx,.xls"
          >
            <el-button type="primary" v-if="!batchExcel">选择文件</el-button>
            <el-tag v-else closable @close="removeBatchFile('excel')">
              {{ batchExcel.name }}
            </el-tag>
          </el-upload>
          <el-button type="text" @click="downloadTemplate" style="margin-left: 12px">下载模板</el-button>
        </el-form-item>

        <el-form-item label="图片包(ZIP)">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :on-change="(u) => handleBatchZipChange(u.raw as File)"
            accept=".zip"
          >
            <el-button type="primary" v-if="!batchZip">选择文件</el-button>
            <el-tag v-else closable @close="removeBatchFile('zip')">
              {{ batchZip.name }}
            </el-tag>
          </el-upload>
          <span class="el-form-item__tip">可选，图片命名规则：{题号}.png、{题号}{字母}.png</span>
        </el-form-item>

        <!-- 导入结果 -->
        <el-form-item label="导入结果" v-if="batchResult">
          <div class="batch-result">
            <div class="result-summary">
              <el-tag type="success">成功: {{ batchResult.imported }}</el-tag>
              <el-tag type="danger" v-if="batchResult.failed > 0" style="margin-left: 10px">失败: {{ batchResult.failed }}</el-tag>
            </div>
            <el-table v-if="batchResult.errors.length > 0" :data="batchResult.errors" size="small" max-height="200" style="margin-top: 10px">
              <el-table-column prop="row" label="行号" width="60" />
              <el-table-column prop="message" label="错误信息" />
            </el-table>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showBatchDialog = false">关闭</el-button>
        <el-button type="primary" :loading="batchImporting" :disabled="batchImporting || !batchExcel" @click="submitBatchImport">
          开始导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑题目弹窗 -->
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑题目' : '新增题目'" width="900px" top="3vh">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="题目级别" required>
          <el-select v-model="formData.difficulty_level" placeholder="选择级别" style="width: 100%">
            <el-option v-for="l in DIFFICULTY_LEVELS" :key="l.value" :label="l.label" :value="l.value" />
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


        <el-form-item label="真题年份">
          <el-input-number v-model="formData.source_year" :min="2000" :max="2030" placeholder="真题年份" :controls="false" style="width: 150px" />
          <el-button v-if="formData.source_year" type="text" @click="formData.source_year = undefined" style="margin-left: 10px">清除</el-button>
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签后按回车添加"
            style="width: 100%"
          >
            <el-option v-for="tag in formData.tags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 答案解析编辑弹窗 -->
    <el-dialog v-model="explanationDialogVisible" title="编辑答案解析" width="700px">
      <RichEditor v-model="explanationContent" placeholder="请输入答案解析" height="250px" />
      <template #footer>
        <el-button @click="explanationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitExplanation">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.questions-page h2 {
  margin-bottom: 20px;
  color: #304156;
}

.filter-bar {
  margin-bottom: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.action-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
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

.content-text {
  color: #333;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.explanation-text {
  color: #666;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.batch-result {
  width: 100%;
}

.result-summary {
  display: flex;
  align-items: center;
}
</style>
