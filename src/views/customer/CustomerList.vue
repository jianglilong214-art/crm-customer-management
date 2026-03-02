<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px;">
      <el-form :inline="true" :model="query" @submit.prevent="loadData">
        <el-form-item label="搜索">
          <el-input v-model="query.keyword" placeholder="客户姓名/手机号" clearable style="width: 180px;" />
        </el-form-item>
        <el-form-item label="意向">
          <el-select v-model="query.intention_level" placeholder="全部" clearable style="width: 100px;">
            <el-option label="A级" value="A" /><el-option label="B级" value="B" /><el-option label="C级" value="C" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px;">
            <el-option label="潜在客户" value="potential" /><el-option label="跟进中" value="followed" /><el-option label="已签约" value="signed" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="query.source" placeholder="全部" clearable style="width: 120px;">
            <el-option label="网络推广" value="网络推广" /><el-option label="门店来访" value="门店来访" />
            <el-option label="朋友推荐" value="朋友推荐" /><el-option label="电话营销" value="电话营销" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold;">客户列表</span>
          <el-button type="primary" @click="router.push('/customer/add')">
            <el-icon><Plus /></el-icon> 添加客户
          </el-button>
        </div>
      </template>

      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column label="意向" width="70">
          <template #default="{ row }">
            <el-tag :type="row.intention_level === 'A' ? 'danger' : row.intention_level === 'B' ? 'warning' : 'info'" size="small">
              {{ row.intention_level }}级
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="100" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'signed' ? 'success' : row.status === 'followed' ? 'primary' : 'info'" size="small">
              {{ { potential: '潜在', followed: '跟进中', signed: '已签约' }[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner_name" label="负责人" width="80" />
        <el-table-column prop="updated_at" label="更新时间" width="170" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push(`/customer/${row.id}`)">详情</el-button>
            <el-button link type="success" @click="router.push(`/customer/${row.id}/follow`)">跟进</el-button>
            <el-button link type="warning" @click="router.push(`/customer/edit/${row.id}`)">编辑</el-button>
            <el-popconfirm title="确定删除该客户？" @confirm="handleDelete(row.id)">
              <template #reference><el-button link type="danger">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
        <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" :total="total"
          :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="loadData" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { useSync } from '../../composables/useSync'

const router = useRouter()
const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = ref({ keyword: '', intention_level: '', status: '', source: '', page: 1, pageSize: 10 })

onMounted(() => loadData())

useSync('customer:change', loadData, { message: '客户数据已更新' })

async function loadData() {
  loading.value = true
  try {
    const res = await request.get('/customers', { params: query.value })
    if (res.code === 200) { list.value = res.data.list; total.value = res.data.total }
  } finally { loading.value = false }
}

function resetQuery() {
  query.value = { keyword: '', intention_level: '', status: '', source: '', page: 1, pageSize: 10 }
  loadData()
}

async function handleDelete(id) {
  const res = await request.delete(`/customers/${id}`)
  if (res.code === 200) { ElMessage.success('删除成功'); loadData() }
}
</script>
