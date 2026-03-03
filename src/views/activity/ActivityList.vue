<template>
  <el-card shadow="never">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">活动管理</span>
        <el-button v-if="isAdmin" type="primary" @click="showCreate = true">
          <el-icon><Plus /></el-icon> 创建活动
        </el-button>
      </div>
    </template>

    <el-tabs v-model="activeStatus" @tab-change="handleTabChange">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="即将开始" name="upcoming" />
      <el-tab-pane label="已结束" name="ended" />
    </el-tabs>

    <div v-loading="loading">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8" v-for="item in list" :key="item.id">
          <div class="activity-card" @click="router.push(`/activities/${item.id}`)">
            <div class="activity-card__header">
              <h3 class="activity-card__title">{{ item.title }}</h3>
              <el-tag
                :type="item.status === 'upcoming' ? 'warning' : 'info'"
                size="small"
              >
                {{ statusMap[item.status] || item.status }}
              </el-tag>
            </div>
            <p class="activity-card__desc">{{ truncate(item.description, 80) }}</p>
            <div class="activity-card__meta">
              <div class="activity-card__meta-item">
                <el-icon><Location /></el-icon>
                <span>{{ item.location || '暂无地点' }}</span>
              </div>
              <div class="activity-card__meta-item">
                <el-icon><Calendar /></el-icon>
                <span>{{ formatTime(item.start_time) }} ~ {{ formatTime(item.end_time) }}</span>
              </div>
              <div class="activity-card__meta-item">
                <el-icon><User /></el-icon>
                <span>{{ item.signup_count || 0 }} / {{ item.max_participants }} 人报名</span>
              </div>
            </div>
            <div class="activity-card__footer">
              <span class="activity-card__creator">发起人: {{ item.creator_name }}</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-empty v-if="!loading && !list.length" description="暂无活动" />

      <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="showCreate" title="创建活动" width="560px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="活动标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入活动标题" />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入活动描述" />
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入活动地点" />
        </el-form-item>
        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker
            v-model="form.start_time"
            type="datetime"
            placeholder="选择开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="end_time">
          <el-date-picker
            v-model="form.end_time"
            type="datetime"
            placeholder="选择结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="最大人数" prop="max_participants">
          <el-input-number v-model="form.max_participants" :min="1" :max="9999" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()
const isAdmin = computed(() => userStore.userInfo?.role === 'admin')

const loading = ref(false)
const submitting = ref(false)
const list = ref([])
const total = ref(0)
const activeStatus = ref('')
const showCreate = ref(false)
const formRef = ref(null)

const query = ref({ status: '', page: 1, pageSize: 10 })

const statusMap = {
  upcoming: '即将开始',
  ongoing: '进行中',
  ended: '已结束'
}

const form = ref({
  title: '',
  description: '',
  location: '',
  start_time: '',
  end_time: '',
  max_participants: 50
})

const rules = {
  title: [{ required: true, message: '请输入活动标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入活动描述', trigger: 'blur' }],
  location: [{ required: true, message: '请输入活动地点', trigger: 'blur' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  max_participants: [{ required: true, message: '请输入最大人数', trigger: 'change' }]
}

onMounted(() => loadData())

function handleTabChange(status) {
  query.value.status = status
  query.value.page = 1
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const params = { page: query.value.page, pageSize: query.value.pageSize }
    if (query.value.status) {
      params.status = query.value.status
    }
    const res = await request.get('/activities', { params })
    if (res.code === 200) {
      list.value = res.data.list
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!formRef.value) return
  await formRef.value.validate()

  if (form.value.end_time <= form.value.start_time) {
    ElMessage.warning('结束时间必须晚于开始时间')
    return
  }

  submitting.value = true
  try {
    const res = await request.post('/activities', {
      title: form.value.title,
      description: form.value.description,
      location: form.value.location,
      start_time: form.value.start_time,
      end_time: form.value.end_time,
      max_participants: form.value.max_participants
    })
    if (res.code === 200) {
      ElMessage.success('创建成功')
      showCreate.value = false
      form.value = {
        title: '',
        description: '',
        location: '',
        start_time: '',
        end_time: '',
        max_participants: 50
      }
      loadData()
    }
  } finally {
    submitting.value = false
  }
}

function truncate(text, len) {
  if (!text) return ''
  return text.length > len ? text.substring(0, len) + '...' : text
}

function formatTime(datetime) {
  if (!datetime) return ''
  const d = new Date(datetime)
  if (isNaN(d.getTime())) return datetime
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day} ${hours}:${minutes}`
}
</script>

<style scoped>
.activity-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.activity-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.activity-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.activity-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.activity-card__desc {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.activity-card__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.activity-card__meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 13px;
}

.activity-card__meta-item .el-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.activity-card__footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
}

.activity-card__creator {
  color: #909399;
  font-size: 12px;
}

@media (max-width: 768px) {
  .activity-card {
    padding: 14px;
  }
}
</style>
