<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { reportApi, type QuestionTypeReportItem, type TopicPreferenceItem, type ExamPaperStatsReport } from '@/api/report'
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
const tpLoading = ref(false)

const loadTopicPreferenceReport = async () => {
  tpLoading.value = true
  try {
    const data = await reportApi.getTopicPreferenceReport()
    topicItems.value = data.items
    topFavorites.value = data.top_favorites
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
  } else if (tab.paneName === 'exam-paper' && !examPaperStats.value) {
    loadExamPaperStatsReport()
  }
}

// === 考卷用户统计报表 ===
const examPaperStats = ref<ExamPaperStatsReport | null>(null)
const epLoading = ref(false)

const loadExamPaperStatsReport = async () => {
  epLoading.value = true
  try {
    examPaperStats.value = await reportApi.getExamPaperStatsReport()
  } catch (e) {
    console.error('loadExamPaperStatsReport error:', e)
    ElMessage.error('加载考卷统计报表失败')
  } finally {
    epLoading.value = false
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

          </div>
      </el-tab-pane>

      <!-- 考卷用户统计报表 -->
      <el-tab-pane label="考卷用户统计报表" name="exam-paper">
        <div v-loading="epLoading">
          <!-- 概览卡片 -->
          <div class="stats-cards" v-if="examPaperStats">
            <el-card class="stat-card">
              <div class="stat-value">{{ examPaperStats.total_tests }}</div>
              <div class="stat-label">总测试次数</div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-value">{{ examPaperStats.completed_tests }}</div>
              <div class="stat-label">已完成次数</div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-value">{{ examPaperStats.total_users }}</div>
              <div class="stat-label">参与用户数</div>
            </el-card>
            <el-card class="stat-card">
              <div class="stat-value">{{ examPaperStats.avg_score }}</div>
              <div class="stat-label">平均得分</div>
            </el-card>
          </div>

          <!-- 按类型统计 -->
          <el-card v-if="examPaperStats?.type_stats.length" style="margin-bottom: 20px">
            <template #header><span class="card-title">各类型考卷统计</span></template>
            <el-table :data="examPaperStats.type_stats" stripe>
              <el-table-column label="类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.paper_type === 'daily' ? 'success' : row.paper_type === 'mock' ? 'warning' : 'info'">{{ row.type_label }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="测试次数" width="100" prop="test_count" />
              <el-table-column label="完成次数" width="100" prop="completed_count" />
              <el-table-column label="完成率" width="100">
                <template #default="{ row }"><span>{{ row.completion_rate }}%</span></template>
              </el-table-column>
              <el-table-column label="平均分" width="100">
                <template #default="{ row }"><span>{{ row.avg_score }}</span></template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 热门考卷 TOP10 -->
          <div class="top-grid" v-if="examPaperStats?.top_papers.length">
            <el-card>
              <template #header><span class="card-title">🔥 热门考卷 TOP 10</span></template>
              <div v-for="(item, index) in examPaperStats.top_papers" :key="item.id" class="top-item">
                <span class="top-rank">{{ index + 1 }}</span>
                <span class="top-name">{{ item.title }}</span>
                <div class="top-meta">
                  <el-tag size="small" :type="item.paper_type === 'daily' ? 'success' : item.paper_type === 'mock' ? 'warning' : 'info'">{{ item.type_label }}</el-tag>
                  <span class="meta-text">{{ item.test_count }} 次</span>
                  <span class="meta-text">均分 {{ item.avg_score }}</span>
                </div>
              </div>
            </el-card>

            <el-card>
              <template #header><span class="card-title">📊 得分分布</span></template>
              <div v-for="d in examPaperStats.score_distribution" :key="d.range" class="dist-item">
                <span class="dist-label">{{ d.range }} 分</span>
                <el-progress :percentage="Math.round(d.count / Math.max(...examPaperStats.score_distribution.map(x => x.count)) * 100)" :stroke-width="18" />
                <span class="dist-count">{{ d.count }} 次</span>
              </div>
            </el-card>
          </div>

          <div v-if="!examPaperStats && !epLoading" class="empty-tip">暂无数据</div>
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.top-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.meta-text {
  color: #909399;
}

.dist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.dist-label {
  width: 60px;
  font-size: 13px;
  color: #606266;
  flex-shrink: 0;
}

.dist-item .el-progress {
  flex: 1;
}

.dist-count {
  width: 50px;
  text-align: right;
  font-size: 13px;
  color: #909399;
  flex-shrink: 0;
}
</style>
