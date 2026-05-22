<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userApi, type User, type UserListParams } from '@/api/user'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { DIFFICULTY_LEVELS } from '@/constants/difficulty'

const users = ref<User[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const keyword = ref('')
const gradeFilter = ref<string | undefined>(undefined)
const levelFilter = ref<number | undefined>(undefined)
const tierFilter = ref<string | undefined>(undefined)
const total = ref(0)

const gradeOptions = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']
const levelOptions = DIFFICULTY_LEVELS.map(l => l.value)
const tierOptions = [
  { label: '免费用户', value: 'free' },
  { label: 'Pro 用户', value: 'pro' },
]

const showDetail = ref(false)
const currentUser = ref<User | null>(null)

const showTierDialog = ref(false)
const editingUser = ref<User | null>(null)
const tierForm = ref({ user_tier: 'free', tier_expires_at: '' })

const loadUsers = async () => {
  loading.value = true
  try {
    const params: UserListParams = { page: page.value, size: size.value, keyword: keyword.value }
    if (gradeFilter.value) params.grade = gradeFilter.value
    if (levelFilter.value) params.difficulty_level = levelFilter.value
    if (tierFilter.value) params.user_tier = tierFilter.value
    users.value = await userApi.list(params)
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

const handleFilterChange = () => {
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

const editTier = (user: User) => {
  editingUser.value = user
  tierForm.value = {
    user_tier: user.user_tier,
    tier_expires_at: user.tier_expires_at || '',
  }
  showTierDialog.value = true
}

const saveTier = async () => {
  if (!editingUser.value) return
  try {
    const data = {
      user_tier: tierForm.value.user_tier,
      tier_expires_at: tierForm.value.user_tier === 'free' ? null : (tierForm.value.tier_expires_at || null),
    }
    await userApi.updateTier(editingUser.value.id, data)
    ElMessage.success('用户等级更新成功')
    showTierDialog.value = false
    loadUsers()
  } catch {
    ElMessage.error('更新失败')
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
          style="width: 200px"
        />
        <el-select v-model="gradeFilter" clearable placeholder="年级" @change="handleFilterChange" style="width: 100px">
          <el-option v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
        </el-select>
        <el-select v-model="levelFilter" clearable placeholder="难度" @change="handleFilterChange" style="width: 160px">
          <el-option v-for="l in DIFFICULTY_LEVELS" :key="l.value" :label="l.label" :value="l.value" />
        </el-select>
        <el-select v-model="tierFilter" clearable placeholder="用户等级" @change="handleFilterChange" style="width: 120px">
          <el-option v-for="t in tierOptions" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="openid" label="OpenID" width="200">
          <template #default="{ row }">
            <span style="font-size: 12px; font-family: monospace">{{ row.openid?.substring(0, 16) }}...</span>
          </template>
        </el-table-column>
        <el-table-column prop="user_tier" label="用户等级" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.user_tier === 'pro'" type="success" size="small">Pro</el-tag>
            <el-tag v-else type="info" size="small">免费</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tier_expires_at" label="Pro 到期" width="165">
          <template #default="{ row }">
            <span v-if="row.tier_expires_at" style="font-size: 12px">{{ row.tier_expires_at?.split('.')[0] || row.tier_expires_at }}</span>
            <span v-else-if="row.user_tier === 'pro'" style="color: #999">永久</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" width="130">
          <template #default="{ row }">
            <span>{{ row.nickname || '未设置' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="70">
          <template #default="{ row }">
            <el-tag size="small">{{ row.grade }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty_level" label="难度级别" width="90">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ DIFFICULTY_LEVELS.find(l => l.value === row.difficulty_level)?.label || ('Level ' + row.difficulty_level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="daily_goal" label="每日目标" width="80">
          <template #default="{ row }">
            <span>{{ row.daily_goal }} 题</span>
          </template>
        </el-table-column>
        <el-table-column prop="streak_days" label="连续天数" width="90">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.streak_days }} 天</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_active_date" label="最后活跃" width="105">
          <template #default="{ row }">
            <span>{{ row.last_active_date || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录" width="165">
          <template #default="{ row }">
            <span>{{ row.last_login_at || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="165">
          <template #default="{ row }">
            <span>{{ row.created_at?.split('.')[0] || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button type="warning" link @click="editTier(row)">等级</el-button>
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
        <el-descriptions-item label="OpenID">{{ currentUser.openid }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentUser.nickname || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="用户等级">
          <el-tag v-if="currentUser.user_tier === 'pro'" type="success" size="small">Pro</el-tag>
          <el-tag v-else type="info" size="small">免费</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Pro 到期">{{ currentUser.tier_expires_at || (currentUser.user_tier === 'pro' ? '永久' : '-') }}</el-descriptions-item>
        <el-descriptions-item label="年级">{{ currentUser.grade }}</el-descriptions-item>
        <el-descriptions-item label="难度级别">{{ DIFFICULTY_LEVELS.find(l => l.value === currentUser.difficulty_level)?.label || ('Level ' + currentUser.difficulty_level) }}</el-descriptions-item>
        <el-descriptions-item label="每日目标">{{ currentUser.daily_goal }} 题</el-descriptions-item>
        <el-descriptions-item label="连续打卡">{{ currentUser.streak_days }} 天</el-descriptions-item>
        <el-descriptions-item label="最后活跃">{{ currentUser.last_active_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ currentUser.last_login_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ currentUser.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="showTierDialog" title="设置用户等级" width="400px">
      <el-form :model="tierForm" label-width="100px" v-if="editingUser">
        <el-form-item label="用户">
          <span>{{ editingUser.nickname || '未设置' }}（ID: {{ editingUser.id }}）</span>
        </el-form-item>
        <el-form-item label="用户等级">
          <el-select v-model="tierForm.user_tier" style="width: 100%">
            <el-option label="免费用户" value="free" />
            <el-option label="Pro 用户" value="pro" />
          </el-select>
        </el-form-item>
        <el-form-item label="Pro 到期">
          <el-date-picker
            v-model="tierForm.tier_expires_at"
            type="datetime"
            placeholder="选择到期时间（空=永久）"
            value-format="YYYY-MM-DD HH:mm:ss"
            clearable
            style="width: 100%"
            :disabled="tierForm.user_tier !== 'pro'"
          />
          <div style="font-size: 12px; color: #999; margin-top: 4px">留空表示永久有效，仅在 Pro 等级时可设置</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTierDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTier">保存</el-button>
      </template>
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