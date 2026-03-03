<template>
  <div class="achievement-page">
    <!-- Monthly Target Progress -->
    <el-card shadow="hover" class="target-card">
      <template #header>
        <span class="card-title">本月签约目标</span>
      </template>
      <div class="target-content">
        <el-progress
          type="dashboard"
          :percentage="targetPercentage"
          :width="200"
          :stroke-width="16"
          :color="progressColors"
        >
          <template #default>
            <div class="target-text">
              <span class="target-number">{{ monthTarget.actual }}</span>
              <span class="target-divider">/</span>
              <span class="target-total">{{ monthTarget.target }}</span>
            </div>
            <div class="target-label">本月签约</div>
          </template>
        </el-progress>
        <div class="target-summary">
          <span v-if="targetPercentage >= 100" class="target-achieved">
            已达成目标!
          </span>
          <span v-else class="target-remaining">
            还差 <strong>{{ monthTarget.target - monthTarget.actual }}</strong> 单达成目标
          </span>
        </div>
      </div>
    </el-card>

    <!-- Performance Stats Cards -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="8" v-for="card in statCards" :key="card.title">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-inner">
            <div class="stat-icon-wrapper" :style="{ backgroundColor: card.bgColor }">
              <el-icon :size="28" :style="{ color: card.color }">
                <component :is="card.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-title">{{ card.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Achievement Badges -->
    <el-card shadow="hover" class="badges-card">
      <template #header>
        <span class="card-title">成就徽章</span>
      </template>
      <div class="badges-grid">
        <div
          v-for="badge in allBadges"
          :key="badge.id"
          class="badge-item"
          :class="{ 'badge-earned': badge.earned_at, 'badge-locked': !badge.earned_at }"
        >
          <div class="badge-icon">{{ badge.icon }}</div>
          <div class="badge-title">{{ badge.title }}</div>
          <div class="badge-description">{{ badge.description }}</div>
          <div v-if="badge.earned_at" class="badge-date">
            {{ formatDate(badge.earned_at) }}
          </div>
          <div v-else class="badge-date badge-date-locked">
            未解锁
          </div>
        </div>
      </div>
    </el-card>

    <!-- Performance Trend Chart -->
    <el-card shadow="hover" class="chart-card">
      <template #header>
        <span class="card-title">签约趋势 (近6个月)</span>
      </template>
      <div ref="trendChartRef" class="trend-chart"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '../../utils/request'

const loading = ref(false)
const stats = ref({ customers: 0, signed: 0, follows: 0 })
const monthTarget = ref({ target: 10, actual: 0 })
const badges = ref([])
const perfTrend = ref([])
const trendChartRef = ref()
let trendChartInstance = null

// All possible badges (earned ones will be merged from API)
const defaultBadges = [
  { id: 1, type: 'sales', title: '签约达人', description: '单月签约5单以上', icon: '🏆' },
  { id: 2, type: 'follow', title: '跟进之星', description: '累计跟进200次以上', icon: '⭐' },
  { id: 3, type: 'customer', title: '客户大师', description: '累计客户50人以上', icon: '👑' },
  { id: 4, type: 'streak', title: '连续达标', description: '连续3个月完成目标', icon: '🔥' },
  { id: 5, type: 'newbie', title: '初出茅庐', description: '完成首次签约', icon: '🎯' },
  { id: 6, type: 'diligent', title: '勤奋之星', description: '连续30天写工作日志', icon: '📝' },
]

const allBadges = computed(() => {
  const earnedMap = {}
  badges.value.forEach(b => { earnedMap[b.id] = b })
  return defaultBadges.map(db => {
    const earned = earnedMap[db.id]
    return earned ? { ...db, ...earned } : { ...db, earned_at: null }
  })
})

const targetPercentage = computed(() => {
  if (!monthTarget.value.target) return 0
  const pct = Math.round((monthTarget.value.actual / monthTarget.value.target) * 100)
  return Math.min(pct, 100)
})

const progressColors = [
  { color: '#f56c6c', percentage: 30 },
  { color: '#e6a23c', percentage: 60 },
  { color: '#409eff', percentage: 80 },
  { color: '#67c23a', percentage: 100 },
]

const statCards = computed(() => [
  {
    title: '客户总数',
    value: stats.value.customers,
    icon: 'User',
    color: '#409eff',
    bgColor: 'rgba(64,158,255,0.1)',
  },
  {
    title: '已签约',
    value: stats.value.signed,
    icon: 'CircleCheck',
    color: '#67c23a',
    bgColor: 'rgba(103,194,58,0.1)',
  },
  {
    title: '跟进次数',
    value: stats.value.follows,
    icon: 'Phone',
    color: '#e6a23c',
    bgColor: 'rgba(230,162,60,0.1)',
  },
])

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function loadData() {
  loading.value = true
  try {
    const res = await request.get('/achievements')
    if (res.code === 200) {
      const data = res.data
      badges.value = data.badges || []
      stats.value = data.stats || { customers: 0, signed: 0, follows: 0 }
      monthTarget.value = data.monthTarget || { target: 10, actual: 0 }
      perfTrend.value = data.perfTrend || []
      await nextTick()
      initChart()
    }
  } finally {
    loading.value = false
  }
}

function initChart() {
  if (!trendChartRef.value) return
  if (trendChartInstance) {
    trendChartInstance.dispose()
  }
  trendChartInstance = echarts.init(trendChartRef.value)

  const months = perfTrend.value.map(item => item.month)
  const counts = perfTrend.value.map(item => item.count)

  trendChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}<br/>签约数: <strong>{c}</strong> 单',
    },
    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 40,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: {
        color: '#606266',
        fontSize: 13,
      },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#dcdfe6' } },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: {
        color: '#909399',
      },
      splitLine: {
        lineStyle: { color: '#f0f0f0' },
      },
    },
    series: [
      {
        name: '签约数',
        type: 'bar',
        data: counts,
        barWidth: '40%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#79bbff' },
          ]),
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#337ecc' },
              { offset: 1, color: '#409eff' },
            ]),
          },
        },
      },
    ],
  })
}

function handleResize() {
  if (trendChartInstance) {
    trendChartInstance.resize()
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (trendChartInstance) {
    trendChartInstance.dispose()
    trendChartInstance = null
  }
})
</script>

<style scoped>
.achievement-page {
  padding: 0;
}

/* Target Card */
.target-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.card-title {
  font-weight: bold;
  font-size: 16px;
}

.target-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.target-text {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.target-number {
  color: #409eff;
}

.target-divider {
  color: #c0c4cc;
  margin: 0 2px;
}

.target-total {
  color: #909399;
}

.target-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.target-summary {
  margin-top: 16px;
  font-size: 15px;
  color: #606266;
}

.target-achieved {
  color: #67c23a;
  font-weight: bold;
}

.target-remaining {
  color: #909399;
}

.target-remaining strong {
  color: #f56c6c;
  font-size: 18px;
}

/* Stats Row */
.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  border-radius: 8px;
  margin-bottom: 12px;
}

.stat-card-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 26px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.stat-title {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

/* Badges Card */
.badges-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.badge-item {
  text-align: center;
  padding: 20px 12px 16px;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.badge-earned {
  background: #fff;
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.12);
}

.badge-earned:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
}

.badge-locked {
  background: #fafafa;
  border: 2px dashed #dcdfe6;
  filter: grayscale(100%);
  opacity: 0.6;
}

.badge-icon {
  font-size: 48px;
  line-height: 1;
  margin-bottom: 10px;
}

.badge-title {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 6px;
}

.badge-description {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-bottom: 8px;
}

.badge-date {
  font-size: 11px;
  color: #409eff;
  font-weight: 500;
}

.badge-date-locked {
  color: #c0c4cc;
}

/* Chart Card */
.chart-card {
  border-radius: 8px;
  margin-bottom: 16px;
}

.trend-chart {
  height: 340px;
  width: 100%;
}

/* Responsive */
@media (max-width: 768px) {
  .badges-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .badge-item {
    padding: 14px 8px 12px;
  }

  .badge-icon {
    font-size: 36px;
  }

  .badge-title {
    font-size: 13px;
  }

  .badge-description {
    font-size: 11px;
  }

  .target-text {
    font-size: 26px;
  }

  .trend-chart {
    height: 260px;
  }
}

@media (max-width: 480px) {
  .badges-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-value {
    font-size: 22px;
  }
}
</style>
