<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { topicApi, type Topic, type TopicCreate } from '@/api/topic'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'

const topics = ref<Topic[]>([])
const loading = ref(false)

const showDialog = ref(false)
const isEdit = ref(false)
const formData = ref<TopicCreate>({
  title: '',
  description: '',
  difficulty: '',
  icon: '',
  color: '',
  is_high_freq: false
})
const editId = ref<number | null>(null)

const loadTopics = async () => {
  loading.value = true
  try {
    topics.value = await topicApi.list()
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  isEdit.value = false
  formData.value = { title: '', description: '', difficulty: '', icon: '', color: '', is_high_freq: false }
  showDialog.value = true
}

const openEdit = (topic: Topic) => {
  isEdit.value = true
  editId.value = topic.id
  formData.value = {
    title: topic.title,
    description: topic.description || '',
    difficulty: topic.difficulty || '',
    icon: topic.icon || '',
    color: topic.color || '',
    is_high_freq: topic.is_high_freq
  }
  showDialog.value = true
}

const handleSubmit = async () => {
  if (!formData.value.title) {
    ElMessage.warning('请输入专题名称')
    return
  }
  try {
    if (isEdit.value && editId.value) {
      await topicApi.update(editId.value, formData.value)
      ElMessage.success('更新成功')
    } else {
      await topicApi.create(formData.value)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    loadTopics()
  } catch {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (topic: Topic) => {
  try {
    await topicApi.delete(topic.id)
    ElMessage.success('删除成功')
    loadTopics()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(loadTopics)
</script>

<template>
  <div class="topics-page">
    <h2>专题管理</h2>
    <el-card>
      <div class="action-bar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增专题</el-button>
      </div>
      <el-table :data="topics" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="120" />
        <el-table-column prop="title" label="名称" width="150" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="difficulty" label="难度" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.difficulty">{{ row.difficulty }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="is_high_freq" label="高频考点" width="100">
          <template #default="{ row }">
            <el-tag type="danger" v-if="row.is_high_freq">高频</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="isEdit ? '编辑专题' : '新增专题'" width="500px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="formData.title" placeholder="专题名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" placeholder="专题描述" />
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="formData.difficulty" clearable placeholder="选择难度">
            <el-option label="L1-L2" value="L1-L2" />
            <el-option label="L2-L3" value="L2-L3" />
            <el-option label="L3-L4" value="L3-L4" />
          </el-select>
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="formData.icon" placeholder="图标名称" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-input v-model="formData.color" placeholder="颜色值" />
        </el-form-item>
        <el-form-item label="高频考点">
          <el-switch v-model="formData.is_high_freq" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.topics-page h2 {
  margin-bottom: 20px;
  color: #304156;
}

.action-bar {
  margin-bottom: 20px;
}
</style>