<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'

interface BackupFile {
  filename: string
  size: string
}

interface BackupGroup {
  id: string
  created_at: string
  ddl_file: BackupFile | null
  data_file: BackupFile | null
}

const loading = ref(false)
const backing = ref(false)
const backups = ref<BackupGroup[]>([])

const fetchBackups = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/admin/backups')
    backups.value = res.data?.items || res.items || []
  } catch {
    backups.value = []
  } finally {
    loading.value = false
  }
}

const handleBackup = async () => {
  try {
    await ElMessageBox.confirm('确认创建数据库备份？备份过程中服务可能短暂受到影响。', '创建备份', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  backing.value = true
  try {
    const res: any = await request.post('/admin/backups')
    ElMessage.success(res.message || '备份创建成功')
    fetchBackups()
  } catch {
    // error handled by interceptor
  } finally {
    backing.value = false
  }
}

const handleDownload = (filename: string) => {
  const url = `/api/v1/admin/backups/${encodeURIComponent(filename)}/download`
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
}

const handleDelete = async (row: BackupGroup) => {
  try {
    await ElMessageBox.confirm('确认删除该备份组？将同时删除 DDL 和数据文件，此操作不可恢复。', '删除备份', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  try {
    await request.delete(`/admin/backups/${row.id}`)
    ElMessage.success('删除成功')
    fetchBackups()
  } catch {
    // error handled by interceptor
  }
}

const formatSize = (size: string | undefined) => {
  if (!size) return '-'
  const bytes = Number(size)
  if (isNaN(bytes)) return size
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

onMounted(fetchBackups)
</script>

<template>
  <div class="data-backup">
    <div class="page-header">
      <h2>数据备份</h2>
      <el-button type="primary" :loading="backing" @click="handleBackup">
        创建备份
      </el-button>
    </div>

    <el-card>
      <el-table :data="backups" v-loading="loading" stripe>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="建表语句 (DDL)" min-width="240">
          <template #default="{ row }">
            <template v-if="row.ddl_file">
              <el-button type="primary" link size="small" @click="handleDownload(row.ddl_file.filename)">
                {{ row.ddl_file.filename }}
              </el-button>
              <span class="file-size">{{ formatSize(row.ddl_file.size) }}</span>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="数据 (DML)" min-width="240">
          <template #default="{ row }">
            <template v-if="row.data_file">
              <el-button type="primary" link size="small" @click="handleDownload(row.data_file.filename)">
                {{ row.data_file.filename }}
              </el-button>
              <span class="file-size">{{ formatSize(row.data_file.size) }}</span>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && backups.length === 0" description="暂无备份记录" />
    </el-card>
  </div>
</template>

<style scoped>
.data-backup {
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.file-size {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.text-muted {
  color: #c0c4cc;
}
</style>
