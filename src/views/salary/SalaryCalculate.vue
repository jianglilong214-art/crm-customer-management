<template>
  <el-card shadow="never">
    <template #header><span style="font-weight: bold;">薪酬计算器</span></template>
    <el-row :gutter="32">
      <el-col :span="12">
        <el-form :model="form" label-width="100px">
          <el-form-item label="基本工资"><el-input-number v-model="form.base_salary" :min="0" :step="1000" style="width: 100%;" /></el-form-item>
          <el-form-item label="提成比例(%)"><el-input-number v-model="form.commission_rate" :min="0" :max="100" :step="0.5" style="width: 100%;" /></el-form-item>
          <el-form-item label="销售金额"><el-input-number v-model="form.sales_amount" :min="0" :step="10000" style="width: 100%;" /></el-form-item>
          <el-form-item label="奖金"><el-input-number v-model="form.bonus" :min="0" :step="500" style="width: 100%;" /></el-form-item>
          <el-form-item label="扣款"><el-input-number v-model="form.deduction" :min="0" :step="100" style="width: 100%;" /></el-form-item>
          <el-form-item><el-button type="primary" @click="calculate">计算薪酬</el-button></el-form-item>
        </el-form>
      </el-col>
      <el-col :span="12">
        <div v-if="result" style="background: #f5f7fa; padding: 24px; border-radius: 8px;">
          <h3 style="margin-bottom: 16px;">计算结果</h3>
          <div v-for="item in resultItems" :key="item.label" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
            <span>{{ item.label }}</span>
            <span :style="{ fontWeight: item.bold ? 'bold' : 'normal', color: item.bold ? '#409eff' : '#303133', fontSize: item.bold ? '18px' : '14px' }">¥{{ item.value?.toLocaleString() }}</span>
          </div>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import request from '../../utils/request'

const form = ref({ base_salary: 6000, commission_rate: 3, sales_amount: 0, bonus: 0, deduction: 0 })
const result = ref(null)

const resultItems = computed(() => result.value ? [
  { label: '基本工资', value: result.value.base_salary },
  { label: '销售提成', value: result.value.commission },
  { label: '奖金', value: result.value.bonus },
  { label: '扣款', value: result.value.deduction },
  { label: '实发工资', value: result.value.total, bold: true }
] : [])

async function calculate() {
  const res = await request.post('/salary/calculate', form.value)
  if (res.code === 200) result.value = res.data
}
</script>
