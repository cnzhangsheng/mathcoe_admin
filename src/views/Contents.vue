// @ts-nocheck
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { contentApi, type Content, type ContentCreate } from '@/api/content'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, View, CopyDocument } from '@element-plus/icons-vue'
import RichEditor from '@/components/RichEditor.vue'

const contents = ref<Content[]>([])
const loading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formData = ref<ContentCreate>({ title: '', content: '', status: 'draft' })
const SERVER_HOST = window.location.origin

const loadData = async () => {
  loading.value = true
  try {
    contents.value = await contentApi.list()
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  isEdit.value = false
  editId.value = null
  formData.value = { title: '', content: '', status: 'draft' }
  showDialog.value = true
}

const openEdit = (content: Content) => {
  isEdit.value = true
  editId.value = content.id
  formData.value = { title: content.title, content: content.content || '', status: content.status }
  showDialog.value = true
}

const handleSubmit = async () => {
  if (!formData.value.title) {
    ElMessage.warning('请输入标题')
    return
  }
  if (!formData.value.content || formData.value.content === '<p><br></p>') {
    ElMessage.warning('请输入内容')
    return
  }
  try {
    if (isEdit.value && editId.value) {
      await contentApi.update(editId.value, formData.value)
      ElMessage.success('更新成功')
    } else {
      await contentApi.create(formData.value)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    loadData()
  } catch {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (content: Content) => {
  try {
    await ElMessageBox.confirm('确认删除该内容？', '提示')
    await contentApi.delete(content.id)
    ElMessage.success('已删除')
    loadData()
  } catch {
    // cancelled
  }
}

const handlePublish = async (content: Content) => {
  const newStatus = content.status === 'published' ? 'draft' : 'published'
  try {
    await contentApi.update(content.id, { status: newStatus })
    ElMessage.success(newStatus === 'published' ? '已发布' : '已下架')
    loadData()
  } catch {
    ElMessage.error('操作失败')
  }
}

const copyLink = (content: Content) => {
  const url = `${SERVER_HOST}/content/${content.slug}`
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('链接已复制')
  })
}

const closeDialog = () => {
  showDialog.value = false
}

onMounted(() => loadData())
</script>

<template>
  <div>
    <div class="page-header">
      <h2>内容管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新建内容</el-button>
    </div>

    <el-table :data="contents" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="slug" label="链接标识" width="160" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'">
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">{{ row.created_at?.slice(0, 19) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" :icon="View" @click="copyLink(row)" v-if="row.status === 'published'">复制链接</el-button>
          <el-button size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" :type="row.status === 'published' ? 'warning' : 'success'" @click="handlePublish(row)">
            {{ row.status === 'published' ? '下架' : '发布' }}
          </el-button>
          <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑内容' : '新建内容'" width="900px" :close-on-click-modal="false" @close="closeDialog">
      <el-form label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="formData.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio value="draft">草稿</el-radio>
            <el-radio value="published">发布</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="内容">
          <RichEditor v-model="formData.content" height="400px" upload-folder="contents" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
