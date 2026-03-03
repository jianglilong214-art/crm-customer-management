<template>
  <!-- Desktop layout -->
  <el-container v-if="!isMobile" style="height: 100vh">
    <el-aside :width="collapsed ? '64px' : '220px'" style="transition: width 0.3s; background: #304156;">
      <div style="height: 60px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: bold; white-space: nowrap; overflow: hidden;">
        <el-icon size="24" style="margin-right: 8px"><DataBoard /></el-icon>
        <span v-show="!collapsed">CRM管理系统</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="collapsed"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
        :collapse-transition="false"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="/customer">
          <el-icon><User /></el-icon>
          <template #title>客户管理</template>
        </el-menu-item>
        <el-menu-item index="/calendar">
          <el-icon><Calendar /></el-icon>
          <template #title>日历视图</template>
        </el-menu-item>
        <el-menu-item index="/message">
          <el-icon><Message /></el-icon>
          <template #title>消息中心</template>
        </el-menu-item>
        <el-menu-item index="/attendance">
          <el-icon><Clock /></el-icon>
          <template #title>考勤打卡</template>
        </el-menu-item>
        <el-menu-item index="/worklog">
          <el-icon><Notebook /></el-icon>
          <template #title>工作日志</template>
        </el-menu-item>
        <el-menu-item index="/activities">
          <el-icon><Star /></el-icon>
          <template #title>活动中心</template>
        </el-menu-item>
        <el-menu-item index="/achievements">
          <el-icon><Trophy /></el-icon>
          <template #title>业绩成就</template>
        </el-menu-item>
        <el-menu-item index="/businesscard">
          <el-icon><Postcard /></el-icon>
          <template #title>电子名片</template>
        </el-menu-item>
        <el-menu-item index="/analytics">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据分析</template>
        </el-menu-item>
        <el-sub-menu index="salary-menu">
          <template #title>
            <el-icon><Money /></el-icon>
            <span>薪酬管理</span>
          </template>
          <el-menu-item index="/salary">薪酬查询</el-menu-item>
          <el-menu-item index="/salary/calculate">薪酬计算</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="team-menu">
          <template #title>
            <el-icon><Flag /></el-icon>
            <span>团队竞赛</span>
          </template>
          <el-menu-item index="/team">分组作战</el-menu-item>
          <el-menu-item index="/team/ranking">团队排名</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/project">
          <el-icon><Folder /></el-icon>
          <template #title>项目管理</template>
        </el-menu-item>
        <el-menu-item index="/talent">
          <el-icon><Avatar /></el-icon>
          <template #title>人才库</template>
        </el-menu-item>
        <el-menu-item index="/mine">
          <el-icon><Setting /></el-icon>
          <template #title>个人中心</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; background: #fff;">
        <div style="display: flex; align-items: center;">
          <el-icon size="20" style="cursor: pointer" @click="collapsed = !collapsed"><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
          <el-breadcrumb separator="/" style="margin-left: 16px">
            <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
            <el-icon size="20" style="cursor: pointer" @click="router.push('/message')"><Bell /></el-icon>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <span style="display: flex; align-items: center; cursor: pointer;">
              <el-avatar :size="32" style="background: #409eff">{{ userStore.userInfo.name?.charAt(0) || 'U' }}</el-avatar>
              <span style="margin-left: 8px">{{ userStore.userInfo.name || '用户' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="mine">个人中心</el-dropdown-item>
                <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main style="background: #f5f7fa; overflow-y: auto;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <!-- Mobile layout -->
  <div v-else class="mobile-layout">
    <!-- Mobile header -->
    <div class="mobile-header">
      <span class="mobile-title">{{ route.meta.title || 'CRM' }}</span>
      <div style="display: flex; align-items: center; gap: 12px;">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
          <el-icon size="20" style="color: #fff; cursor: pointer" @click="router.push('/message')"><Bell /></el-icon>
        </el-badge>
        <el-icon size="20" style="color: #fff; cursor: pointer" @click="showMobileMenu = true"><MoreFilled /></el-icon>
      </div>
    </div>

    <!-- Mobile content -->
    <div class="mobile-content">
      <router-view />
    </div>

    <!-- Mobile bottom tab bar -->
    <div class="mobile-tabbar">
      <div
        v-for="tab in mobileTabs"
        :key="tab.path"
        class="tab-item"
        :class="{ active: isTabActive(tab) }"
        @click="router.push(tab.path)"
      >
        <el-icon :size="22"><component :is="tab.icon" /></el-icon>
        <span>{{ tab.label }}</span>
      </div>
    </div>

    <!-- Mobile more menu drawer -->
    <el-drawer v-model="showMobileMenu" direction="rtl" size="70%" :show-close="false">
      <template #header>
        <div style="display: flex; align-items: center; gap: 12px;">
          <el-avatar :size="40" style="background: #409eff">{{ userStore.userInfo.name?.charAt(0) || 'U' }}</el-avatar>
          <div>
            <div style="font-weight: bold;">{{ userStore.userInfo.name || '用户' }}</div>
            <div style="font-size: 12px; color: #909399;">{{ userStore.userInfo.department || '' }}</div>
          </div>
        </div>
      </template>
      <div class="mobile-menu-list">
        <div class="menu-item" @click="goMobile('/calendar')"><el-icon><Calendar /></el-icon><span>日历视图</span></div>
        <div class="menu-item" @click="goMobile('/activities')"><el-icon><Star /></el-icon><span>活动中心</span></div>
        <div class="menu-item" @click="goMobile('/achievements')"><el-icon><Trophy /></el-icon><span>业绩成就</span></div>
        <div class="menu-item" @click="goMobile('/businesscard')"><el-icon><Postcard /></el-icon><span>电子名片</span></div>
        <div class="menu-item" @click="goMobile('/analytics')"><el-icon><DataAnalysis /></el-icon><span>数据分析</span></div>
        <div class="menu-item" @click="goMobile('/worklog')"><el-icon><Notebook /></el-icon><span>工作日志</span></div>
        <div class="menu-item" @click="goMobile('/salary')"><el-icon><Money /></el-icon><span>薪酬查询</span></div>
        <div class="menu-item" @click="goMobile('/salary/calculate')"><el-icon><Money /></el-icon><span>薪酬计算</span></div>
        <div class="menu-item" @click="goMobile('/team')"><el-icon><Flag /></el-icon><span>分组作战</span></div>
        <div class="menu-item" @click="goMobile('/team/ranking')"><el-icon><Flag /></el-icon><span>团队排名</span></div>
        <div class="menu-item" @click="goMobile('/project')"><el-icon><Folder /></el-icon><span>项目管理</span></div>
        <div class="menu-item" @click="goMobile('/talent')"><el-icon><Avatar /></el-icon><span>人才库</span></div>
        <div class="menu-item" @click="goMobile('/settings')"><el-icon><Setting /></el-icon><span>系统设置</span></div>
        <div class="menu-item" @click="goMobile('/about')"><el-icon><InfoFilled /></el-icon><span>关于我们</span></div>
        <div class="menu-item" style="color: #f56c6c; margin-top: 20px;" @click="handleLogout"><el-icon><SwitchButton /></el-icon><span>退出登录</span></div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import request from '../utils/request'
import { connectSocket, disconnectSocket } from '../utils/socket'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const collapsed = ref(false)
const unreadCount = ref(0)
const showMobileMenu = ref(false)
const windowWidth = ref(window.innerWidth)

const isMobile = computed(() => windowWidth.value < 768)

const mobileTabs = [
  { path: '/dashboard', icon: 'HomeFilled', label: '首页' },
  { path: '/customer', icon: 'User', label: '客户' },
  { path: '/attendance', icon: 'Clock', label: '考勤' },
  { path: '/message', icon: 'Message', label: '消息' },
  { path: '/mine', icon: 'UserFilled', label: '我的' },
]

function isTabActive(tab) {
  if (tab.path === '/customer') return route.path.startsWith('/customer')
  if (tab.path === '/message') return route.path.startsWith('/message')
  return route.path === tab.path
}

function goMobile(path) {
  showMobileMenu.value = false
  router.push(path)
}

function handleLogout() {
  showMobileMenu.value = false
  userStore.logout()
  router.push('/login')
}

function handleCommand(cmd) {
  if (cmd === 'logout') {
    userStore.logout()
    router.push('/login')
  } else if (cmd === 'mine') {
    router.push('/mine')
  } else if (cmd === 'settings') {
    router.push('/settings')
  }
}

function onResize() {
  windowWidth.value = window.innerWidth
}

onMounted(async () => {
  window.addEventListener('resize', onResize)
  connectSocket()
  try {
    const res = await request.get('/messages', { params: { pageSize: 1 } })
    if (res.code === 200) unreadCount.value = res.data.unread || 0
  } catch (e) {}
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  disconnectSocket()
})
</script>

<style scoped>
/* Mobile layout */
.mobile-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  flex-shrink: 0;
  padding-top: env(safe-area-inset-top);
}

.mobile-title {
  font-size: 17px;
  font-weight: 600;
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 12px;
}

.mobile-tabbar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 56px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 2px;
  color: #999;
  font-size: 11px;
  cursor: pointer;
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.tab-item.active {
  color: #667eea;
}

.mobile-menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 8px;
  font-size: 15px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.menu-item:active {
  background: #f5f5f5;
}
</style>
