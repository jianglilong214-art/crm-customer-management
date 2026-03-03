import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '../utils/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/dashboard/DashboardView.vue'), meta: { title: '首页' } },
      { path: 'customer', name: 'CustomerList', component: () => import('../views/customer/CustomerList.vue'), meta: { title: '客户列表' } },
      { path: 'customer/add', name: 'CustomerAdd', component: () => import('../views/customer/CustomerInput.vue'), meta: { title: '添加客户' } },
      { path: 'customer/edit/:id', name: 'CustomerEdit', component: () => import('../views/customer/CustomerInput.vue'), meta: { title: '编辑客户' } },
      { path: 'customer/:id', name: 'CustomerDetail', component: () => import('../views/customer/CustomerDetail.vue'), meta: { title: '客户详情' } },
      { path: 'customer/:id/follow', name: 'CustomerFollow', component: () => import('../views/customer/CustomerFollow.vue'), meta: { title: '添加跟进' } },
      { path: 'message', name: 'MessageList', component: () => import('../views/message/MessageList.vue'), meta: { title: '消息中心' } },
      { path: 'message/:id', name: 'MessageDetail', component: () => import('../views/message/MessageDetail.vue'), meta: { title: '消息详情' } },
      { path: 'attendance', name: 'AttendanceSign', component: () => import('../views/attendance/AttendanceSign.vue'), meta: { title: '考勤打卡' } },
      { path: 'attendance/record', name: 'AttendanceRecord', component: () => import('../views/attendance/AttendanceRecord.vue'), meta: { title: '考勤记录' } },
      { path: 'worklog', name: 'WorkLog', component: () => import('../views/worklog/WorkLogView.vue'), meta: { title: '工作日志' } },
      { path: 'salary', name: 'SalaryQuery', component: () => import('../views/salary/SalaryQuery.vue'), meta: { title: '薪酬查询' } },
      { path: 'salary/calculate', name: 'SalaryCalculate', component: () => import('../views/salary/SalaryCalculate.vue'), meta: { title: '薪酬计算' } },
      { path: 'team', name: 'GroupFight', component: () => import('../views/team/GroupFight.vue'), meta: { title: '分组作战' } },
      { path: 'team/ranking', name: 'TeamRanking', component: () => import('../views/team/TeamRanking.vue'), meta: { title: '团队排名' } },
      { path: 'project', name: 'ProjectList', component: () => import('../views/project/ProjectList.vue'), meta: { title: '项目管理' } },
      { path: 'project/:id', name: 'ProjectEvent', component: () => import('../views/project/ProjectEvent.vue'), meta: { title: '项目详情' } },
      { path: 'talent', name: 'TalentPool', component: () => import('../views/talent/TalentPool.vue'), meta: { title: '人才库' } },
      { path: 'talent/:id', name: 'TalentDetail', component: () => import('../views/talent/TalentDetail.vue'), meta: { title: '人才详情' } },
      { path: 'mine', name: 'PersonalCenter', component: () => import('../views/mine/PersonalCenter.vue'), meta: { title: '个人中心' } },
      { path: 'settings', name: 'Settings', component: () => import('../views/mine/Settings.vue'), meta: { title: '系统设置' } },
      { path: 'about', name: 'AboutUs', component: () => import('../views/mine/AboutUs.vue'), meta: { title: '关于我们' } },
      // New routes
      { path: 'calendar', name: 'Calendar', component: () => import('../views/calendar/CalendarView.vue'), meta: { title: '日历视图' } },
      { path: 'businesscard', name: 'BusinessCard', component: () => import('../views/businesscard/BusinessCardView.vue'), meta: { title: '电子名片' } },
      { path: 'analytics', name: 'DataAnalytics', component: () => import('../views/analytics/DataAnalyticsView.vue'), meta: { title: '数据分析' } },
      { path: 'activities', name: 'ActivityList', component: () => import('../views/activity/ActivityList.vue'), meta: { title: '活动中心' } },
      { path: 'activities/:id', name: 'ActivityDetail', component: () => import('../views/activity/ActivityDetail.vue'), meta: { title: '活动详情' } },
      { path: 'achievements', name: 'Achievements', component: () => import('../views/achievement/AchievementView.vue'), meta: { title: '业绩成就' } },
      { path: 'feedback', name: 'Feedback', component: () => import('../views/mine/Feedback.vue'), meta: { title: '意见反馈' } },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = (to.meta.title || 'CRM') + ' - CRM客户管理系统'
  const token = getToken()
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
