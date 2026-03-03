<template>
  <div class="dashboard">
    <!-- Top Stats Bar -->
    <div class="stats-bar">
      <div class="stat-card stat-new">
        <div class="stat-icon">
          <el-icon :size="22"><UserFilled /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.todayNew || 0 }}</span>
          <span class="stat-label">今日新增客户</span>
        </div>
      </div>
      <div class="stat-card stat-follow">
        <div class="stat-icon">
          <el-icon :size="22"><Phone /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.todayFollows || 0 }}</span>
          <span class="stat-label">今日跟进</span>
        </div>
      </div>
      <div class="stat-card stat-attendance">
        <div class="stat-icon">
          <el-icon :size="22"><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.todayAttendance || 0 }}</span>
          <span class="stat-label">今日签到</span>
        </div>
      </div>
    </div>

    <!-- Announcement Carousel -->
    <div class="announcement-section" v-if="announcements.length > 0">
      <el-carousel
        height="100px"
        direction="horizontal"
        :interval="4000"
        indicator-position="none"
        arrow="never"
      >
        <el-carousel-item
          v-for="(item, index) in announcements"
          :key="item.id || index"
        >
          <div class="announcement-slide" :class="'announcement-bg-' + (index % 3)">
            <div class="announcement-title">
              <el-icon :size="16"><Bell /></el-icon>
              <span>{{ item.title }}</span>
            </div>
            <div class="announcement-content">{{ item.content }}</div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- Module Grid -->
    <div class="module-grid">
      <div
        v-for="mod in modules"
        :key="mod.path + mod.label"
        class="module-card"
        @click="router.push(mod.path)"
      >
        <div class="module-icon" :style="{ backgroundColor: mod.color + '15' }">
          <el-icon :size="36" :style="{ color: mod.color }">
            <component :is="mod.icon" />
          </el-icon>
        </div>
        <span class="module-label">{{ mod.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../../utils/request'
import { useSync } from '../../composables/useSync'

const router = useRouter()

const stats = reactive({
  totalCustomers: 0,
  todayNew: 0,
  todayFollows: 0,
  signedCount: 0,
  todayAttendance: 0
})

const announcements = ref([])

const modules = [
  { label: '考勤打卡', icon: 'Clock', color: '#67c23a', path: '/attendance' },
  { label: '客户管理', icon: 'User', color: '#409eff', path: '/customer' },
  { label: '日历视图', icon: 'Calendar', color: '#e6a23c', path: '/calendar' },
  { label: '跟进记录', icon: 'Phone', color: '#f56c6c', path: '/customer' },
  { label: '活动中心', icon: 'Star', color: '#9b59b6', path: '/activities' },
  { label: '业绩成就', icon: 'Trophy', color: '#f39c12', path: '/achievements' },
  { label: '工作安排', icon: 'Notebook', color: '#1abc9c', path: '/worklog' },
  { label: '电子名片', icon: 'Postcard', color: '#e74c3c', path: '/businesscard' },
  { label: '分组PK', icon: 'Flag', color: '#3498db', path: '/team' },
  { label: '团队排名', icon: 'Rank', color: '#2ecc71', path: '/team/ranking' },
  { label: '数据分析', icon: 'DataAnalysis', color: '#8e44ad', path: '/analytics' },
  { label: '工作日志', icon: 'Document', color: '#34495e', path: '/worklog' }
]

async function loadStats() {
  try {
    const res = await request.get('/dashboard/stats')
    if (res.code === 200 && res.data) {
      Object.assign(stats, res.data)
    }
  } catch {
    // silently ignore stats load failure
  }
}

async function loadAnnouncements() {
  try {
    const res = await request.get('/announcements', { params: { active: 1 } })
    if (res.code === 200 && Array.isArray(res.data)) {
      announcements.value = res.data
    }
  } catch {
    // silently ignore announcement load failure
  }
}

onMounted(() => {
  loadStats()
  loadAnnouncements()
})

useSync('customer:change', loadStats, { message: '客户数据已更新' })
useSync('announcement:change', loadAnnouncements, { notify: false })
</script>

<style scoped>
.dashboard {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

/* --- Stats Bar --- */
.stats-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  color: #fff;
  min-width: 0;
}

.stat-new {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-follow {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.stat-attendance {
  background: linear-gradient(135deg, #67c23a, #95d475);
}

.stat-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- Announcement Carousel --- */
.announcement-section {
  margin-bottom: 16px;
  border-radius: 10px;
  overflow: hidden;
}

.announcement-section :deep(.el-carousel__container) {
  border-radius: 10px;
}

.announcement-slide {
  height: 100%;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #fff;
  border-radius: 10px;
}

.announcement-bg-0 {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.announcement-bg-1 {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.announcement-bg-2 {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.announcement-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}

.announcement-content {
  font-size: 13px;
  opacity: 0.92;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* --- Module Grid --- */
.module-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.module-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 12px;
  padding: 20px 8px 16px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.module-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.module-card:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.module-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.module-label {
  font-size: 13px;
  color: #303133;
  text-align: center;
  white-space: nowrap;
}

/* --- Responsive: Mobile --- */
@media (max-width: 768px) {
  .dashboard {
    padding: 12px;
  }

  .stats-bar {
    gap: 8px;
  }

  .stat-card {
    padding: 10px 10px;
    gap: 8px;
  }

  .stat-value {
    font-size: 18px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-icon {
    width: 34px;
    height: 34px;
  }

  .module-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .module-card {
    padding: 16px 6px 12px;
  }

  .module-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }

  .module-icon .el-icon {
    font-size: 30px !important;
  }

  .module-label {
    font-size: 12px;
  }
}
</style>
