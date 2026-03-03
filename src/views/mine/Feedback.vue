<template>
  <el-card shadow="never">
    <template #header><span style="font-weight: bold;">意见反馈</span></template>
    <div style="max-width: 600px; margin: 0 auto;">
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="反馈类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio value="功能建议">功能建议</el-radio>
            <el-radio value="Bug反馈">Bug反馈</el-radio>
            <el-radio value="体验问题">体验问题</el-radio>
            <el-radio value="其他">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="反馈内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="6"
            placeholder="请详细描述您的反馈..."
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">提交反馈</el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const formRef = ref()
const submitting = ref(false)
const form = ref({
  type: '功能建议',
  content: ''
})

const rules = {
  type: [{ required: true, message: '请选择反馈类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入反馈内容', trigger: 'blur' }]
}

async function handleSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    const res = await request.post('/api/feedback', {
      content: form.value.content,
      type: form.value.type
    })
    if (res.code === 200) {
      ElMessage.success('感谢您的反馈，我们会尽快处理！')
      form.value = { type: '功能建议', content: '' }
      formRef.value.resetFields()
    } else {
      ElMessage.error(res.message || '提交失败，请稍后重试')
    }
  } catch {
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>
