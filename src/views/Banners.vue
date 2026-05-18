// @ts-nocheck
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { bannerApi, type Banner, type BannerCreate } from '@/api/banner'
import { contentApi, type Content } from '@/api/content'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Upload } from '@element-plus/icons-vue'

const banners = ref<Banner[]>([])
const contents = ref<Content[]>([])
const loading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const uploadLoading = ref(false)
const SERVER_HOST = window.location.origin

const formData = ref<BannerCreate>({
  image_url: '',
  link_type: 'content',
  link_value: '',
  title: '',
  position: 'home',
  sort_order: 0,
  is_active: true,
})

const loadData = async () => {
  loading.value = true
  try {
    banners.value = await bannerApi.list()
    contents.value = await contentApi.list({ status: 'published' })
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  isEdit.value = false
  editId.value = null
  formData.value = { image_url: '', link_type: 'content', link_value: '', title: '', position: 'home', sort_order: 0, is_active: true }
  showDialog.value = true
}

const openEdit = (banner: Banner) => {
  isEdit.value = true
  editId.value = banner.id
  formData.value = {
    image_url: banner.image_url,
    link_type: banner.link_type,
    link_value: banner.link_value,
    title: banner.title,
    position: banner.position,
    sort_order: banner.sort_order,
    is_active: banner.is_active,
  }
  showDialog.value = true
}

const handleUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadLoading.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${SERVER_HOST}/api/v1/upload/image?folder=banners`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      body: form,
    })
    const data = await res.json()
    if (data.url) {
      formData.value.image_url = data.url
      ElMessage.success('上传成功')
    }
  } catch {
    ElMessage.error('上传失败')
  } finally {
    uploadLoading.value = false
    target.value = ''
  }
}

const handleSubmit = async () => {
  if (!formData.value.image_url) {
    ElMessage.warning('请上传Banner图片')
    return
  }
  try {
    if (isEdit.value && editId.value) {
      await bannerApi.update(editId.value, formData.value)
      ElMessage.success('更新成功')
    } else {
      await bannerApi.create(formData.value)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    loadData()
  } catch {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (banner: Banner) => {
  try {
    await ElMessageBox.confirm('确认删除该Banner？', '提示')
    await bannerApi.delete(banner.id)
    ElMessage.success('已删除')
    loadData()
  } catch {
    // cancelled
  }
}

const getPublishedContentList = () => {
  return contents.value.filter(c => c.status === 'published')
}

onMounted(() => loadData())
</script>

<template>
  <div>
    <div class="page-header">
      <h2>Banner 管理</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate">新建 Banner</el-button>
    </div>

    <el-table :data="banners" v-loading="loading" stripe>
      <el-table-column label="图片" width="160">
        <template #default="{ row }">
          <el-image v-if="row.image_url" :src="row.image_url" style="width: 120px; height: 60px; border-radius: 8px;" fit="cover" />
          <span v-else class="no-image">无图片</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="140" />
      <el-table-column label="展示位置" width="100">
        <template #default="{ row }">
          <el-tag size="small">{{ row.position === 'home' ? '首页' : row.position === 'discover' ? '探索' : row.position === 'topics' ? '专题' : row.position }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="链接" min-width="200">
        <template #default="{ row }">
          <el-tag size="small" :type="row.link_type === 'content' ? 'primary' : 'warning'" style="margin-right: 8px;">
            {{ row.link_type === 'content' ? '内容' : '外部' }}
          </el-tag>
          <span class="link-value">{{ row.link_value }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="80" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'info'">{{ row.is_active ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑 Banner' : '新建 Banner'" width="600px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="Banner图片">
          <div class="upload-area">
            <img v-if="formData.image_url" :src="formData.image_url" class="preview-img" />
            <div v-else class="upload-placeholder">
              <el-icon :size="32"><Upload /></el-icon>
              <span>点击上传</span>
            </div>
            <input type="file" accept="image/*" class="upload-input" @change="handleUpload" />
          </div>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="formData.title" placeholder="Banner标题（alt文本）" />
        </el-form-item>
        <el-form-item label="展示位置">
          <el-radio-group v-model="formData.position">
            <el-radio value="home">首页</el-radio>
            <el-radio value="discover">探索</el-radio>
            <el-radio value="topics">专题</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="链接类型">
          <el-radio-group v-model="formData.link_type">
            <el-radio value="content">内部内容</el-radio>
            <el-radio value="external">外部链接</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="formData.link_type === 'content' ? '选择内容' : '链接地址'">
          <el-select v-if="formData.link_type === 'content'" v-model="formData.link_value" placeholder="请选择已发布的内容" filterable style="width: 100%;">
            <el-option v-for="c in getPublishedContentList()" :key="c.id" :label="c.title" :value="c.slug" />
          </el-select>
          <el-input v-else v-model="formData.link_value" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formData.sort_order" :min="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="formData.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="uploadLoading">保存</el-button>
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
.link-value {
  font-size: 12px;
  color: #666;
}
.no-image {
  color: #999;
  font-size: 12px;
}
.upload-area {
  position: relative;
  width: 100%;
  max-width: 400px;
  min-height: 120px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}
.upload-area:hover {
  border-color: #409eff;
}
.preview-img {
  width: 100%;
  max-height: 160px;
  object-fit: cover;
  display: block;
}
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: #999;
}
.upload-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
</style>
