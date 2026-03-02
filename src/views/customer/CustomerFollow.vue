<template>
  <el-card shadow="never">
    <template #header><span style="font-weight: bold;">添加跟进记录</span></template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="max-width: 600px;">
      <el-form-item label="跟进方式">
        <el-select v-model="form.follow_type" style="width: 200px;">
          <el-option label="电话" value="phone" /><el-option label="到访" value="visit" /><el-option label="微信" value="wechat" />
        </el-select>
      </el-form-item>
      <el-form-item label="跟进内容" prop="content">
        <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请输入跟进内容" />
      </el-form-item>
      <el-form-item label="下次跟进">
        <el-date-picker v-model="form.next_follow_time" type="datetime" placeholder="选择日期时间" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="handleSubmit">提交</el-button>
        <el-button @click="router.back()">返回</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const saving = ref(false)
const form = ref({ follow_type: 'phone', content: '', next_follow_time: '' })
const rules = { content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }] }

async function handleSubmit() {
  await formRef.value.validate()
  saving.value = true
  try {
    const res = await request.post(`/customers/${route.params.id}/follow`, form.value)
    if (res.code === 200) { ElMessage.success('跟进成功'); router.back() }
  } finally { saving.value = false }
}
</script>
