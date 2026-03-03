<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px; text-align: center; padding: 30px 0;">
      <div style="font-size: 48px; font-weight: bold; color: #303133;">{{ currentTime }}</div>
      <div style="color: #909399; margin: 8px 0 16px;">{{ currentDate }}</div>
      <div v-if="gpsStatus" style="color: #67c23a; font-size: 13px; margin-bottom: 16px;">
        <el-icon><Location /></el-icon> {{ gpsLocation || '定位中...' }}
      </div>
      <div v-else style="color: #e6a23c; font-size: 13px; margin-bottom: 16px;">
        <el-icon><Warning /></el-icon> 未获取定位，将使用默认位置
      </div>
      <div style="display: flex; justify-content: center; gap: 24px;">
        <el-button type="success" size="large" round :disabled="!!todayRecord?.sign_in_time" @click="signIn" style="width: 140px; height: 140px; border-radius: 50%; font-size: 18px;">
          {{ todayRecord?.sign_in_time ? '已签到' : '签到' }}
          <div v-if="todayRecord?.sign_in_time" style="font-size: 12px;">{{ todayRecord.sign_in_time?.substring(11, 16) }}</div>
        </el-button>
        <el-button type="warning" size="large" round :disabled="!todayRecord?.sign_in_time || !!todayRecord?.sign_out_time" @click="handleSignOut" style="width: 140px; height: 140px; border-radius: 50%; font-size: 18px;">
          {{ todayRecord?.sign_out_time ? '已签退' : '签退' }}
          <div v-if="todayRecord?.sign_out_time" style="font-size: 12px;">{{ todayRecord.sign_out_time?.substring(11, 16) }}</div>
        </el-button>
      </div>
      <div v-if="todayRecord?.status === 'late'" style="color: #f56c6c; margin-top: 16px;">今日迟到</div>
    </el-card>

    <!-- Monthly statistics -->
    <el-card shadow="never" style="margin-bottom: 16px;">
      <template #header><span style="font-weight: bold;">本月统计</span></template>
      <el-row :gutter="16">
        <el-col :span="6">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #67c23a;">{{ monthStats.normal }}</div>
            <div style="color: #909399; font-size: 13px; margin-top: 4px;">正常</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #f56c6c;">{{ monthStats.late }}</div>
            <div style="color: #909399; font-size: 13px; margin-top: 4px;">迟到</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #409eff;">{{ monthStats.total }}</div>
            <div style="color: #909399; font-size: 13px; margin-top: 4px;">出勤天数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #e6a23c;">{{ monthStats.overtime }}</div>
            <div style="color: #909399; font-size: 13px; margin-top: 4px;">加班次数</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold;">本月考勤</span>
          <el-button link type="primary" @click="router.push('/attendance/record')">查看全部记录</el-button>
        </div>
      </template>
      <el-table :data="recentRecords" stripe>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column label="签到" width="100">
          <template #default="{ row }">{{ row.sign_in_time?.substring(11, 16) || '-' }}</template>
        </el-table-column>
        <el-table-column label="签退" width="100">
          <template #default="{ row }">{{ row.sign_out_time?.substring(11, 16) || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'danger'" size="small">{{ row.status === 'normal' ? '正常' : '迟到' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" />
      </el-table>
    </el-card>

    <!-- Overtime confirmation dialog -->
    <el-dialog v-model="showOvertimeDialog" title="加班确认" width="400px" :close-on-click-modal="false">
      <div style="text-align: center; padding: 10px 0;">
        <el-icon :size="48" style="color: #e6a23c;"><Warning /></el-icon>
        <p style="margin: 16px 0; font-size: 16px;">当前时间已超过18:00</p>
        <p style="color: #909399;">是否确认为加班签退？</p>
      </div>
      <template #footer>
        <el-button @click="doSignOut(false)">正常签退</el-button>
        <el-button type="primary" @click="doSignOut(true)">确认加班</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { useSync } from '../../composables/useSync'

const router = useRouter()
const todayRecord = ref(null)
const recentRecords = ref([])
const currentTime = ref('')
const currentDate = ref('')
const gpsStatus = ref(false)
const gpsLocation = ref('')
const gpsCoords = ref(null)
const showOvertimeDialog = ref(false)
let timer = null

const monthStats = computed(() => {
  const records = recentRecords.value
  const normal = records.filter(r => r.status === 'normal').length
  const late = records.filter(r => r.status === 'late').length
  const overtime = records.filter(r => {
    if (!r.sign_out_time) return false
    const hour = parseInt(r.sign_out_time.substring(11, 13))
    return hour >= 18
  }).length
  return { normal, late, total: records.length, overtime }
})

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  currentDate.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

function getGPSLocation() {
  if (!navigator.geolocation) {
    gpsStatus.value = false
    return
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      gpsStatus.value = true
      gpsCoords.value = { lat: position.coords.latitude, lng: position.coords.longitude }
      gpsLocation.value = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
      // Reverse geocode via simple description
      gpsLocation.value = `GPS定位成功 (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
    },
    () => {
      gpsStatus.value = false
      gpsLocation.value = ''
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

async function loadData() {
  const [todayRes, recordRes] = await Promise.all([
    request.get('/attendance/today'),
    request.get('/attendance', { params: { pageSize: 31 } })
  ])
  if (todayRes.code === 200) todayRecord.value = todayRes.data
  if (recordRes.code === 200) recentRecords.value = recordRes.data.list
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  loadData()
  getGPSLocation()
})

useSync('attendance:change', loadData, { message: '考勤数据已更新' })

onUnmounted(() => clearInterval(timer))

async function signIn() {
  const location = gpsStatus.value ? gpsLocation.value : '公司总部'
  const res = await request.post('/attendance/sign-in', { location })
  if (res.code === 200) {
    ElMessage.success(res.message)
    const r = await request.get('/attendance/today')
    if (r.code === 200) todayRecord.value = r.data
    loadData()
  } else ElMessage.error(res.message)
}

function handleSignOut() {
  const now = new Date()
  if (now.getHours() >= 18) {
    showOvertimeDialog.value = true
  } else {
    doSignOut(false)
  }
}

async function doSignOut(isOvertime) {
  showOvertimeDialog.value = false
  const res = await request.post('/attendance/sign-out')
  if (res.code === 200) {
    ElMessage.success(isOvertime ? '加班签退成功，辛苦了！' : res.message)
    const r = await request.get('/attendance/today')
    if (r.code === 200) todayRecord.value = r.data
    loadData()
  } else ElMessage.error(res.message)
}
</script>
