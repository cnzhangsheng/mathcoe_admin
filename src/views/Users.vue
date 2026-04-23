<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userApi, type User } from '@/api/user'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const users = ref<User[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const keyword = ref('')
const total = ref(0)

const showDetail = ref(false)
const currentUser = ref<User | null>(null)

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await userApi.list({ page: page.value, size: size.value, keyword: keyword.value })
    const countResult = await userApi.getCount()
    total.value = countResult.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  loadUsers()
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  loadUsers()
}

const viewDetail = async (user: User) => {
  try {
    currentUser.value = await userApi.getDetail(user.id)
    showDetail.value = true
  } catch {
    ElMessage.error('获取用户详情失败')
  }
}

onMounted(loadUsers)
</script>

<template>
  <div class="users-page">
    <h2>用户管理</h2>
    <el-card>
      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索用户昵称"
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
          style="width: 300px"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="120" />
        <el-table-column prop="nickname" label="昵称" width="150">
          <template #default="{ row }">
            <span>{{ row.nickname || '未设置' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="streak_days" label="连续天数" width="100">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.streak_days }} 天</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_active_date" label="最后活跃" width="120">
          <template #default="{ row }">
            <span>{{ row.last_active_date || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录" width="180">
          <template #default="{ row }">
            <span>{{ row.last_login_at || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            <span>{{ row.created_at?.split('.')[0] || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        :current-page="page"
        :page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        style="margin-top: 20px"
      />
    </el-card>

    <el-dialog v-model="showDetail" title="用户详情" width="500px">
      <el-descriptions :column="1" border v-if="currentUser">
        <el-descriptions-item label="ID">{{ currentUser.id }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentUser.nickname || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="OpenID">{{ currentUser.openid }}</el-descriptions-item>
        <el-descriptions-item label="连续打卡">{{ currentUser.streak_days }} 天</el-descriptions-item>
        <el-descriptions-item label="最后活跃">{{ currentUser.last_active_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ currentUser.last_login_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ currentUser.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<style scoped>
.users-page h2 {
  margin-bottom: 20px;
  color: #304156;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>