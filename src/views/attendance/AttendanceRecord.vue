<template>
  <el-card shadow="never">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">考勤记录</span>
        <div>
          <el-date-picker v-model="month" type="month" placeholder="选择月份" value-format="YYYY-MM" @change="loadData" style="width: 160px;" />
        </div>
      </div>
    </template>
    <el-table :data="list" stripe v-loading="loading">
      <el-table-column prop="date" label="日期" width="120" />
      <el-table-column label="签到时间" width="120">
        <template #default="{ row }">{{ row.sign_in_time?.substring(11, 16) || '-' }}</template>
      </el-table-column>
      <el-table-column label="签退时间" width="120">
        <template #default="{ row }">{{ row.sign_out_time?.substring(11, 16) || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'normal' ? 'success' : 'danger'" size="small">{{ row.status === 'normal' ? '正常' : '迟到' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="地点" />
    </el-table>

    <div style="margin-top: 16px; color: #909399;">
      共 {{ list.length }} 条记录，正常 {{ list.filter(r => r.status === 'normal').length }} 天，迟到 {{ list.filter(r => r.status === 'late').length }} 天
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { useSync } from '../../composables/useSync'

const loading = ref(false)
const list = ref([])
const now = new Date()
const month = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

onMounted(() => loadData())

useSync('attendance:change', loadData, { message: '考勤记录已更新' })

async function loadData() {
  loading.value = true
  try {
    const [y, m] = month.value.split('-')
    const res = await request.get('/attendance', { params: { year: y, month: m, pageSize: 31 } })
    if (res.code === 200) list.value = res.data.list
  } finally { loading.value = false }
}
</script>
