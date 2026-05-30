<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userDownloadApi, type UserDownloadRecord, type UserDownloadListParams } from '@/api/userDownload'
import { Search } from '@element-plus/icons-vue'

const records = ref<UserDownloadRecord[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const total = ref(0)
const keyword = ref('')
const userIdFilter = ref<number | undefined>(undefined)

const loadRecords = async () => {
  loading.value = true
  try {
    const params: UserDownloadListParams = {
      page: page.value,
      size: size.value,
      keyword: keyword.value || undefined,
      user_id: userIdFilter.value || undefined,
    }
    const result = await userDownloadApi.list(params)
    records.value = result.items
    total.value = result.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  loadRecords()
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  loadRecords()
}

onMounted(loadRecords)
</script>

<template>
  <div class="pdf-downloads-page">
    <h2>PDF 下载记录</h2>
    <el-card>
      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索考卷标题"
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
          style="width: 200px"
        />
        <el-input
          v-model.number="userIdFilter"
          placeholder="用户ID"
          clearable
          @keyup.enter="handleSearch"
          style="width: 150px"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
      <el-table :data="records" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="user_id" label="用户ID" width="100" />
        <el-table-column prop="exam_paper_id" label="考卷ID" width="100" />
        <el-table-column prop="exam_paper_title" label="考卷标题" min-width="200" />
        <el-table-column prop="downloaded_at" label="下载时间" width="180">
          <template #default="{ row }">
            <span>{{ row.downloaded_at?.split('.')[0] || '-' }}</span>
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
  </div>
</template>

<style scoped>
.pdf-downloads-page h2 {
  margin-bottom: 20px;
  color: #304156;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>