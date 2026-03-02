<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px;">
      <div style="text-align: center; padding: 24px 0;">
        <el-avatar :size="80" style="background: #409eff; font-size: 32px;">{{ userStore.userInfo.name?.charAt(0) }}</el-avatar>
        <h2 style="margin: 12px 0 4px;">{{ userStore.userInfo.name }}</h2>
        <el-tag>{{ { admin: '管理员', manager: '经理', sales: '销售' }[userStore.userInfo.role] || userStore.userInfo.role }}</el-tag>
        <p style="color: #909399; margin-top: 8px;">{{ userStore.userInfo.department }}</p>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header><span style="font-weight: bold;">个人信息</span></template>
      <el-form :model="form" label-width="80px" style="max-width: 500px;">
        <el-form-item label="用户名"><el-input :value="userStore.userInfo.username" disabled /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="手机"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const form = ref({ name: '', phone: '', email: '' })

onMounted(() => {
  form.value = { name: userStore.userInfo.name || '', phone: userStore.userInfo.phone || '', email: userStore.userInfo.email || '' }
})

async function handleSave() {
  const res = await request.put('/user/info', form.value)
  if (res.code === 200) {
    ElMessage.success('保存成功')
    userStore.fetchUserInfo()
  }
}
</script>
