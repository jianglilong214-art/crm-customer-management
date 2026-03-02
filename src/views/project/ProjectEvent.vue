<template>
  <div v-loading="loading">
    <el-card shadow="never" style="margin-bottom: 16px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold;">{{ project.name }}</span>
          <el-button @click="router.back()">返回</el-button>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="项目名称">{{ project.name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="project.status === 'active' ? 'success' : 'info'">{{ project.status === 'active' ? '进行中' : '已完成' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="地址">{{ project.address }}</el-descriptions-item>
        <el-descriptions-item label="周期">{{ project.start_date }} ~ {{ project.end_date }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ project.description }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold;">项目动态</span>
          <el-button type="primary" size="small" @click="showAdd = true">添加事件</el-button>
        </div>
      </template>
      <el-timeline>
        <el-timeline-item v-for="e in project.events" :key="e.id" :timestamp="e.created_at" placement="top"
          :type="{ milestone: 'danger', event: 'success', report: 'primary', info: 'info' }[e.type]">
          <el-card shadow="hover" style="border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <strong>{{ e.title }}</strong>
              <el-tag size="small">{{ { milestone: '里程碑', event: '活动', report: '报告', info: '信息' }[e.type] }}</el-tag>
            </div>
            <p style="color: #606266; margin: 0;">{{ e.content }}</p>
            <div style="color: #909399; font-size: 12px; margin-top: 4px;">{{ e.creator_name }}</div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="!project.events?.length" description="暂无动态" />
    </el-card>

    <el-dialog v-model="showAdd" title="添加事件" width="500px">
      <el-form :model="eventForm" label-width="80px">
        <el-form-item label="标题"><el-input v-model="eventForm.title" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="eventForm.type" style="width: 100%;">
            <el-option label="里程碑" value="milestone" /><el-option label="活动" value="event" />
            <el-option label="报告" value="report" /><el-option label="信息" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容"><el-input v-model="eventForm.content" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="handleAddEvent">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { useSync } from '../../composables/useSync'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const project = ref({})
const showAdd = ref(false)
const eventForm = ref({ title: '', type: 'info', content: '' })

onMounted(() => loadData())

useSync('project:change', loadData, { message: '项目动态已更新' })

async function loadData() {
  loading.value = true
  try {
    const res = await request.get(`/projects/${route.params.id}`)
    if (res.code === 200) project.value = res.data
  } finally { loading.value = false }
}

async function handleAddEvent() {
  const res = await request.post(`/projects/${route.params.id}/events`, eventForm.value)
  if (res.code === 200) {
    ElMessage.success('添加成功')
    showAdd.value = false
    eventForm.value = { title: '', type: 'info', content: '' }
    loadData()
  }
}
</script>
