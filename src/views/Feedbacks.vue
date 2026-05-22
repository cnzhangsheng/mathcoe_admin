<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { feedbackApi, type Feedback, type FeedbackUpdate } from '@/api/feedback'
import { ElMessage } from 'element-plus'
import { ChatDotSquare, Edit } from '@element-plus/icons-vue'

const feedbacks = ref<Feedback[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const size = ref(20)
const statusFilter = ref('')

const showReplyDialog = ref(false)
const currentFeedback = ref<Feedback | null>(null)
const replyForm = ref<FeedbackUpdate>({ admin_reply: '', status: 'resolved' })

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已处理' },
]

const statusTagType = (status: string) => {
  const map: Record<string, string> = { pending: 'danger', processing: 'warning', resolved: 'success' }
  return map[status] || 'info'
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = { pending: '待处理', processing: '处理中', resolved: '已处理' }
  return map[status] || status
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = { page: page.value, size: size.value }
    if (statusFilter.value) params.status = statusFilter.value
    feedbacks.value = await feedbackApi.list(params)
  } finally {
    loading.value = false
  }
}

const openReply = (feedback: Feedback) => {
  currentFeedback.value = feedback
  replyForm.value = {
    admin_reply: feedback.admin_reply || '',
    status: feedback.status === 'resolved' ? 'resolved' : 'processing',
  }
  showReplyDialog.value = true
}

const handleReply = async () => {
  if (!currentFeedback.value) return
  try {
    await feedbackApi.update(currentFeedback.value.id, replyForm.value)
    ElMessage.success('已保存')
    showReplyDialog.value = false
    loadData()
  } catch {
    ElMessage.error('操作失败')
  }
}

const onStatusFilter = () => {
  page.value = 1
  loadData()
}

onMounted(() => loadData())
</script>

<template>
  <div>
    <div class="page-header">
      <h2>意见反馈</h2>
      <div class="filter-bar">
        <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 140px" @change="onStatusFilter">
          <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>
    </div>

    <el-table :data="feedbacks" v-loading="loading" stripe default-expand-all>
      <el-table-column prop="id" label="ID" width="100" />
      <el-table-column prop="user_id" label="用户ID" width="100" />
      <el-table-column label="反馈内容" min-width="240">
        <template #default="{ row }">
          <div class="content-cell">{{ row.content }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="contact" label="联系方式" width="160">
        <template #default="{ row }">
          <span :class="{ 'text-muted': !row.contact }">{{ row.contact || '未填写' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="管理员回复" min-width="180">
        <template #default="{ row }">
          <div v-if="row.admin_reply" class="content-cell">{{ row.admin_reply }}</div>
          <span v-else class="text-muted">未回复</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="提交时间" width="170" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" :icon="ChatDotSquare" @click="openReply(row)">回复</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showReplyDialog" title="回复反馈" width="640px" :close-on-click-modal="false">
      <template v-if="currentFeedback">
        <el-descriptions :column="1" border size="small" class="feedback-detail">
          <el-descriptions-item label="用户ID">{{ currentFeedback.user_id }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ currentFeedback.contact || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentFeedback.status)" size="small">{{ statusLabel(currentFeedback.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentFeedback.created_at }}</el-descriptions-item>
          <el-descriptions-item label="反馈内容">
            <div class="feedback-content-text">{{ currentFeedback.content }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <el-form label-width="80px" style="margin-top: 20px">
          <el-form-item label="回复内容">
            <el-input v-model="replyForm.admin_reply" type="textarea" :rows="4" placeholder="输入回复内容..." />
          </el-form-item>
          <el-form-item label="处理状态">
            <el-select v-model="replyForm.status" style="width: 160px">
              <el-option value="processing" label="处理中" />
              <el-option value="resolved" label="已处理" />
            </el-select>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="showReplyDialog = false">取消</el-button>
        <el-button type="primary" @click="handleReply">保存</el-button>
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
.filter-bar {
  display: flex;
  gap: 12px;
}
.content-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.text-muted {
  color: #999;
}
.feedback-content-text {
  white-space: pre-wrap;
  line-height: 1.6;
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 6px;
}
.feedback-detail {
  margin-bottom: 4px;
}
</style>