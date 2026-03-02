<template>
  <el-card shadow="never" v-loading="loading">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">人才详情</span>
        <el-button @click="router.back()">返回</el-button>
      </div>
    </template>
    <el-descriptions :column="2" border>
      <el-descriptions-item label="姓名">{{ talent.name }}</el-descriptions-item>
      <el-descriptions-item label="手机">{{ talent.phone }}</el-descriptions-item>
      <el-descriptions-item label="性别">{{ talent.gender }}</el-descriptions-item>
      <el-descriptions-item label="学历">{{ talent.education }}</el-descriptions-item>
      <el-descriptions-item label="学校">{{ talent.school }}</el-descriptions-item>
      <el-descriptions-item label="专业">{{ talent.major }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="talent.status === 'available' ? 'success' : 'info'">{{ talent.status === 'available' ? '待分配' : '已分配' }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="负责人">{{ talent.assigned_name || '-' }}</el-descriptions-item>
      <el-descriptions-item label="经验" :span="2">{{ talent.experience }}</el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">{{ talent.remark }}</el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { useSync } from '../../composables/useSync'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const talent = ref({})

async function loadData() {
  loading.value = true
  try {
    const res = await request.get(`/talents/${route.params.id}`)
    if (res.code === 200) talent.value = res.data
  } finally { loading.value = false }
}

onMounted(() => loadData())

useSync('talent:change', loadData, { message: '人才信息已更新' })
</script>
