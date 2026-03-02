<template>
  <el-card shadow="never" v-loading="loading">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">{{ message.title }}</span>
        <el-button @click="router.back()">返回</el-button>
      </div>
    </template>
    <div style="color: #909399; margin-bottom: 16px; font-size: 13px;">
      <el-tag size="small" style="margin-right: 8px;">{{ { system: '系统', customer: '客户', performance: '业绩', reminder: '提醒' }[message.type] || message.type }}</el-tag>
      {{ message.created_at }}
    </div>
    <div style="line-height: 1.8; color: #303133;">{{ message.content }}</div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const message = ref({})

onMounted(async () => {
  loading.value = true
  try {
    const res = await request.get(`/messages/${route.params.id}`)
    if (res.code === 200) message.value = res.data
  } finally { loading.value = false }
})
</script>
