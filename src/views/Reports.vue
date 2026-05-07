<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { reportApi, type QuestionTypeReportItem, type TopicPreferenceItem } from '@/api/report'
import { ElMessage } from 'element-plus'

const activeTab = ref('question-type')

// === 题型偏好报表 ===
const questionTypeItems = ref<QuestionTypeReportItem[]>([])
const totalPractice = ref(0)
const qtLoading = ref(false)

const loadQuestionTypeReport = async () => {
  qtLoading.value = true
  try {
    const data = await reportApi.getQuestionTypeReport()
    questionTypeItems.value = data.items
    totalPractice.value = data.total_practice
  } catch (e) {
    console.error('loadQuestionTypeReport error:', e)
    ElMessage.error('加载题型报表失败')
  } finally {
    qtLoading.value = false
  }
}

// === 知识点偏好报表 ===
const topicItems = ref<TopicPreferenceItem[]>([])
const topFavorites = ref<TopicPreferenceItem[]>([])
const topLikes = ref<TopicPreferenceItem[]>([])
const tpLoading = ref(false)

const loadTopicPreferenceReport = async () => {
  tpLoading.value = true
  try {
    const data = await reportApi.getTopicPreferenceReport()
    topicItems.value = data.items
    topFavorites.value = data.top_favorites
    topLikes.value = data.top_likes
  } catch (e) {
    console.error('loadTopicPreferenceReport error:', e)
    ElMessage.error('加载知识点报表失败')
  } finally {
    tpLoading.value = false
  }
}

const handleTabClick = (tab: { paneName: string }) => {
  if (tab.paneName === 'question-type' && questionTypeItems.value.length === 0) {
    loadQuestionTypeReport()
  } else if (tab.paneName === 'topic-preference' && topicItems.value.length === 0) {
    loadTopicPreferenceReport()
  }
}

onMounted(() => {
  loadQuestionTypeReport()
})
</script>

<template>
  <div class="reports-page">
    <h2>运营报表</h2>

    <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabClick">
      <!-- 题型偏好报表 -->
      <el-tab-pane label="用户题型偏好报表" name="question-type">
        <el-card v-loading="qtLoading">
          <div class="summary-bar">
            <span class="summary-text">总做题次数：<strong>{{ totalPractice }}</strong></span>
          </div>

          <el-table :data="questionTypeItems" stripe>
            <el-table-column label="题型" width="120">
              <template #default="{ row }">
                <el-tag :type="row.question_type === 'single' ? 'primary' : 'warning'">
                  {{ row.type_label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="做题次数" width="120" prop="practice_count" />
            <el-table-column label="做题占比" width="120">
              <template #default="{ row }">
                <span>{{ row.practice_ratio }}%</span>
                <el-progress :percentage="row.practice_ratio" :stroke-width="12" style="margin-top: 4px" />
              </template>
            </el-table-column>
            <el-table-column label="点赞数" width="100" prop="like_count" />
            <el-table-column label="点赞率" width="100">
              <template #default="{ row }">
                <span>{{ row.like_rate }}%</span>
              </template>
            </el-table-column>
            <el-table-column label="收藏数" width="100" prop="favorite_count" />
            <el-table-column label="收藏率" width="100">
              <template #default="{ row }">
                <span>{{ row.favorite_rate }}%</span>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="questionTypeItems.length === 0 && !qtLoading" class="empty-tip">
            暂无数据
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 知识点偏好报表 -->
      <el-tab-pane label="知识点偏好运营报表" name="topic-preference">
        <el-card v-loading="tpLoading" style="margin-bottom: 20px">
          <template #header>
            <span class="card-title">各知识点统计</span>
          </template>

          <el-table :data="topicItems" stripe>
            <el-table-column label="知识点" min-width="160" prop="topic_title" />
            <el-table-column label="做题人次" width="120" prop="practice_count" />
            <el-table-column label="参与人数" width="100" prop="user_count" />
            <el-table-column label="点赞数" width="100" prop="like_count" />
            <el-table-column label="收藏数" width="100" prop="favorite_count" />
          </el-table>

          <div v-if="topicItems.length === 0 && !tpLoading" class="empty-tip">
            暂无数据
          </div>
        </el-card>

        <div class="top-grid">
          <el-card>
            <template #header>
              <span class="card-title">🔥 收藏 TOP 知识点</span>
            </template>
            <div v-if="topFavorites.length > 0">
              <div v-for="(item, index) in topFavorites" :key="item.topic_id" class="top-item">
                <span class="top-rank">{{ index + 1 }}</span>
                <span class="top-name">{{ item.topic_title }}</span>
                <el-tag type="warning">{{ item.favorite_count }} 收藏</el-tag>
              </div>
            </div>
            <div v-else class="empty-tip">暂无数据</div>
          </el-card>

          <el-card>
            <template #header>
              <span class="card-title">👍 点赞 TOP 知识点</span>
            </template>
            <div v-if="topLikes.length > 0">
              <div v-for="(item, index) in topLikes" :key="item.topic_id" class="top-item">
                <span class="top-rank">{{ index + 1 }}</span>
                <span class="top-name">{{ item.topic_title }}</span>
                <el-tag type="success">{{ item.like_count }} 点赞</el-tag>
              </div>
            </div>
            <div v-else class="empty-tip">暂无数据</div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.reports-page h2 {
  margin-bottom: 20px;
  color: #304156;
}

.summary-bar {
  margin-bottom: 16px;
  font-size: 14px;
  color: #606266;
}

.summary-text strong {
  font-size: 18px;
  color: #409eff;
}

.card-title {
  font-weight: 600;
  font-size: 15px;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 14px;
}

.top-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.top-item:last-child {
  border-bottom: none;
}

.top-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f2f5;
  font-weight: 700;
  font-size: 13px;
  color: #606266;
}

.top-item:nth-child(1) .top-rank {
  background: #f56c6c;
  color: #fff;
}

.top-item:nth-child(2) .top-rank {
  background: #e6a23c;
  color: #fff;
}

.top-item:nth-child(3) .top-rank {
  background: #409eff;
  color: #fff;
}

.top-name {
  flex: 1;
  font-size: 14px;
}
</style>
