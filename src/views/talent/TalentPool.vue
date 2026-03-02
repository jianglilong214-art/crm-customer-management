<template>
  <el-card shadow="never">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold;">人才库</span>
        <el-button type="primary" @click="showAdd = true"><el-icon><Plus /></el-icon> 添加人才</el-button>
      </div>
    </template>
    <el-form :inline="true" :model="query" style="margin-bottom: 16px;">
      <el-form-item><el-input v-model="query.keyword" placeholder="姓名/手机/学校" clearable style="width: 180px;" /></el-form-item>
      <el-form-item>
        <el-select v-model="query.status" placeholder="状态" clearable style="width: 120px;">
          <el-option label="待分配" value="available" /><el-option label="已分配" value="assigned" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.education" placeholder="学历" clearable style="width: 100px;">
          <el-option v-for="e in ['博士','硕士','本科','大专']" :key="e" :label="e" :value="e" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData">搜索</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" stripe v-loading="loading">
      <el-table-column prop="name" label="姓名" width="80" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="gender" label="性别" width="60" />
      <el-table-column prop="education" label="学历" width="70" />
      <el-table-column prop="school" label="学校" width="140" />
      <el-table-column prop="major" label="专业" width="100" />
      <el-table-column prop="experience" label="经验" show-overflow-tooltip />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'available' ? 'success' : 'info'" size="small">{{ row.status === 'available' ? '待分配' : '已分配' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="router.push(`/talent/${row.id}`)">详情</el-button>
          <el-button link type="success" v-if="row.status === 'available'" @click="openAssign(row)">分配</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
      <el-pagination v-model:current-page="query.page" :page-size="10" :total="total" layout="total, prev, pager, next" @change="loadData" />
    </div>

    <el-dialog v-model="showAdd" title="添加人才" width="500px">
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="姓名"><el-input v-model="addForm.name" /></el-form-item>
        <el-form-item label="手机"><el-input v-model="addForm.phone" /></el-form-item>
        <el-form-item label="性别"><el-radio-group v-model="addForm.gender"><el-radio value="男">男</el-radio><el-radio value="女">女</el-radio></el-radio-group></el-form-item>
        <el-form-item label="学历"><el-select v-model="addForm.education" style="width: 100%;"><el-option v-for="e in ['博士','硕士','本科','大专']" :key="e" :label="e" :value="e" /></el-select></el-form-item>
        <el-form-item label="学校"><el-input v-model="addForm.school" /></el-form-item>
        <el-form-item label="专业"><el-input v-model="addForm.major" /></el-form-item>
        <el-form-item label="经验"><el-input v-model="addForm.experience" type="textarea" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="addForm.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAssign" title="分配人才" width="400px">
      <el-select v-model="assignTo" placeholder="选择负责人" style="width: 100%;">
        <el-option v-for="u in users" :key="u.id" :label="u.name" :value="u.id" />
      </el-select>
      <template #footer>
        <el-button @click="showAssign = false">取消</el-button>
        <el-button type="primary" @click="handleAssign">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
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
const query = ref({ keyword: '', status: '', education: '', page: 1 })
const showAdd = ref(false)
const showAssign = ref(false)
const assignTo = ref(null)
const assigningId = ref(null)
const users = ref([])
const addForm = ref({ name: '', phone: '', gender: '男', education: '', school: '', major: '', experience: '', remark: '' })

onMounted(async () => {
  loadData()
  const res = await request.get('/user/list')
  if (res.code === 200) users.value = res.data
})

useSync('talent:change', loadData, { message: '人才数据已更新' })

async function loadData() {
  loading.value = true
  try {
    const res = await request.get('/talents', { params: query.value })
    if (res.code === 200) { list.value = res.data.list; total.value = res.data.total }
  } finally { loading.value = false }
}

async function handleAdd() {
  const res = await request.post('/talents', addForm.value)
  if (res.code === 200) {
    ElMessage.success('添加成功'); showAdd.value = false
    addForm.value = { name: '', phone: '', gender: '男', education: '', school: '', major: '', experience: '', remark: '' }
    loadData()
  }
}

function openAssign(row) {
  assigningId.value = row.id
  assignTo.value = null
  showAssign.value = true
}

async function handleAssign() {
  if (!assignTo.value) return ElMessage.warning('请选择负责人')
  const res = await request.post(`/talents/${assigningId.value}/assign`, { assigned_to: assignTo.value })
  if (res.code === 200) { ElMessage.success('分配成功'); showAssign.value = false; loadData() }
}
</script>
