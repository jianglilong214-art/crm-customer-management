<template>
  <div class="businesscard-page">
    <!-- Display Mode -->
    <div v-if="!editing" class="card-wrapper">
      <!-- Business Card -->
      <div class="business-card" v-loading="loading">
        <div class="card-header">
          <div class="card-avatar">{{ cardData.name?.charAt(0) || '?' }}</div>
          <div class="card-identity">
            <h1 class="card-name">{{ cardData.name || '未设置姓名' }}</h1>
            <p class="card-title">{{ cardData.title || '' }}</p>
          </div>
        </div>

        <div class="card-company" v-if="cardData.company">
          <el-icon><OfficeBuilding /></el-icon>
          <span>{{ cardData.company }}</span>
        </div>

        <div class="card-divider"></div>

        <div class="card-details">
          <div class="card-detail-item" v-if="cardData.phone">
            <el-icon><Phone /></el-icon>
            <a :href="'tel:' + cardData.phone" class="card-link">{{ cardData.phone }}</a>
          </div>
          <div class="card-detail-item" v-if="cardData.email">
            <el-icon><Message /></el-icon>
            <a :href="'mailto:' + cardData.email" class="card-link">{{ cardData.email }}</a>
          </div>
          <div class="card-detail-item" v-if="cardData.wechat">
            <el-icon><ChatDotRound /></el-icon>
            <span>微信: {{ cardData.wechat }}</span>
          </div>
          <div class="card-detail-item" v-if="cardData.address">
            <el-icon><Location /></el-icon>
            <span>{{ cardData.address }}</span>
          </div>
        </div>

        <div class="card-slogan" v-if="cardData.slogan">
          "{{ cardData.slogan }}"
        </div>
      </div>

      <!-- QR Code Section -->
      <div class="qrcode-section" v-if="qrcodeUrl">
        <div class="qrcode-box">
          <img :src="qrcodeUrl" alt="名片二维码" class="qrcode-image" />
          <p class="qrcode-hint">扫一扫，查看电子名片</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="card-actions">
        <el-button type="primary" size="large" round @click="handleShare">
          <el-icon><Share /></el-icon>
          <span>分享名片</span>
        </el-button>
        <el-button size="large" round @click="editing = true">
          <el-icon><Edit /></el-icon>
          <span>编辑名片</span>
        </el-button>
      </div>
    </div>

    <!-- Edit Mode -->
    <div v-else class="edit-wrapper">
      <el-card shadow="never">
        <template #header>
          <div class="edit-header">
            <span class="edit-title">编辑电子名片</span>
            <el-button text @click="handleCancelEdit">
              <el-icon><Close /></el-icon>
              取消
            </el-button>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="80px"
          style="max-width: 500px; margin: 0 auto;"
        >
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="请输入姓名" maxlength="20" />
          </el-form-item>
          <el-form-item label="职位" prop="title">
            <el-input v-model="form.title" placeholder="请输入职位/头衔" maxlength="30" />
          </el-form-item>
          <el-form-item label="公司" prop="company">
            <el-input v-model="form.company" placeholder="请输入公司名称" maxlength="50" />
          </el-form-item>
          <el-form-item label="手机" prop="phone">
            <el-input v-model="form.phone" placeholder="请输入手机号码" maxlength="20" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱地址" maxlength="50" />
          </el-form-item>
          <el-form-item label="微信" prop="wechat">
            <el-input v-model="form.wechat" placeholder="请输入微信号" maxlength="30" />
          </el-form-item>
          <el-form-item label="地址" prop="address">
            <el-input v-model="form.address" placeholder="请输入地址" maxlength="100" />
          </el-form-item>
          <el-form-item label="个性签名" prop="slogan">
            <el-input
              v-model="form.slogan"
              type="textarea"
              :rows="2"
              placeholder="请输入个性签名/座右铭"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="saving" @click="handleSave">保存名片</el-button>
            <el-button @click="handleCancelEdit">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import {
  Phone,
  Message,
  ChatDotRound,
  Location,
  Share,
  Edit,
  Close,
  OfficeBuilding
} from '@element-plus/icons-vue'
import QRCode from 'qrcode'

const userStore = useUserStore()

const loading = ref(false)
const saving = ref(false)
const editing = ref(false)
const qrcodeUrl = ref('')
const formRef = ref(null)

const cardData = ref({
  name: '',
  title: '',
  company: '',
  phone: '',
  email: '',
  wechat: '',
  address: '',
  slogan: ''
})

const form = ref({
  name: '',
  title: '',
  company: '',
  phone: '',
  email: '',
  wechat: '',
  address: '',
  slogan: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

onMounted(() => {
  loadCard()
})

async function loadCard() {
  loading.value = true
  try {
    const res = await request.get('/businesscard')
    if (res.code === 200 && res.data) {
      cardData.value = {
        name: res.data.name || '',
        title: res.data.title || '',
        company: res.data.company || '',
        phone: res.data.phone || '',
        email: res.data.email || '',
        wechat: res.data.wechat || '',
        address: res.data.address || '',
        slogan: res.data.slogan || ''
      }
    }
    await generateQRCode()
  } finally {
    loading.value = false
  }
}

async function generateQRCode() {
  try {
    const userId = userStore.userInfo.id || userStore.userInfo._id || ''
    const shareUrl = `${window.location.origin}/api/businesscard/${userId}`
    qrcodeUrl.value = await QRCode.toDataURL(shareUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#333333',
        light: '#ffffff'
      }
    })
  } catch (err) {
    console.error('生成二维码失败:', err)
  }
}

async function handleShare() {
  const userId = userStore.userInfo.id || userStore.userInfo._id || ''
  const shareUrl = `${window.location.origin}/api/businesscard/${userId}`
  try {
    await navigator.clipboard.writeText(shareUrl)
    ElMessage.success('名片链接已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动复制链接')
  }
}

function handleCancelEdit() {
  editing.value = false
}

watch(editing, (val) => {
  if (val) {
    form.value = { ...cardData.value }
  }
})

async function handleSave() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const res = await request.put('/businesscard', {
      name: form.value.name,
      title: form.value.title,
      company: form.value.company,
      phone: form.value.phone,
      email: form.value.email,
      wechat: form.value.wechat,
      address: form.value.address,
      slogan: form.value.slogan
    })
    if (res.code === 200) {
      ElMessage.success('名片保存成功')
      cardData.value = { ...form.value }
      editing.value = false
      await generateQRCode()
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.businesscard-page {
  padding: 16px;
  min-height: 100%;
  background: #f5f7fa;
}

/* ========== Card Wrapper ========== */
.card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 420px;
  margin: 0 auto;
}

/* ========== Business Card ========== */
.business-card {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 28px 24px;
  color: #ffffff;
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.35);
  position: relative;
  overflow: hidden;
}

.business-card::before {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.business-card::after {
  content: '';
  position: absolute;
  bottom: -30px;
  left: -30px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.card-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  flex-shrink: 0;
  backdrop-filter: blur(4px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.card-identity {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
  line-height: 1.3;
  letter-spacing: 1px;
}

.card-title {
  font-size: 14px;
  margin: 0;
  opacity: 0.85;
  font-weight: 300;
}

.card-company {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 12px;
}

.card-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 12px 0;
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  opacity: 0.9;
}

.card-detail-item .el-icon {
  font-size: 15px;
  flex-shrink: 0;
  opacity: 0.8;
}

.card-link {
  color: #ffffff;
  text-decoration: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  transition: border-color 0.2s;
}

.card-link:hover {
  border-bottom-color: #ffffff;
}

.card-slogan {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed rgba(255, 255, 255, 0.2);
  font-size: 13px;
  font-style: italic;
  opacity: 0.75;
  text-align: center;
  line-height: 1.5;
}

/* ========== QR Code Section ========== */
.qrcode-section {
  width: 100%;
}

.qrcode-box {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.qrcode-image {
  width: 160px;
  height: 160px;
  border-radius: 8px;
}

.qrcode-hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: #909399;
}

/* ========== Action Buttons ========== */
.card-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.card-actions .el-button {
  flex: 1;
}

/* ========== Edit Mode ========== */
.edit-wrapper {
  max-width: 600px;
  margin: 0 auto;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-title {
  font-weight: bold;
  font-size: 16px;
}

/* ========== Responsive ========== */
@media (max-width: 480px) {
  .businesscard-page {
    padding: 12px;
  }

  .business-card {
    padding: 22px 18px;
    border-radius: 12px;
  }

  .card-name {
    font-size: 20px;
  }

  .card-avatar {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .card-actions {
    flex-direction: column;
  }

  .qrcode-image {
    width: 140px;
    height: 140px;
  }
}
</style>
