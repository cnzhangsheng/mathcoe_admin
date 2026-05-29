<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { examPaperApi, type ExamPaper, type ExamPaperCreate } from '@/api/examPaper'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, View, Download } from '@element-plus/icons-vue'
import { DIFFICULTY_LEVELS } from '@/constants/difficulty'

const router = useRouter()
const examPapers = ref<ExamPaper[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const titleFilter = ref('')
const levelFilter = ref<number | undefined>(undefined)
const paperTypeFilter = ref<string | undefined>(undefined)

const showDialog = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formData = ref<ExamPaperCreate & { id?: number }>({
  title: '',
  difficulty_level: 1,
  total_questions: 10,
  description: '',
  paper_type: 'daily',
  created_at: undefined
})
const editId = ref<number | null>(null)

const editingDateId = ref<number | null>(null)
const dateLoadingId = ref<number | null>(null)

const levelOptions = DIFFICULTY_LEVELS.map(l => l.value)
const paperTypeOptions = [
  { value: 'daily', label: '练习卷' },
  { value: 'mock', label: '模拟卷' },
  { value: 'topic', label: '专题卷' },
  { value: 'past', label: '真题卷' },
  { value: 'custom', label: '自编卷' }
]

const loadExamPapers = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: size.value,
      difficulty_level: levelFilter.value,
      paper_type: paperTypeFilter.value,
      title: titleFilter.value || undefined
    }
    examPapers.value = await examPaperApi.list(params)
  } catch (e) {
    console.error('loadExamPapers error:', e)
    ElMessage.error('加载考卷列表失败')
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  page.value = 1
  loadExamPapers()
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  loadExamPapers()
}

const openCreate = () => {
  isEdit.value = false
  formData.value = {
    title: '',
    difficulty_level: 1,
    total_questions: 10,
    description: '',
    paper_type: 'daily',
    id: undefined,
    created_at: undefined
  }
  showDialog.value = true
}

const openEdit = (paper: ExamPaper) => {
  isEdit.value = true
  editId.value = paper.id
  formData.value = {
    id: paper.id,
    title: paper.title,
    difficulty_level: paper.difficulty_level,
    total_questions: paper.total_questions,
    description: paper.description || '',
    paper_type: paper.paper_type,
    created_at: paper.created_at || undefined
  }
  showDialog.value = true
}

const handleSubmit = async () => {
  if (!formData.value.title) {
    ElMessage.warning('请输入考卷标题')
    return
  }
  if (!formData.value.difficulty_level) {
    ElMessage.warning('请选择考卷等级')
    return
  }
  if (isEdit.value) {
    const idStr = String(formData.value.id || '')
    if (!/^\d{12}$/.test(idStr)) {
      ElMessage.warning('考卷ID必须为12位数字')
      return
    }
  }

  submitting.value = true
  try {
    if (isEdit.value && editId.value) {
      const updateData: Record<string, any> = { ...formData.value }
      if (updateData.id === editId.value) delete updateData.id  // ID 未变则不发
      await examPaperApi.update(editId.value, updateData)
      ElMessage.success('更新成功')
    } else {
      await examPaperApi.create(formData.value)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    loadExamPapers()
  } catch (e) {
    console.error('handleSubmit error:', e)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (paper: ExamPaper) => {
  try {
    await ElMessageBox.confirm('确定要删除这张考卷吗？', '提示', { type: 'warning' })
    await examPaperApi.delete(paper.id)
    ElMessage.success('删除成功')
    loadExamPapers()
  } catch {
    // 用户取消
  }
}

const goToDetail = (paper: ExamPaper) => {
  router.push(`/exam-papers/${paper.id}`)
}

const pdfLoadingId = ref<number | null>(null)

const handleExportPdf = async (paper: ExamPaper) => {
  pdfLoadingId.value = paper.id
  try {
    const blob = await examPaperApi.exportPdf(paper.id) as Blob
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${paper.title}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('PDF 生成成功')
    loadExamPapers()
  } catch (e) {
    console.error('exportPdf error:', e)
    ElMessage.error('PDF 生成失败')
  } finally {
    pdfLoadingId.value = null
  }
}

const handleDownloadPdf = async (paper: ExamPaper) => {
  try {
    const blob = await examPaperApi.downloadPdf(paper.id) as Blob
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${paper.title}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error('downloadPdf error:', e)
    ElMessage.error('下载失败')
  }
}

const handleToggleStatus = async (row: ExamPaper, newStatus: string) => {
  try {
    await examPaperApi.update(row.id, { status: newStatus })
    ElMessage.success(newStatus === 'published' ? '已上架' : '已下架')
    loadExamPapers()
  } catch (e) {
    console.error('handleToggleStatus error:', e)
    ElMessage.error('操作失败')
  }
}

const handleDateChange = async (row: ExamPaper) => {
  if (!row.created_at) return
  dateLoadingId.value = row.id
  try {
    await examPaperApi.update(row.id, { created_at: row.created_at })
    ElMessage.success('创建时间已更新')
  } catch (e) {
    console.error('handleDateChange error:', e)
    ElMessage.error('更新失败')
    loadExamPapers()
  } finally {
    dateLoadingId.value = null
    editingDateId.value = null
  }
}

const editDate = (row: ExamPaper) => {
  editingDateId.value = row.id
}

onMounted(loadExamPapers)
</script>

<template>
  <div class="exam-papers-page">
    <h2>考卷管理</h2>
    <el-card>
      <div class="action-bar">
        <el-input
          v-model="titleFilter"
          placeholder="按标题搜索"
          clearable
          @input="handleFilter"
          style="width: 200px"
        />
        <el-select
          v-model="levelFilter"
          clearable
          placeholder="按等级筛选"
          @change="handleFilter"
          style="width: 120px"
        >
          <el-option v-for="l in DIFFICULTY_LEVELS" :key="l.value" :label="l.label" :value="l.value" />
        </el-select>
        <el-select
          v-model="paperTypeFilter"
          clearable
          placeholder="按类型筛选"
          @change="handleFilter"
          style="width: 150px"
        >
          <el-option v-for="t in paperTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增考卷</el-button>
      </div>

      <el-table :data="examPapers" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="120" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="difficulty_level" label="等级" width="100">
          <template #default="{ row }">
            <el-tag type="primary">{{ DIFFICULTY_LEVELS.find(l => l.value === row.difficulty_level)?.label || ('Level ' + row.difficulty_level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paper_type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.paper_type === 'daily' ? 'success' : row.paper_type === 'mock' ? 'warning' : row.paper_type === 'past' ? 'danger' : 'info'">
              {{ paperTypeOptions.find(t => t.value === row.paper_type)?.label || row.paper_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user_id" label="用户ID" width="100">
          <template #default="{ row }">
            <span>{{ row.user_id ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_questions" label="题目数" width="80">
          <template #default="{ row }">
            <span>{{ row.total_questions }}题</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="190">
          <template #default="{ row }">
            <template v-if="editingDateId === row.id">
              <el-date-picker
                v-model="row.created_at"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                placeholder="选择时间"
                size="small"
                :loading="dateLoadingId === row.id"
                @change="handleDateChange(row)"
                @blur="editingDateId = null"
                style="width: 170px"
              />
            </template>
            <span v-else class="editable-date" @click="editDate(row)">
              {{ row.created_at ? row.created_at.slice(0, 16).replace('T', ' ') : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150">
          <template #default="{ row }">
            <span>{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="460" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="goToDetail(row)">管理题目</el-button>
            <el-button type="primary" link :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
            <el-button type="success" link :icon="Download" :loading="pdfLoadingId === row.id" @click="handleExportPdf(row)">生成PDF</el-button>
            <el-button v-if="row.file_path" type="warning" link :icon="Download" @click="handleDownloadPdf(row)">下载PDF</el-button>
            <el-button v-if="row.status === 'published'" type="warning" size="small" @click="handleToggleStatus(row, 'unpublished')">下架</el-button>
            <el-button v-else type="success" size="small" @click="handleToggleStatus(row, 'published')">上架</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        :current-page="page"
        :page-size="size"
        :total="examPapers.length"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        style="margin-top: 20px"
      />
    </el-card>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑考卷' : '新增考卷'" width="500px">
      <el-form :model="formData" label-width="100px">
        <el-form-item v-if="isEdit" label="考卷ID">
          <el-input :model-value="formData.id ? String(formData.id) : ''" disabled />
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="formData.title" placeholder="如：Level A 10题训练卷" />
        </el-form-item>
        <el-form-item label="等级" required>
          <el-select v-model="formData.difficulty_level" placeholder="选择等级">
            <el-option v-for="l in DIFFICULTY_LEVELS" :key="l.value" :label="l.label" :value="l.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="题目数量">
          <el-input-number v-model="formData.total_questions" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="formData.paper_type" placeholder="选择类型">
            <el-option v-for="t in paperTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" placeholder="考卷描述" />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="formData.created_at"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            placeholder="选择创建时间（不填则使用当前时间）"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.exam-papers-page h2 {
  margin-bottom: 20px;
  color: #304156;
}

.action-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.editable-date {
  cursor: pointer;
  border-bottom: 1px dashed #aaa;
  padding-bottom: 1px;
}
</style>