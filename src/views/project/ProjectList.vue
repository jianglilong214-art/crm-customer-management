<template>
  <el-card shadow="never">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">项目管理</span>
        <el-button type="primary" @click="showAdd = true"><el-icon><Plus /></el-icon> 添加项目</el-button>
      </div>
    </template>
    <el-row :gutter="16">
      <el-col :span="8" v-for="project in list" :key="project.id">
        <el-card shadow="hover" style="margin-bottom: 16px; cursor: pointer; border-radius: 8px;" @click="router.push(`/project/${project.id}`)">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0;">{{ project.name }}</h3>
            <el-tag :type="project.status === 'active' ? 'success' : 'info'" size="small">{{ project.status === 'active' ? '进行中' : '已完成' }}</el-tag>
          </div>
          <p style="color: #606266; font-size: 13px; margin-bottom: 8px;">{{ project.description }}</p>
          <div style="color: #909399; font-size: 12px;">
            <el-icon><Location /></el-icon> {{ project.address }}
          </div>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            <el-icon><Calendar /></el-icon> {{ project.start_date }} ~ {{ project.end_date }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showAdd" title="添加项目" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="项目名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="起止日期">
          <el-date-picker v-model="form.dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { useSync } from '../../composables/useSync'

const router = useRouter()
const list = ref([])
const showAdd = ref(false)
const form = ref({ name: '', description: '', address: '', dateRange: [] })

onMounted(() => loadData())

useSync('project:change', loadData, { message: '项目数据已更新' })

async function loadData() {
  const res = await request.get('/projects')
  if (res.code === 200) list.value = res.data
}

async function handleAdd() {
  const res = await request.post('/projects', {
    ...form.value,
    start_date: form.value.dateRange?.[0] || '',
    end_date: form.value.dateRange?.[1] || ''
  })
  if (res.code === 200) {
    ElMessage.success('添加成功')
    showAdd.value = false
    form.value = { name: '', description: '', address: '', dateRange: [] }
    loadData()
  }
}
</script>
