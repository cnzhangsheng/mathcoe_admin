<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { examPaperApi, type ExamPaper, type ExamPaperCreate } from '@/api/examPaper'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, View, Download } from '@element-plus/icons-vue'

const router = useRouter()
const examPapers = ref<ExamPaper[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const levelFilter = ref<number | undefined>(undefined)
const paperTypeFilter = ref<string | undefined>(undefined)

const showDialog = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formData = ref<ExamPaperCreate>({
  title: '',
  difficulty_level: 1,
  total_questions: 10,
  description: '',
  paper_type: 'daily'
})
const editId = ref<number | null>(null)

const levelOptions = [1, 2, 3, 4, 5, 6]
const paperTypeOptions = [
  { value: 'daily', label: '每日一练' },
  { value: 'mock', label: '模拟卷' },
  { value: 'topic', label: '专项训练' }
]

const loadExamPapers = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: size.value,
      difficulty_level: levelFilter.value,
      paper_type: paperTypeFilter.value
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
    paper_type: 'daily'
  }
  showDialog.value = true
}

const openEdit = (paper: ExamPaper) => {
  isEdit.value = true
  editId.value = paper.id
  formData.value = {
    title: paper.title,
    difficulty_level: paper.difficulty_level,
    total_questions: paper.total_questions,
    description: paper.description || '',
    paper_type: paper.paper_type
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

  submitting.value = true
  try {
    if (isEdit.value && editId.value) {
      await examPaperApi.update(editId.value, formData.value)
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
    await examPaperApi.delete(paper.id)
    ElMessage.success('删除成功')
    loadExamPapers()
  } catch (e) {
    console.error('handleDelete error:', e)
    ElMessage.error('删除失败')
  }
}

const goToDetail = (paper: ExamPaper) => {
  router.push(`/exam-papers/${paper.id}`)
}

const handleExportPdf = async (paper: ExamPaper) => {
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

onMounted(loadExamPapers)
</script>

<template>
  <div class="exam-papers-page">
    <h2>考卷管理</h2>
    <el-card>
      <div class="action-bar">
        <el-select
          v-model="levelFilter"
          clearable
          placeholder="按等级筛选"
          @change="handleFilter"
          style="width: 120px"
        >
          <el-option v-for="l in levelOptions" :key="l" :label="`Level ${l}`" :value="l" />
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
            <el-tag type="primary">Level {{ row.difficulty_level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paper_type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.paper_type === 'daily' ? 'success' : row.paper_type === 'mock' ? 'warning' : 'info'">
              {{ paperTypeOptions.find(t => t.value === row.paper_type)?.label || row.paper_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_questions" label="题目数" width="80">
          <template #default="{ row }">
            <span>{{ row.total_questions }}题</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150">
          <template #default="{ row }">
            <span>{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="340" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="goToDetail(row)">管理题目</el-button>
            <el-button type="primary" link :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
            <el-button type="success" link :icon="Download" @click="handleExportPdf(row)">生成PDF</el-button>
            <el-button v-if="row.file_path" type="warning" link :icon="Download" @click="handleDownloadPdf(row)">下载PDF</el-button>
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
        <el-form-item label="标题" required>
          <el-input v-model="formData.title" placeholder="如：袋鼠数学Level A 10题训练卷" />
        </el-form-item>
        <el-form-item label="等级" required>
          <el-select v-model="formData.difficulty_level" placeholder="选择等级">
            <el-option v-for="l in levelOptions" :key="l" :label="`Level ${l}`" :value="l" />
          </el-select>
        </el-form-item>
        <el-form-item label="题目数量">
          <el-input-number v-model="formData.total_questions" :min="1" :max="20" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="formData.paper_type" placeholder="选择类型">
            <el-option v-for="t in paperTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" placeholder="考卷描述" />
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
</style>