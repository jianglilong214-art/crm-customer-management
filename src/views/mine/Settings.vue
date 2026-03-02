<template>
  <el-card shadow="never">
    <template #header><span style="font-weight: bold;">系统设置</span></template>
    <div style="max-width: 500px;">
      <h4 style="margin-bottom: 16px;">修改密码</h4>
      <el-form :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleChangePwd">修改密码</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <h4 style="margin-bottom: 16px;">其他设置</h4>
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>消息通知</span>
          <el-switch v-model="settings.notification" />
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>声音提醒</span>
          <el-switch v-model="settings.sound" />
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const pwdFormRef = ref()
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const settings = ref({ notification: true, sound: true })

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请确认密码', trigger: 'blur' }, {
    validator: (_, value, callback) => {
      if (value !== pwdForm.value.newPassword) callback(new Error('两次密码不一致'))
      else callback()
    }, trigger: 'blur'
  }]
}

async function handleChangePwd() {
  await pwdFormRef.value.validate()
  const res = await request.post('/auth/change-password', {
    userId: userStore.userInfo.id,
    oldPassword: pwdForm.value.oldPassword,
    newPassword: pwdForm.value.newPassword
  })
  if (res.code === 200) {
    ElMessage.success('密码修改成功')
    pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } else {
    ElMessage.error(res.message)
  }
}
</script>
