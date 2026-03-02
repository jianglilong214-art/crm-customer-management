<template>
  <el-container style="height: 100vh">
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
          <div style="display: flex; align-items: center; margin-right: 8px;">
            <span :style="{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#67c23a' : '#f56c6c', display: 'inline-block' }"></span>
            <span style="font-size: 12px; color: #909399; margin-left: 4px;">{{ connected ? '已连接' : '未连接' }}</span>
          </div>
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
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import request from '../utils/request'
import { connectSocket, disconnectSocket, connected } from '../utils/socket'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const collapsed = ref(false)
const unreadCount = ref(0)

onMounted(async () => {
  connectSocket()
  try {
    const res = await request.get('/messages', { params: { pageSize: 1 } })
    if (res.code === 200) unreadCount.value = res.data.unread || 0
  } catch (e) {}
})

onUnmounted(() => {
  disconnectSocket()
})

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
</script>
