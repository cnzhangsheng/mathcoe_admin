<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { reportApi, type QuestionRankingItem, type PracticeTrendItem } from '@/api/report'
import { ElMessage } from 'element-plus'
import { DIFFICULTY_LEVELS } from '@/constants/difficulty'
import VChart from 'vue-echarts'
import 'echarts'

const activeTab = ref('question-ranking')

// === 题目排行报表 ===
const hotQuestions = ref<Record<string, QuestionRankingItem[]>>({})
const favoriteQuestions = ref<Record<string, QuestionRankingItem[]>>({})
const qrLoading = ref(false)
const qrLevelTab = ref('1')

const loadQuestionRankingReport = async () => {
  qrLoading.value = true
  try {
    const data = await reportApi.getQuestionRankingReport()
    hotQuestions.value = {}
    favoriteQuestions.value = {}
    for (const [level, levelData] of Object.entries(data)) {
      hotQuestions.value[level] = levelData.hot_questions
      favoriteQuestions.value[level] = levelData.favorite_questions
    }
  } catch (e) {
    console.error('loadQuestionRankingReport error:', e)
    ElMessage.error('加载题目排行报表失败')
  } finally {
    qrLoading.value = false
  }
}

// === 答题记录趋势报表 ===
const trendItems = ref<PracticeTrendItem[]>([])
const trendDays = ref(30)
const trendLoading = ref(false)

const loadPracticeTrendReport = async () => {
  trendLoading.value = true
  try {
    const data = await reportApi.getPracticeTrendReport(trendDays.value)
    trendItems.value = data.items
  } catch (e) {
    console.error('loadPracticeTrendReport error:', e)
    ElMessage.error('加载答题记录趋势失败')
  } finally {
    trendLoading.value = false
  }
}

const trendOption = computed(() => {
  const dates = trendItems.value.map(i => i.date.slice(5))
  const practiceCounts = trendItems.value.map(i => i.practice_count)
  const userCounts = trendItems.value.map(i => i.user_count)

  return {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['每日答题量', '参与用户数'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '40px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLabel: {
        rotate: 45,
        fontSize: 11,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '答题量',
        minInterval: 1,
      },
      {
        type: 'value',
        name: '用户数',
        minInterval: 1,
      },
    ],
    series: [
      {
        name: '每日答题量',
        type: 'line',
        data: practiceCounts,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2 },
        itemStyle: { color: '#409eff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.02)' },
            ],
          },
        },
      },
      {
        name: '参与用户数',
        type: 'line',
        yAxisIndex: 1,
        data: userCounts,
        smooth: true,
        symbol: 'diamond',
        symbolSize: 6,
        lineStyle: { width: 2 },
        itemStyle: { color: '#67c23a' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(103, 194, 58, 0.25)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.02)' },
            ],
          },
        },
      },
    ],
  }
})

const changeTrendDays = (days: number) => {
  trendDays.value = days
  loadPracticeTrendReport()
}

const handleTabClick = (tab: { paneName: string }) => {
  if (tab.paneName === 'question-ranking' && Object.keys(hotQuestions.value).length === 0) {
    loadQuestionRankingReport()
  } else if (tab.paneName === 'practice-trend' && trendItems.value.length === 0) {
    loadPracticeTrendReport()
  }
}

onMounted(() => {
  loadQuestionRankingReport()
})
</script>

<template>
  <div class="reports-page">
    <h2>运营报表</h2>

    <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabClick">
      <!-- 题目排行报表 -->
      <el-tab-pane label="题目排行报表" name="question-ranking">
        <div v-loading="qrLoading">
          <el-tabs v-model="qrLevelTab" type="card" @tab-click="() => {}">
            <el-tab-pane v-for="l in DIFFICULTY_LEVELS" :key="l.value" :label="l.label" :name="String(l.value)">
              <div class="top-grid">
                <el-card>
                  <template #header><span class="card-title">🔥 热门题目 TOP 20</span></template>
                  <div v-if="hotQuestions[l.value]?.length">
                    <div v-for="(item, index) in hotQuestions[l.value]" :key="item.id" class="top-item qr-item">
                      <span class="top-rank">{{ index + 1 }}</span>
                      <div class="top-content">
                        <div class="qr-header">
                          <span class="qr-id">#{{ item.id }}</span>
                        </div>
                        <div class="qr-body" v-html="item.content"></div>
                        <div class="top-meta">
                          <span class="meta-text">{{ item.topic_title }}</span>
                          <span class="meta-text">{{ item.practice_count }} 人练习</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="empty-tip">暂无数据</div>
                </el-card>

                <el-card>
                  <template #header><span class="card-title">⭐ 收藏题目 TOP 20</span></template>
                  <div v-if="favoriteQuestions[l.value]?.length">
                    <div v-for="(item, index) in favoriteQuestions[l.value]" :key="item.id" class="top-item qr-item">
                      <span class="top-rank">{{ index + 1 }}</span>
                      <div class="top-content">
                        <div class="qr-header">
                          <span class="qr-id">#{{ item.id }}</span>
                        </div>
                        <div class="qr-body" v-html="item.content"></div>
                        <div class="top-meta">
                          <span class="meta-text">{{ item.topic_title }}</span>
                          <span class="meta-text">{{ item.favorite_count }} 人收藏</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="empty-tip">暂无数据</div>
                </el-card>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-tab-pane>

      <!-- 答题记录趋势报表 -->
      <el-tab-pane label="答题记录趋势" name="practice-trend">
        <div v-loading="trendLoading">
          <div class="trend-toolbar">
            <div class="trend-days">
              <el-radio-group :model-value="trendDays" @change="changeTrendDays">
                <el-radio-button :value="7">近 7 天</el-radio-button>
                <el-radio-button :value="14">近 14 天</el-radio-button>
                <el-radio-button :value="30">近 30 天</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <el-card>
            <div style="height: 420px">
              <v-chart v-if="trendItems.length > 0" :option="trendOption" autoresize style="height: 100%; width: 100%" />
              <div v-else class="empty-tip">暂无数据</div>
            </div>
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

.qr-item {
  align-items: flex-start;
}

.qr-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.qr-id {
  font-size: 11px;
  color: #909399;
  background: #f0f2f5;
  padding: 0 6px;
  border-radius: 3px;
  line-height: 18px;
  flex-shrink: 0;
}

.top-content {
  flex: 1;
  min-width: 0;
}

.qr-body {
  font-size: 13px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 4px;
}

.qr-body :deep(p) {
  margin: 0;
}

.qr-body :deep(img) {
  max-width: 100%;
  max-height: 120px;
  border-radius: 4px;
}

.trend-toolbar {
  margin-bottom: 16px;
}

.trend-days {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
