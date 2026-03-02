<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px;">
      <template #header><span style="font-weight: bold;">填写工作日志</span></template>
      <el-form :model="form" label-width="100px" style="max-width: 600px;">
        <el-form-item label="日期">
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 200px;" />
        </el-form-item>
        <el-form-item label="工作内容">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请输入今日工作内容" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="客户数"><el-input-number v-model="form.customer_count" :min="0" style="width: 100%;" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="电话数"><el-input-number v-model="form.call_count" :min="0" style="width: 100%;" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="拜访数"><el-input-number v-model="form.visit_count" :min="0" style="width: 100%;" /></el-form-item></el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSubmit">提交日志</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header><span style="font-weight: bold;">日志记录</span></template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="content" label="工作内容" show-overflow-tooltip />
        <el-table-column prop="customer_count" label="客户数" width="80" align="center" />
        <el-table-column prop="call_count" label="电话数" width="80" align="center" />
        <el-table-column prop="visit_count" label="拜访数" width="80" align="center" />
      </el-table>
      <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
        <el-pagination v-model:current-page="page" :page-size="10" :total="total" layout="prev, pager, next" @change="loadData" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { useSync } from '../../composables/useSync'

const saving = ref(false)
const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const form = ref({ date: new Date().toISOString().split('T')[0], content: '', customer_count: 0, call_count: 0, visit_count: 0 })

onMounted(() => loadData())

useSync('worklog:change', loadData, { message: '工作日志已更新' })

async function loadData() {
  loading.value = true
  try {
    const res = await request.get('/worklog', { params: { page: page.value, pageSize: 10 } })
    if (res.code === 200) { list.value = res.data.list; total.value = res.data.total }
  } finally { loading.value = false }
}

async function handleSubmit() {
  if (!form.value.content) return ElMessage.warning('请输入工作内容')
  saving.value = true
  try {
    const res = await request.post('/worklog', form.value)
    if (res.code === 200) {
      ElMessage.success('提交成功')
      form.value = { date: new Date().toISOString().split('T')[0], content: '', customer_count: 0, call_count: 0, visit_count: 0 }
      loadData()
    }
  } finally { saving.value = false }
}
</script>
