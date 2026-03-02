<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px; text-align: center; padding: 30px 0;">
      <div style="font-size: 48px; font-weight: bold; color: #303133;">{{ currentTime }}</div>
      <div style="color: #909399; margin: 8px 0 24px;">{{ currentDate }}</div>
      <div style="display: flex; justify-content: center; gap: 24px;">
        <el-button type="success" size="large" round :disabled="!!todayRecord?.sign_in_time" @click="signIn" style="width: 140px; height: 140px; border-radius: 50%; font-size: 18px;">
          {{ todayRecord?.sign_in_time ? '已签到' : '签到' }}
          <div v-if="todayRecord?.sign_in_time" style="font-size: 12px;">{{ todayRecord.sign_in_time?.substring(11, 16) }}</div>
        </el-button>
        <el-button type="warning" size="large" round :disabled="!todayRecord?.sign_in_time || !!todayRecord?.sign_out_time" @click="signOut" style="width: 140px; height: 140px; border-radius: 50%; font-size: 18px;">
          {{ todayRecord?.sign_out_time ? '已签退' : '签退' }}
          <div v-if="todayRecord?.sign_out_time" style="font-size: 12px;">{{ todayRecord.sign_out_time?.substring(11, 16) }}</div>
        </el-button>
      </div>
      <div v-if="todayRecord?.status === 'late'" style="color: #f56c6c; margin-top: 16px;">今日迟到</div>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { useSync } from '../../composables/useSync'

const router = useRouter()
const todayRecord = ref(null)
const recentRecords = ref([])
const currentTime = ref('')
const currentDate = ref('')
let timer = null

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  currentDate.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

async function loadData() {
  const [todayRes, recordRes] = await Promise.all([
    request.get('/attendance/today'),
    request.get('/attendance', { params: { pageSize: 10 } })
  ])
  if (todayRes.code === 200) todayRecord.value = todayRes.data
  if (recordRes.code === 200) recentRecords.value = recordRes.data.list
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  loadData()
})

useSync('attendance:change', loadData, { message: '考勤数据已更新' })

onUnmounted(() => clearInterval(timer))

async function signIn() {
  const res = await request.post('/attendance/sign-in', { location: '公司总部' })
  if (res.code === 200) {
    ElMessage.success(res.message)
    const r = await request.get('/attendance/today')
    if (r.code === 200) todayRecord.value = r.data
  } else ElMessage.error(res.message)
}

async function signOut() {
  const res = await request.post('/attendance/sign-out')
  if (res.code === 200) {
    ElMessage.success(res.message)
    const r = await request.get('/attendance/today')
    if (r.code === 200) todayRecord.value = r.data
  } else ElMessage.error(res.message)
}
</script>
