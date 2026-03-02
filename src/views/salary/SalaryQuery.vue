<template>
  <el-card shadow="never">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">薪酬查询</span>
        <div style="display: flex; gap: 8px;">
          <el-select v-model="year" placeholder="年份" style="width: 100px;" @change="loadData">
            <el-option :label="2025" :value="2025" /><el-option :label="2026" :value="2026" />
          </el-select>
          <el-select v-model="month" placeholder="月份" clearable style="width: 100px;" @change="loadData">
            <el-option v-for="m in 12" :key="m" :label="`${m}月`" :value="m" />
          </el-select>
        </div>
      </div>
    </template>
    <el-table :data="list" stripe v-loading="loading" show-summary :summary-method="getSummary">
      <el-table-column label="月份" width="100">
        <template #default="{ row }">{{ row.year }}-{{ String(row.month).padStart(2, '0') }}</template>
      </el-table-column>
      <el-table-column prop="base_salary" label="基本工资" width="120" align="right">
        <template #default="{ row }">¥{{ row.base_salary?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="commission" label="提成" width="120" align="right">
        <template #default="{ row }">¥{{ row.commission?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="bonus" label="奖金" width="120" align="right">
        <template #default="{ row }">¥{{ row.bonus?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="deduction" label="扣款" width="120" align="right">
        <template #default="{ row }">¥{{ row.deduction?.toLocaleString() }}</template>
      </el-table-column>
      <el-table-column prop="total" label="实发工资" width="140" align="right">
        <template #default="{ row }"><span style="font-weight: bold; color: #409eff;">¥{{ row.total?.toLocaleString() }}</span></template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { useSync } from '../../composables/useSync'

const loading = ref(false)
const list = ref([])
const year = ref(2026)
const month = ref(null)

onMounted(() => loadData())

useSync('salary:change', loadData, { message: '薪酬数据已更新' })

async function loadData() {
  loading.value = true
  try {
    const params = { year: year.value }
    if (month.value) params.month = month.value
    const res = await request.get('/salary', { params })
    if (res.code === 200) list.value = res.data
  } finally { loading.value = false }
}

function getSummary({ columns, data }) {
  const sums = []
  columns.forEach((col, i) => {
    if (i === 0) { sums[i] = '合计'; return }
    const prop = col.property
    if (['base_salary', 'commission', 'bonus', 'deduction', 'total'].includes(prop)) {
      const val = data.reduce((s, r) => s + (r[prop] || 0), 0)
      sums[i] = '¥' + val.toLocaleString()
    } else { sums[i] = '' }
  })
  return sums
}
</script>
