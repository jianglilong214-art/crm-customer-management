<template>
  <div v-loading="loading">
    <el-card shadow="never" style="margin-bottom: 16px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold;">活动详情</span>
          <el-button @click="router.back()">返回</el-button>
        </div>
      </template>

      <div class="detail-header">
        <div class="detail-header__left">
          <h2 class="detail-title">{{ activity.title }}</h2>
          <el-tag
            v-if="activity.status"
            :type="activity.status === 'upcoming' ? 'warning' : 'info'"
            size="large"
          >
            {{ statusMap[activity.status] || activity.status }}
          </el-tag>
        </div>
      </div>

      <el-descriptions :column="2" border style="margin-top: 20px;">
        <el-descriptions-item label="活动地点">
          <el-icon><Location /></el-icon> {{ activity.location || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="发起人">{{ activity.creator_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatTime(activity.start_time) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ formatTime(activity.end_time) }}</el-descriptions-item>
        <el-descriptions-item label="报名人数">{{ activity.signup_count || 0 }} / {{ activity.max_participants || 0 }}</el-descriptions-item>
        <el-descriptions-item label="活动状态">
          <el-tag
            v-if="activity.status"
            :type="activity.status === 'upcoming' ? 'warning' : 'info'"
          >
            {{ statusMap[activity.status] || activity.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="活动描述" :span="2">
          <div class="detail-description">{{ activity.description || '-' }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never" style="margin-bottom: 16px;">
      <template #header>
        <span style="font-weight: bold;">报名参与</span>
      </template>

      <div class="signup-section">
        <div class="signup-progress">
          <div class="signup-progress__label">
            <span>报名进度</span>
            <span>{{ activity.signup_count || 0 }} / {{ activity.max_participants || 0 }} 人</span>
          </div>
          <el-progress
            :percentage="signupPercentage"
            :color="signupPercentage >= 100 ? '#f56c6c' : '#409eff'"
            :stroke-width="20"
            :text-inside="true"
          />
        </div>

        <div class="signup-action">
          <template v-if="activity.status === 'ended'">
            <el-tag type="info" size="large" effect="dark">活动已结束</el-tag>
          </template>
          <template v-else-if="activity.has_signed">
            <el-button type="success" size="large" disabled>
              <el-icon><Check /></el-icon> 已报名
            </el-button>
          </template>
          <template v-else>
            <el-button
              type="primary"
              size="large"
              :loading="signingUp"
              :disabled="signupFull"
              @click="handleSignup"
            >
              {{ signupFull ? '报名已满' : '立即报名' }}
            </el-button>
          </template>
        </div>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold;">报名列表</span>
          <el-tag type="info" size="small">共 {{ participants.length }} 人</el-tag>
        </div>
      </template>

      <el-table :data="participants" stripe v-if="participants.length">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="user_name" label="姓名" />
        <el-table-column prop="signed_at" label="报名时间">
          <template #default="{ row }">
            {{ formatTime(row.signed_at) }}
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无报名人员" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const signingUp = ref(false)
const activity = ref({})
const participants = ref([])

const statusMap = {
  upcoming: '即将开始',
  ongoing: '进行中',
  ended: '已结束'
}

const signupPercentage = computed(() => {
  if (!activity.value.max_participants) return 0
  const pct = Math.round((activity.value.signup_count || 0) / activity.value.max_participants * 100)
  return Math.min(pct, 100)
})

const signupFull = computed(() => {
  return (activity.value.signup_count || 0) >= (activity.value.max_participants || 0)
})

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const res = await request.get(`/activities/${route.params.id}`)
    if (res.code === 200) {
      activity.value = res.data
      participants.value = res.data.signups || []
    }
  } finally {
    loading.value = false
  }
}

async function handleSignup() {
  signingUp.value = true
  try {
    const res = await request.post(`/activities/${route.params.id}/signup`)
    if (res.code === 200) {
      ElMessage.success('报名成功')
      loadData()
    }
  } finally {
    signingUp.value = false
  }
}

function formatTime(datetime) {
  if (!datetime) return '-'
  const d = new Date(datetime)
  if (isNaN(d.getTime())) return datetime
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
</script>

<style scoped>
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.detail-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.detail-description {
  white-space: pre-wrap;
  line-height: 1.8;
  color: #606266;
}

.signup-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.signup-progress {
  width: 100%;
}

.signup-progress__label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.signup-action {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

@media (max-width: 768px) {
  .detail-title {
    font-size: 18px;
  }

  .el-descriptions {
    --el-descriptions-item-bordered-label-background: #fafafa;
  }
}
</style>
