<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { statsApi, type DashboardStats } from '@/api/stats'
import { User, Document, Collection, Timer } from '@element-plus/icons-vue'

const stats = ref<DashboardStats>({
  users_total: 0,
  questions_total: 0,
  topics_total: 0,
  records_total: 0
})

const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    stats.value = await statsApi.getDashboard()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="dashboard">
    <h2>仪表盘</h2>
    <el-row :gutter="20" v-loading="loading">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="用户总数" :value="stats.users_total">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="专题总数" :value="stats.topics_total">
            <template #prefix>
              <el-icon><Collection /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="题目总数" :value="stats.questions_total">
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="答题记录" :value="stats.records_total">
            <template #prefix>
              <el-icon><Timer /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard h2 {
  margin-bottom: 20px;
  color: #304156;
}

.stat-card {
  text-align: center;
}
</style>