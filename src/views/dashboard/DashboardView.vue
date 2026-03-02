<template>
  <div>
    <el-row :gutter="16" style="margin-bottom: 20px;">
      <el-col :span="6" v-for="card in statCards" :key="card.title">
        <el-card shadow="hover" style="border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 14px; color: #909399;">{{ card.title }}</div>
              <div style="font-size: 28px; font-weight: bold; color: #303133; margin-top: 8px;">{{ card.value }}</div>
            </div>
            <el-icon :size="40" :style="{ color: card.color }"><component :is="card.icon" /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 20px;">
      <el-col :span="16">
        <el-card shadow="hover" style="border-radius: 8px;">
          <template #header><span style="font-weight: bold;">客户增长趋势</span></template>
          <div ref="trendChartRef" style="height: 320px;"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" style="border-radius: 8px;">
          <template #header><span style="font-weight: bold;">客户来源分布</span></template>
          <div ref="sourceChartRef" style="height: 320px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="hover" style="border-radius: 8px;">
          <template #header><span style="font-weight: bold;">意向等级分布</span></template>
          <div ref="intentionChartRef" style="height: 280px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" style="border-radius: 8px;">
          <template #header><span style="font-weight: bold;">快捷操作</span></template>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 20px 0;">
            <div v-for="action in quickActions" :key="action.path" style="text-align: center; cursor: pointer;" @click="router.push(action.path)">
              <el-icon :size="36" :style="{ color: action.color }"><component :is="action.icon" /></el-icon>
              <div style="margin-top: 8px; font-size: 13px; color: #606266;">{{ action.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import request from '../../utils/request'
import { useSync } from '../../composables/useSync'

const router = useRouter()
const stats = ref({})
const trendChartRef = ref()
const sourceChartRef = ref()
const intentionChartRef = ref()

const statCards = computed(() => [
  { title: '客户总数', value: stats.value.totalCustomers || 0, icon: 'User', color: '#409eff' },
  { title: '今日新增', value: stats.value.todayNew || 0, icon: 'Plus', color: '#67c23a' },
  { title: '今日跟进', value: stats.value.todayFollows || 0, icon: 'Phone', color: '#e6a23c' },
  { title: '已签约', value: stats.value.signedCount || 0, icon: 'CircleCheck', color: '#f56c6c' }
])

const quickActions = [
  { label: '添加客户', icon: 'UserFilled', color: '#409eff', path: '/customer/add' },
  { label: '考勤打卡', icon: 'Clock', color: '#67c23a', path: '/attendance' },
  { label: '写工作日志', icon: 'Notebook', color: '#e6a23c', path: '/worklog' },
  { label: '消息中心', icon: 'Bell', color: '#f56c6c', path: '/message' },
  { label: '团队排名', icon: 'Trophy', color: '#909399', path: '/team/ranking' },
  { label: '人才库', icon: 'Avatar', color: '#764ba2', path: '/talent' }
]

async function loadData() {
  const res = await request.get('/dashboard/stats')
  if (res.code === 200) {
    stats.value = res.data
    await nextTick()
    initCharts()
  }
}

onMounted(() => loadData())

useSync('customer:change', loadData, { message: '客户数据已更新' })

function initCharts() {
  // Trend chart
  const trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: (stats.value.trend || []).map(t => t.date.substring(5)) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ name: '新增客户', type: 'line', smooth: true, data: (stats.value.trend || []).map(t => t.count), areaStyle: { opacity: 0.3 }, itemStyle: { color: '#409eff' } }],
    grid: { left: 40, right: 20, top: 20, bottom: 30 }
  })

  // Source chart
  const sourceChart = echarts.init(sourceChartRef.value)
  sourceChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{ type: 'pie', radius: ['40%', '70%'], data: stats.value.sourceDistribution || [], emphasis: { itemStyle: { shadowBlur: 10 } } }]
  })

  // Intention chart
  const intentionChart = echarts.init(intentionChartRef.value)
  intentionChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{ type: 'pie', radius: '65%', data: stats.value.intentionDistribution || [], label: { formatter: '{b}: {c} ({d}%)' } }]
  })

  window.addEventListener('resize', () => { trendChart.resize(); sourceChart.resize(); intentionChart.resize() })
}
</script>
