// @ts-nocheck
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { contentApi, type Content, type ContentCreate } from '@/api/content'
import { configApi } from '@/api/config'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, View, CopyDocument } from '@element-plus/icons-vue'
import RichEditor from '@/components/RichEditor.vue'

const contents = ref<Content[]>([])
const loading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const formData = ref<ContentCreate>({ title: '', content: '', status: 'draft' })
const serverHost = ref(window.location.origin)

// 内联编辑链接标识
const editingSlugId = ref<number | null>(null)
const editingSlugValue = ref('')

// 复制链接弹窗
const showCopyDialog = ref(false)
const copyLinkUrl = ref('')

const loadData = async () => {
  loading.value = true
  try {
    contents.value = await contentApi.list()
  } finally {
    loading.value = false
  }
}

const loadConfig = async () => {
  try {
    const config = await configApi.get()
    serverHost.value = config.server_host
  } catch {
    // 保留默认的 window.location.origin 作为 fallback
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

// 内联编辑：开始编辑
const startEditSlug = (content: Content) => {
  editingSlugId.value = content.id
  editingSlugValue.value = content.slug
}

// 内联编辑：保存
const saveSlug = async (content: Content) => {
  const newSlug = editingSlugValue.value?.trim()
  if (!newSlug) {
    ElMessage.warning('链接标识不能为空')
    editingSlugValue.value = content.slug
    editingSlugId.value = null
    return
  }
  if (newSlug !== content.slug) {
    try {
      await contentApi.update(content.id, { slug: newSlug })
      content.slug = newSlug
      ElMessage.success('链接标识已更新')
    } catch {
      ElMessage.error('更新失败')
    }
  }
  editingSlugId.value = null
}

// 复制链接：弹出对话框
const copyLink = (content: Content) => {
  copyLinkUrl.value = `${serverHost.value}/content/${content.slug}`
  showCopyDialog.value = true
}

// 执行复制
const doCopy = () => {
  navigator.clipboard.writeText(copyLinkUrl.value).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  })
}

const closeDialog = () => {
  showDialog.value = false
}

onMounted(async () => {
  await loadConfig()
  loadData()
})
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
      <el-table-column label="链接标识" width="180">
        <template #default="{ row }">
          <div class="slug-cell">
            <template v-if="editingSlugId === row.id">
              <el-input
                v-model="editingSlugValue"
                size="small"
                placeholder="输入链接标识"
                @blur="saveSlug(row)"
                @keyup.enter="saveSlug(row)"
                />
            </template>
            <span v-else class="slug-text" @click="startEditSlug(row)" :title="'点击编辑: ' + row.slug">
              {{ row.slug }}
            </span>
          </div>
        </template>
      </el-table-column>
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

    <!-- 新建/编辑对话框 -->
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

    <!-- 复制链接对话框 -->
    <el-dialog v-model="showCopyDialog" title="复制链接" width="520px" :close-on-click-modal="false">
      <div class="copy-link-body">
        <p class="copy-link-label">链接地址：</p>
        <div class="copy-link-url-wrapper">
          <el-input v-model="copyLinkUrl" readonly :rows="2" type="textarea" />
          <el-button type="primary" :icon="CopyDocument" @click="doCopy">复制链接</el-button>
        </div>
      </div>
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

.slug-cell {
  min-height: 32px;
}

.slug-text {
  cursor: pointer;
  color: #409eff;
  border-bottom: 1px dashed #409eff;
  padding: 2px 4px;
  display: inline-block;
}

.slug-text:hover {
  color: #66b1ff;
  border-bottom-color: #66b1ff;
}

.copy-link-body {
  padding: 8px 0;
}

.copy-link-label {
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.copy-link-url-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.copy-link-url-wrapper .el-textarea {
  flex: 1;
}
</style>