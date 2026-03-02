<template>
  <el-card shadow="never">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">消息中心</span>
        <el-button type="primary" link @click="markAllRead">全部已读</el-button>
      </div>
    </template>
    <el-tabs v-model="activeType" @tab-change="loadData">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="系统通知" name="system" />
      <el-tab-pane label="客户消息" name="customer" />
      <el-tab-pane label="业绩提醒" name="performance" />
      <el-tab-pane label="跟进提醒" name="reminder" />
    </el-tabs>
    <div v-loading="loading">
      <div v-for="msg in list" :key="msg.id" @click="router.push(`/message/${msg.id}`)"
        style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer; display: flex; align-items: center; gap: 12px;"
        :style="{ background: msg.is_read ? '#fff' : '#f0f7ff' }">
        <el-icon :size="24" :style="{ color: typeColors[msg.type] || '#409eff' }">
          <component :is="typeIcons[msg.type] || 'Bell'" />
        </el-icon>
        <div style="flex: 1">
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: 500;">{{ msg.title }}</span>
            <span style="color: #909399; font-size: 12px;">{{ msg.created_at }}</span>
          </div>
          <div style="color: #909399; font-size: 13px; margin-top: 4px;">{{ msg.content?.substring(0, 60) }}</div>
        </div>
        <el-badge v-if="!msg.is_read" is-dot />
      </div>
      <el-empty v-if="!list.length" description="暂无消息" />
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { useSync } from '../../composables/useSync'

const router = useRouter()
const loading = ref(false)
const list = ref([])
const activeType = ref('')
const typeIcons = { system: 'Notification', customer: 'User', performance: 'TrendCharts', reminder: 'AlarmClock' }
const typeColors = { system: '#409eff', customer: '#67c23a', performance: '#e6a23c', reminder: '#f56c6c' }

onMounted(() => loadData())

useSync('message:change', loadData, { message: '消息已更新' })

async function loadData() {
  loading.value = true
  try {
    const params = activeType.value ? { type: activeType.value } : {}
    const res = await request.get('/messages', { params })
    if (res.code === 200) list.value = res.data.list
  } finally { loading.value = false }
}

async function markAllRead() {
  await request.post('/messages/read-all')
  ElMessage.success('已全部标为已读')
  loadData()
}
</script>
