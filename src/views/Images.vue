<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { imageApi, type ImageItem } from '@/api/image'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Refresh, Upload, View, Select } from '@element-plus/icons-vue'

const images = ref<ImageItem[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const size = ref(48)

const subdirs = ref<string[]>([])
const currentDirectory = ref('')
const directoryStack = ref<string[]>([])

const previewUrl = ref('')
const showPreview = ref(false)

const showUpload = ref(false)
const uploadFiles = ref<File[]>([])
const uploading = ref(false)

const selectedPaths = ref<Set<string>>(new Set())

const toggleSelect = (path: string) => {
  const s = new Set(selectedPaths.value)
  if (s.has(path)) {
    s.delete(path)
  } else {
    s.add(path)
  }
  selectedPaths.value = s
}

const selectAll = () => {
  if (selectedPaths.value.size === images.value.length) {
    selectedPaths.value = new Set()
  } else {
    selectedPaths.value = new Set(images.value.map(i => i.path))
  }
}

const clearSelection = () => {
  selectedPaths.value = new Set()
}

const directoryLabel = computed(() => {
  if (!currentDirectory.value) return '根目录'
  return currentDirectory.value
})

const breadcrumbs = computed(() => {
  const crumbs: { label: string; path: string }[] = [{ label: '根目录', path: '' }]
  if (!currentDirectory.value) return crumbs
  const parts = currentDirectory.value.split('/')
  let acc = ''
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part
    crumbs.push({ label: part, path: acc })
  }
  return crumbs
})

const loadImages = async () => {
  loading.value = true
  try {
    const res = await imageApi.list({
      directory: currentDirectory.value,
      page: page.value,
      size: size.value,
    })
    images.value = res.items
    total.value = res.total
    subdirs.value = res.subdirs
  } catch (e) {
    console.error('loadImages error:', e)
  } finally {
    loading.value = false
  }
}

const enterDirectory = (dir: string) => {
  directoryStack.value.push(currentDirectory.value)
  currentDirectory.value = currentDirectory.value ? `${currentDirectory.value}/${dir}` : dir
  page.value = 1
  clearSelection()
  loadImages()
}

const goToDirectory = (path: string) => {
  currentDirectory.value = path
  page.value = 1
  clearSelection()
  loadImages()
}

const handleDelete = async (item: ImageItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${item.filename}" 吗？此操作不可恢复。`,
      '删除图片',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
    await imageApi.delete(item.path)
    ElMessage.success('删除成功')
    loadImages()
  } catch {
    // 取消
  }
}

const handleBatchDelete = async () => {
  const count = selectedPaths.value.size
  if (count === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${count} 张图片吗？此操作不可恢复。`,
      '批量删除',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
    const result = await imageApi.batchDelete([...selectedPaths.value])
    if (result.errors.length > 0) {
      ElMessage.warning(`删除 ${result.deleted} 张，${result.errors.length} 张失败`)
    } else {
      ElMessage.success(`成功删除 ${result.deleted} 张图片`)
    }
    selectedPaths.value = new Set()
    loadImages()
  } catch {
    // 取消
  }
}

const handleSharpen = async () => {
  const count = selectedPaths.value.size
  if (count === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要对选中的 ${count} 张图片进行锐化处理吗？将生成原文件名 _sharpened 的新图片。`,
      '图片锐化',
      { type: 'info', confirmButtonText: '锐化', cancelButtonText: '取消' }
    )
    const result = await imageApi.sharpen([...selectedPaths.value])
    const success = result.results.filter(r => r.success).length
    const failed = result.results.filter(r => !r.success).length
    if (failed > 0) {
      ElMessage.warning(`锐化完成: ${success} 张成功, ${failed} 张失败`)
    } else {
      ElMessage.success(`${success} 张图片锐化完成`)
    }
    selectedPaths.value = new Set()
    loadImages()
  } catch {
    // 取消
  }
}

const handleBatchDownload = async () => {
  const count = selectedPaths.value.size
  if (count === 0) return
  try {
    const blob = await imageApi.batchDownload([...selectedPaths.value])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `images_${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    // 取消
  }
}

const openPreview = (url: string) => {
  previewUrl.value = url
  showPreview.value = true
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (iso: string): string => {
  return iso.replace('T', ' ').substring(0, 16)
}

const handleUploadChange = (_uploadFile: any, uploadFilesList: any[]) => {
  uploadFiles.value = uploadFilesList.map(f => f.raw).filter(Boolean)
  return false
}

const submitUpload = async () => {
  if (uploadFiles.value.length === 0) {
    ElMessage.warning('请选择文件')
    return
  }
  uploading.value = true
  try {
    const dir = currentDirectory.value || undefined
    await Promise.all(uploadFiles.value.map(f => imageApi.upload(f, dir)))
    ElMessage.success(`成功上传 ${uploadFiles.value.length} 个文件`)
    showUpload.value = false
    uploadFiles.value = []
    loadImages()
  } catch (e) {
    console.error('upload error:', e)
  } finally {
    uploading.value = false
  }
}

onMounted(() => {
  loadImages()
})
</script>

<template>
  <div class="images-page">
    <h2>图片管理</h2>

    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <div class="toolbar">
        <!-- 面包屑导航 -->
        <div class="breadcrumb-bar">
          <el-breadcrumb>
            <el-breadcrumb-item
              v-for="crumb in breadcrumbs"
              :key="crumb.path"
            >
              <a v-if="crumb.path !== currentDirectory" href="#" @click.prevent="goToDirectory(crumb.path)">{{ crumb.label }}</a>
              <span v-else>{{ crumb.label }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="toolbar-actions">
          <el-button :icon="Select" @click="selectAll" :type="selectedPaths.size === images.length && images.length > 0 ? 'primary' : 'default'">
            {{ selectedPaths.size === images.length && images.length > 0 ? '取消全选' : '全选' }}
          </el-button>
          <el-button type="primary" :icon="Upload" @click="showUpload = true">上传图片</el-button>
          <el-button :icon="Refresh" @click="loadImages">刷新</el-button>
        </div>
      </div>

      <!-- 子目录列表 -->
      <div v-if="subdirs.length > 0" class="subdirs-bar">
        <span class="subdirs-label">子目录：</span>
        <el-tag
          v-for="dir in subdirs"
          :key="dir"
          @click="enterDirectory(dir)"
          style="cursor: pointer; margin: 2px 4px 2px 0;"
        >
          {{ dir }}/
        </el-tag>
      </div>
    </el-card>

    <!-- 图片网格 -->
    <el-card class="grid-card" v-loading="loading">
      <!-- 批量操作栏 -->
      <div v-if="selectedPaths.size > 0" class="batch-bar">
        <span class="batch-bar-info">已选择 {{ selectedPaths.size }} 张图片</span>
        <el-button size="small" @click="clearSelection">取消选择</el-button>
        <el-button size="small" type="primary" @click="handleSharpen">变清晰</el-button>
        <el-button size="small" @click="handleBatchDownload">下载</el-button>
        <el-button size="small" type="danger" :icon="Delete" @click="handleBatchDelete">批量删除</el-button>
      </div>
      <div v-if="images.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无图片" />
      </div>

      <div v-else class="image-grid">
        <div
          v-for="item in images"
          :key="item.path"
          class="image-card"
          :class="{ selected: selectedPaths.has(item.path) }"
          @click="toggleSelect(item.path)"
        >
          <div class="image-checkbox" v-show="selectedPaths.has(item.path)">✓</div>
          <div class="image-wrapper">
            <img :src="item.url" :alt="item.filename" loading="lazy" />
          </div>
          <div class="image-info">
            <div class="image-filename" :title="item.filename">{{ item.filename }}</div>
            <div class="image-meta">
              <span>{{ formatSize(item.size) }}</span>
              <span>{{ formatDate(item.modified) }}</span>
            </div>
          </div>
          <div class="image-actions">
            <el-tooltip content="预览" placement="top">
              <el-button size="small" :icon="View" circle @click="openPreview(item.url)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button size="small" type="danger" :icon="Delete" circle @click="handleDelete(item)" />
            </el-tooltip>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > size" class="pagination-bar">
        <el-pagination
          :current-page="page"
          :page-size="size"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="(p: number) => { page = p; clearSelection(); loadImages() }"
        />
      </div>
    </el-card>

    <!-- 图片预览 Dialog -->
    <el-dialog v-model="showPreview" title="图片预览" width="auto" top="5vh" destroy-on-close>
      <img :src="previewUrl" style="max-width: 80vw; max-height: 80vh; display: block;" />
    </el-dialog>

    <!-- 上传图片 Dialog -->
    <el-dialog v-model="showUpload" title="上传图片" width="500px" destroy-on-close>
      <el-upload
        multiple
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleUploadChange"
        accept="image/*"
      >
        <el-button type="primary">选择文件</el-button>
        <span style="margin-left: 12px; font-size: 13px; color: #999;">
          支持 JPG / PNG / GIF / WebP / SVG，可多选
        </span>
      </el-upload>
      <div v-if="uploadFiles.length > 0" class="upload-file-list">
        <el-tag
          v-for="(f, i) in uploadFiles"
          :key="f.name + i"
          closable
          @close="uploadFiles.splice(i, 1)"
          style="margin: 4px 6px 4px 0;"
        >
          {{ f.name }}
        </el-tag>
      </div>
      <template #footer>
        <el-button @click="showUpload = false">取消</el-button>
        <el-button type="primary" :loading="uploading" :disabled="uploadFiles.length === 0 || uploading" @click="submitUpload">
          上传 ({{ uploadFiles.length }})
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.images-page h2 {
  margin-bottom: 20px;
  color: #304156;
}

.toolbar-card {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.subdirs-bar {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.subdirs-label {
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.grid-card {
  min-height: 300px;
}

.batch-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  margin-bottom: 16px;
  background: #ecf5ff;
  border-radius: 4px;
}

.batch-bar-info {
  font-size: 13px;
  color: #409eff;
  font-weight: 500;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.image-card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  transition: box-shadow 0.2s;
  background: #fff;
  position: relative;
  cursor: pointer;
}

.image-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.image-card.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.image-checkbox {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.image-wrapper {
  width: 100%;
  height: 150px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.image-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-info {
  padding: 8px 10px;
}

.image-filename {
  font-size: 12px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.image-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-card:hover .image-actions {
  opacity: 1;
}

.empty-state {
  padding: 60px 0;
}

.pagination-bar {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.upload-file-info {
  margin-top: 12px;
}

.upload-file-list {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
}
</style>
