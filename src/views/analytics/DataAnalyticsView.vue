<template>
  <div class="data-analytics">
    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">客户转化漏斗</span>
          </template>
          <div ref="funnelChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">跟进趋势图</span>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">本月考勤统计</span>
          </template>
          <div ref="attendanceChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">团队能力雷达图</span>
          </template>
          <div ref="radarChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '../../utils/request'

const funnelChartRef = ref()
const trendChartRef = ref()
const attendanceChartRef = ref()
const radarChartRef = ref()

const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c']

let funnelChart = null
let trendChart = null
let attendanceChart = null
let radarChart = null

function handleResize() {
  funnelChart?.resize()
  trendChart?.resize()
  attendanceChart?.resize()
  radarChart?.resize()
}

async function loadData() {
  const res = await request.get('/analytics/overview')
  if (res.code === 200) {
    await nextTick()
    initCharts(res.data)
  }
}

function initCharts(data) {
  initFunnelChart(data.funnel)
  initTrendChart(data.followTrend)
  initAttendanceChart(data.attendance)
  initRadarChart(data.teamRadar)

  window.addEventListener('resize', handleResize)
}

function initFunnelChart(funnel) {
  funnelChart = echarts.init(funnelChartRef.value)
  const categories = ['全部客户', '已跟进', '已签约']
  const values = [funnel.total, funnel.followed, funnel.signed]

  funnelChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: { left: 60, right: 30, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: '#606266' }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#909399' },
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    series: [{
      type: 'bar',
      data: values.map((val, idx) => ({
        value: val,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors[idx] },
            { offset: 1, color: colors[idx] + '80' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      })),
      barWidth: '40%',
      label: {
        show: true,
        position: 'top',
        color: '#303133',
        fontWeight: 'bold',
        formatter: '{c}'
      }
    }]
  })
}

function initTrendChart(followTrend) {
  trendChart = echarts.init(trendChartRef.value)
  const dates = (followTrend || []).map(item => item.date.substring(5))
  const counts = (followTrend || []).map(item => item.count)

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>跟进次数: {c}'
    },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLabel: {
        color: '#909399',
        interval: Math.floor(dates.length / 6)
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { color: '#909399' },
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    series: [{
      name: '跟进次数',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: counts,
      itemStyle: { color: colors[0] },
      lineStyle: { width: 2, color: colors[0] },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: colors[0] + '40' },
          { offset: 1, color: colors[0] + '05' }
        ])
      }
    }]
  })
}

function initAttendanceChart(attendance) {
  attendanceChart = echarts.init(attendanceChartRef.value)

  attendanceChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}次 ({d}%)'
    },
    legend: {
      bottom: 10,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { color: '#606266' }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      label: {
        formatter: '{b}\n{c}次 ({d}%)',
        color: '#303133'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        }
      },
      data: [
        {
          value: attendance.normal,
          name: '正常出勤',
          itemStyle: { color: colors[1] }
        },
        {
          value: attendance.late,
          name: '迟到',
          itemStyle: { color: colors[3] }
        }
      ]
    }]
  })
}

function initRadarChart(teamRadar) {
  radarChart = echarts.init(radarChartRef.value)
  const teams = teamRadar || []

  const maxScore = Math.max(...teams.map(t => t.score), 1)
  const maxCustomers = Math.max(...teams.map(t => t.customers), 1)
  const maxSigns = Math.max(...teams.map(t => t.signs), 1)

  radarChart.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: 10,
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { color: '#606266' }
    },
    radar: {
      center: ['50%', '45%'],
      radius: '55%',
      indicator: [
        { name: '团队积分', max: maxScore },
        { name: '客户数量', max: maxCustomers },
        { name: '签约数量', max: maxSigns }
      ],
      axisName: { color: '#606266' },
      splitArea: {
        areaStyle: { color: ['#fff', '#f5f7fa'] }
      },
      splitLine: { lineStyle: { color: '#dcdfe6' } },
      axisLine: { lineStyle: { color: '#dcdfe6' } }
    },
    series: [{
      type: 'radar',
      data: teams.map((team, idx) => ({
        value: [team.score, team.customers, team.signs],
        name: team.name,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: colors[idx % colors.length] },
        itemStyle: { color: colors[idx % colors.length] },
        areaStyle: { color: colors[idx % colors.length] + '30' }
      }))
    }]
  })
}

onMounted(() => loadData())

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  funnelChart?.dispose()
  trendChart?.dispose()
  attendanceChart?.dispose()
  radarChart?.dispose()
})
</script>

<style scoped>
.data-analytics {
  padding: 0;
}

.chart-card {
  border-radius: 8px;
  margin-bottom: 0;
}

.card-title {
  font-weight: bold;
  font-size: 15px;
  color: #303133;
}

.chart-container {
  height: 320px;
  width: 100%;
}

@media (max-width: 768px) {
  .chart-card {
    margin-bottom: 12px;
  }
}
</style>
