<template>
  <el-card shadow="never">
    <template #header><span style="font-weight: bold;">{{ isEdit ? '编辑客户' : '添加客户' }}</span></template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="max-width: 600px;">
      <el-form-item label="客户姓名" prop="name">
        <el-input v-model="form.name" placeholder="请输入客户姓名" />
      </el-form-item>
      <el-form-item label="手机号码" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入手机号码" />
      </el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio value="男">男</el-radio><el-radio value="女">女</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="年龄">
        <el-input-number v-model="form.age" :min="0" :max="120" />
      </el-form-item>
      <el-form-item label="意向等级">
        <el-select v-model="form.intention_level" style="width: 200px;">
          <el-option label="A级 - 高意向" value="A" /><el-option label="B级 - 中意向" value="B" /><el-option label="C级 - 低意向" value="C" />
        </el-select>
      </el-form-item>
      <el-form-item label="客户来源">
        <el-select v-model="form.source" placeholder="请选择" style="width: 200px;">
          <el-option v-for="s in ['网络推广','门店来访','朋友推荐','电话营销']" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="客户状态">
        <el-select v-model="form.status" style="width: 200px;">
          <el-option label="潜在客户" value="potential" /><el-option label="跟进中" value="followed" /><el-option label="已签约" value="signed" />
        </el-select>
      </el-form-item>
      <el-form-item label="地址">
        <el-input v-model="form.address" placeholder="请输入详细地址" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="handleSubmit">{{ isEdit ? '保存修改' : '立即添加' }}</el-button>
        <el-button @click="router.back()">返回</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const saving = ref(false)
const isEdit = computed(() => !!route.params.id)
const form = ref({ name: '', phone: '', gender: '男', age: 30, intention_level: 'C', source: '', address: '', remark: '', status: 'potential' })
const rules = { name: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }] }

onMounted(async () => {
  if (isEdit.value) {
    const res = await request.get(`/customers/${route.params.id}`)
    if (res.code === 200) {
      const d = res.data
      form.value = { name: d.name, phone: d.phone, gender: d.gender, age: d.age, intention_level: d.intention_level, source: d.source, address: d.address, remark: d.remark, status: d.status }
    }
  }
})

async function handleSubmit() {
  await formRef.value.validate()
  saving.value = true
  try {
    const res = isEdit.value
      ? await request.put(`/customers/${route.params.id}`, form.value)
      : await request.post('/customers', form.value)
    if (res.code === 200) { ElMessage.success(res.message); router.push('/customer') }
    else ElMessage.error(res.message)
  } finally { saving.value = false }
}
</script>
