<template>
  <div>
    <el-row :gutter="16">
      <el-col :span="12" v-for="team in teams" :key="team.id">
        <el-card shadow="hover" style="border-radius: 8px; margin-bottom: 16px;">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: bold; font-size: 18px;">{{ team.name }}</span>
              <el-tag>队长: {{ team.leader_name }}</el-tag>
            </div>
          </template>
          <div style="text-align: center; margin: 16px 0;">
            <div style="font-size: 40px; font-weight: bold; color: #409eff;">{{ team.totalScore || 0 }}</div>
            <div style="color: #909399; margin-top: 4px;">总积分</div>
          </div>
          <el-row :gutter="16" style="text-align: center; margin-bottom: 16px;">
            <el-col :span="12">
              <div style="font-size: 24px; font-weight: bold;">{{ team.totalCustomers || 0 }}</div>
              <div style="color: #909399; font-size: 13px;">客户数</div>
            </el-col>
            <el-col :span="12">
              <div style="font-size: 24px; font-weight: bold;">{{ team.totalSigns || 0 }}</div>
              <div style="color: #909399; font-size: 13px;">签约数</div>
            </el-col>
          </el-row>
          <div>
            <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">团队成员 ({{ team.members?.length || 0 }}人)</div>
            <el-tag v-for="m in team.members" :key="m.id" style="margin: 2px 4px;">{{ m.name }}</el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { useSync } from '../../composables/useSync'

const teams = ref([])

async function loadData() {
  const [teamRes, rankRes] = await Promise.all([
    request.get('/teams'),
    request.get('/teams/ranking/list', { params: { days: 30 } })
  ])

  if (teamRes.code === 200 && rankRes.code === 200) {
    const ranking = rankRes.data
    const teamList = teamRes.data

    for (const team of teamList) {
      const detailRes = await request.get(`/teams/${team.id}`)
      if (detailRes.code === 200) team.members = detailRes.data.members
      const rank = ranking.find(r => r.id === team.id)
      if (rank) {
        team.totalScore = rank.total_score
        team.totalCustomers = rank.total_customers
        team.totalSigns = rank.total_signs
      }
    }
    teams.value = teamList
  }
}

onMounted(() => loadData())

useSync('customer:change', loadData, { message: '团队数据已更新' })
</script>
