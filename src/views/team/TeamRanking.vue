<template>
  <div>
    <el-card shadow="never" style="margin-bottom: 16px;">
      <template #header><span style="font-weight: bold;">团队排名</span></template>
      <el-table :data="teamRanking" stripe>
        <el-table-column label="排名" width="70" align="center">
          <template #default="{ $index }">
            <span :style="{ fontSize: $index < 3 ? '18px' : '14px', fontWeight: $index < 3 ? 'bold' : 'normal', color: ['#f56c6c','#e6a23c','#409eff'][$index] || '#303133' }">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="团队" />
        <el-table-column prop="total_score" label="总积分" width="100" align="center" sortable />
        <el-table-column prop="total_customers" label="客户数" width="100" align="center" sortable />
        <el-table-column prop="total_signs" label="签约数" width="100" align="center" sortable />
      </el-table>
    </el-card>

    <el-card shadow="never">
      <template #header><span style="font-weight: bold;">个人排名</span></template>
      <el-table :data="individualRanking" stripe>
        <el-table-column label="排名" width="70" align="center">
          <template #default="{ $index }">
            <span :style="{ fontSize: $index < 3 ? '18px' : '14px', fontWeight: $index < 3 ? 'bold' : 'normal', color: ['#f56c6c','#e6a23c','#409eff'][$index] || '#303133' }">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="department" label="部门" />
        <el-table-column prop="customer_count" label="客户数" width="100" align="center" sortable />
        <el-table-column prop="sign_count" label="签约数" width="100" align="center" sortable />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { useSync } from '../../composables/useSync'

const teamRanking = ref([])
const individualRanking = ref([])

async function loadData() {
  const [teamRes, indRes] = await Promise.all([
    request.get('/teams/ranking/list'),
    request.get('/teams/ranking/individual')
  ])
  if (teamRes.code === 200) teamRanking.value = teamRes.data
  if (indRes.code === 200) individualRanking.value = indRes.data
}

onMounted(() => loadData())

useSync('customer:change', loadData, { message: '排名数据已更新' })
</script>
