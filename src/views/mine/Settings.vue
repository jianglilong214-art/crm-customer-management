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

      <h4 style="margin-bottom: 16px;">通知设置</h4>
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

      <el-divider />

      <h4 style="margin-bottom: 16px;">其他</h4>
      <div style="display: flex; flex-direction: column; gap: 0;">
        <div class="setting-item" @click="clearCache">
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-icon><Delete /></el-icon>
            <span>清除缓存</span>
          </div>
          <div style="color: #909399; font-size: 13px;">{{ cacheSize }}</div>
        </div>
        <div class="setting-item" @click="checkUpdate">
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-icon><Refresh /></el-icon>
            <span>检查更新</span>
          </div>
          <div style="color: #909399; font-size: 13px;">当前版本 v2.0.0</div>
        </div>
        <div class="setting-item" @click="router.push('/feedback')">
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-icon><ChatDotRound /></el-icon>
            <span>意见反馈</span>
          </div>
          <el-icon style="color: #c0c4cc;"><ArrowRight /></el-icon>
        </div>
        <div class="setting-item" @click="showPrivacy = true">
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-icon><Lock /></el-icon>
            <span>隐私政策</span>
          </div>
          <el-icon style="color: #c0c4cc;"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- Privacy Policy Dialog -->
    <el-dialog v-model="showPrivacy" title="隐私政策" width="500px">
      <div style="line-height: 1.8; color: #606266;">
        <p><strong>1. 信息收集</strong></p>
        <p>我们收集您提供的个人信息（姓名、手机号、邮箱）用于账户管理和业务沟通。</p>
        <p><strong>2. 信息使用</strong></p>
        <p>收集的信息仅用于CRM系统内部业务管理，不会向第三方出售或分享。</p>
        <p><strong>3. 数据安全</strong></p>
        <p>我们采用加密存储和传输技术保护您的数据安全。</p>
        <p><strong>4. 位置信息</strong></p>
        <p>考勤功能需要获取您的位置信息，仅在您主动签到时使用，不会后台追踪。</p>
        <p><strong>5. 信息修改</strong></p>
        <p>您可以随时在个人中心修改您的个人信息。</p>
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const pwdFormRef = ref()
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const settings = ref({ notification: true, sound: true })
const showPrivacy = ref(false)
const cacheSize = ref('计算中...')

// Calculate cache size
try {
  let size = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    size += (localStorage.getItem(key) || '').length
  }
  cacheSize.value = size > 1024 ? (size / 1024).toFixed(1) + ' KB' : size + ' B'
} catch { cacheSize.value = '未知' }

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

function clearCache() {
  const token = localStorage.getItem('crm_token')
  const user = localStorage.getItem('crm_user')
  localStorage.clear()
  if (token) localStorage.setItem('crm_token', token)
  if (user) localStorage.setItem('crm_user', user)
  cacheSize.value = '0 B'
  ElMessage.success('缓存已清除')
}

function checkUpdate() {
  ElMessage.info('当前已是最新版本')
}
</script>

<style scoped>
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  font-size: 15px;
}
.setting-item:hover {
  background: #f9f9f9;
}
.setting-item:last-child {
  border-bottom: none;
}
</style>
