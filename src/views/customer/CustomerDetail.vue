<template>
  <div v-loading="loading">
    <el-card shadow="never" style="margin-bottom: 16px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold;">客户信息</span>
          <div>
            <el-button type="primary" @click="router.push(`/customer/${route.params.id}/follow`)">添加跟进</el-button>
            <el-button @click="router.push(`/customer/edit/${route.params.id}`)">编辑</el-button>
            <el-button @click="router.back()">返回</el-button>
          </div>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="姓名">{{ customer.name }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ customer.phone }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ customer.gender }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ customer.age }}</el-descriptions-item>
        <el-descriptions-item label="意向等级">
          <el-tag :type="customer.intention_level === 'A' ? 'danger' : customer.intention_level === 'B' ? 'warning' : 'info'">
            {{ customer.intention_level }}级
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="来源">{{ customer.source }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="customer.status === 'signed' ? 'success' : customer.status === 'followed' ? 'primary' : 'info'">
            {{ { potential: '潜在客户', followed: '跟进中', signed: '已签约' }[customer.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="负责人">{{ customer.owner_name }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ customer.created_at }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="3">{{ customer.address }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ customer.remark }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="never">
      <template #header><span style="font-weight: bold;">跟进记录</span></template>
      <el-timeline>
        <el-timeline-item v-for="f in customer.follows" :key="f.id" :timestamp="f.created_at" placement="top"
          :type="f.follow_type === 'visit' ? 'success' : f.follow_type === 'wechat' ? 'primary' : 'warning'">
          <el-card shadow="hover" style="border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <el-tag size="small">{{ { phone: '电话', visit: '到访', wechat: '微信' }[f.follow_type] || f.follow_type }}</el-tag>
              <span style="color: #909399; font-size: 12px;">{{ f.user_name }}</span>
            </div>
            <p>{{ f.content }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="!customer.follows?.length" description="暂无跟进记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { useSync } from '../../composables/useSync'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const customer = ref({})

async function loadData() {
  loading.value = true
  try {
    const res = await request.get(`/customers/${route.params.id}`)
    if (res.code === 200) customer.value = res.data
  } finally { loading.value = false }
}

onMounted(() => loadData())

useSync('customer:change', loadData, { message: '客户信息已更新' })
</script>
