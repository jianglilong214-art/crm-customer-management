<template>
  <div class="calendar-view">
    <!-- Header -->
    <el-card shadow="never" class="calendar-header-card">
      <div class="calendar-header">
        <el-button-group>
          <el-button @click="prevMonth" :icon="ArrowLeft">上月</el-button>
          <el-button @click="goToday">今天</el-button>
          <el-button @click="nextMonth">下月<el-icon class="el-icon--right"><ArrowRight /></el-icon></el-button>
        </el-button-group>
        <h2 class="calendar-title">{{ currentYear }}年{{ currentMonth }}月</h2>
        <el-button type="primary" :icon="Plus" @click="openAddDialog">添加事件</el-button>
      </div>
    </el-card>

    <!-- Calendar Grid -->
    <el-card shadow="never" class="calendar-grid-card" v-loading="loading">
      <!-- Weekday headers -->
      <div class="calendar-grid">
        <div class="weekday-header" v-for="day in weekdays" :key="day">{{ day }}</div>

        <!-- Day cells -->
        <div
          v-for="(cell, index) in calendarCells"
          :key="index"
          class="day-cell"
          :class="{
            'other-month': !cell.currentMonth,
            'is-today': cell.isToday
          }"
          @click="cell.currentMonth && openDayDialog(cell)"
        >
          <span class="day-number" :class="{ 'today-badge': cell.isToday }">{{ cell.day }}</span>
          <div class="event-dots" v-if="cell.events.length > 0">
            <span
              v-for="dot in getUniqueDots(cell.events)"
              :key="dot.type"
              class="event-dot"
              :style="{ backgroundColor: dot.color }"
            ></span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Day Events Dialog -->
    <el-dialog
      v-model="dayDialogVisible"
      :title="selectedDateLabel"
      width="520px"
      destroy-on-close
    >
      <div v-if="selectedDayEvents.length === 0" class="empty-tip">
        <el-empty description="当天暂无事件" :image-size="80" />
      </div>
      <div v-else class="day-event-list">
        <div
          v-for="event in selectedDayEvents"
          :key="event.id"
          class="day-event-item"
        >
          <div class="event-indicator" :style="{ backgroundColor: getEventColor(event) }"></div>
          <div class="event-info">
            <div class="event-title">{{ event.title }}</div>
            <div class="event-meta">
              <el-tag size="small" :type="getEventTagType(event.event_type)">{{ getEventTypeLabel(event.event_type) }}</el-tag>
              <span v-if="event.source" class="event-source">来源: {{ event.source }}</span>
            </div>
            <div v-if="event.description" class="event-desc">{{ event.description }}</div>
          </div>
          <el-button
            v-if="event.event_type === 'custom'"
            type="danger"
            :icon="Delete"
            circle
            size="small"
            @click.stop="handleDelete(event)"
          />
        </div>
      </div>
    </el-dialog>

    <!-- Add Event Dialog -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加事件"
      width="480px"
      destroy-on-close
    >
      <el-form ref="addFormRef" :model="addForm" :rules="addFormRules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="addForm.title" placeholder="请输入事件标题" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="日期" prop="event_date">
          <el-date-picker
            v-model="addForm.event_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="addForm.description" type="textarea" :rows="3" placeholder="请输入事件描述（可选）" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="addForm.color" :predefine="predefineColors" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleAddEvent">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ArrowLeft, ArrowRight, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../utils/request'

// --- State ---
const loading = ref(false)
const saving = ref(false)
const events = ref([])
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1)

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// Day dialog
const dayDialogVisible = ref(false)
const selectedDate = ref('')
const selectedDayEvents = ref([])

// Add dialog
const addDialogVisible = ref(false)
const addFormRef = ref()
const addForm = ref({
  title: '',
  description: '',
  event_date: '',
  color: '#409EFF'
})
const addFormRules = {
  title: [{ required: true, message: '请输入事件标题', trigger: 'blur' }],
  event_date: [{ required: true, message: '请选择日期', trigger: 'change' }]
}
const predefineColors = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
  '#909399', '#764ba2', '#00b4d8', '#e91e63'
]

// --- Computed ---
const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  const [y, m, d] = selectedDate.value.split('-')
  return `${y}年${parseInt(m)}月${parseInt(d)}日 事件`
})

const eventsByDate = computed(() => {
  const map = {}
  for (const ev of events.value) {
    const date = ev.event_date
    if (!map[date]) map[date] = []
    map[date].push(ev)
  }
  return map
})

const calendarCells = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startDow = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const prevMonthLast = new Date(year, month - 1, 0)
  const prevDays = prevMonthLast.getDate()

  const cells = []
  const todayStr = formatDate(today)

  // Previous month fill
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevDays - i
    const pm = month - 1 <= 0 ? 12 : month - 1
    const py = month - 1 <= 0 ? year - 1 : year
    const dateStr = `${py}-${String(pm).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({
      day,
      date: dateStr,
      currentMonth: false,
      isToday: dateStr === todayStr,
      events: eventsByDate.value[dateStr] || []
    })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({
      day: d,
      date: dateStr,
      currentMonth: true,
      isToday: dateStr === todayStr,
      events: eventsByDate.value[dateStr] || []
    })
  }

  // Next month fill (complete last row)
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const nm = month + 1 > 12 ? 1 : month + 1
      const ny = month + 1 > 12 ? year + 1 : year
      const dateStr = `${ny}-${String(nm).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        day: d,
        date: dateStr,
        currentMonth: false,
        isToday: dateStr === todayStr,
        events: eventsByDate.value[dateStr] || []
      })
    }
  }

  return cells
})

// --- Methods ---
function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function goToday() {
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth() + 1
}

function getEventColor(event) {
  if (event.color) return event.color
  switch (event.event_type) {
    case 'follow': return '#E6A23C'
    case 'attendance': return '#67C23A'
    case 'custom': return '#409EFF'
    default: return '#909399'
  }
}

function getUniqueDots(eventList) {
  const seen = new Set()
  const dots = []
  for (const ev of eventList) {
    const type = ev.event_type
    if (!seen.has(type)) {
      seen.add(type)
      dots.push({ type, color: getEventColor(ev) })
    }
  }
  return dots
}

function getEventTypeLabel(type) {
  switch (type) {
    case 'follow': return '跟进'
    case 'attendance': return '考勤'
    case 'custom': return '自定义'
    default: return type
  }
}

function getEventTagType(type) {
  switch (type) {
    case 'follow': return 'warning'
    case 'attendance': return 'success'
    case 'custom': return ''
    default: return 'info'
  }
}

function openDayDialog(cell) {
  selectedDate.value = cell.date
  selectedDayEvents.value = cell.events
  dayDialogVisible.value = true
}

function openAddDialog() {
  addForm.value = {
    title: '',
    description: '',
    event_date: '',
    color: '#409EFF'
  }
  addDialogVisible.value = true
}

async function loadEvents() {
  loading.value = true
  try {
    const res = await request.get('/calendar/events', {
      params: { year: currentYear.value, month: currentMonth.value }
    })
    if (res.code === 200) {
      events.value = res.data || []
    }
  } finally {
    loading.value = false
  }
}

async function handleAddEvent() {
  await addFormRef.value.validate()
  saving.value = true
  try {
    const res = await request.post('/calendar/events', {
      ...addForm.value,
      event_type: 'custom'
    })
    if (res.code === 200) {
      ElMessage.success('事件添加成功')
      addDialogVisible.value = false
      loadEvents()
    }
  } finally {
    saving.value = false
  }
}

async function handleDelete(event) {
  await ElMessageBox.confirm('确定要删除该事件吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  try {
    const res = await request.delete(`/calendar/events/${event.id}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      selectedDayEvents.value = selectedDayEvents.value.filter(e => e.id !== event.id)
      loadEvents()
    }
  } catch {
    // cancelled or error
  }
}

// Watch month changes to reload
watch([currentYear, currentMonth], () => {
  loadEvents()
})

onMounted(() => loadEvents())
</script>

<style scoped>
.calendar-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calendar-header-card :deep(.el-card__body) {
  padding: 12px 20px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.calendar-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  user-select: none;
}

/* Calendar grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-top: 1px solid #ebeef5;
  border-left: 1px solid #ebeef5;
}

.weekday-header {
  padding: 10px 0;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  background-color: #fafafa;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
}

.day-cell {
  min-height: 80px;
  padding: 6px;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.day-cell:hover {
  background-color: #f5f7fa;
}

.day-cell.other-month {
  cursor: default;
}

.day-cell.other-month .day-number {
  color: #c0c4cc;
}

.day-cell.other-month:hover {
  background-color: transparent;
}

.day-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 14px;
  color: #303133;
  margin-top: 2px;
}

.today-badge {
  background-color: #409EFF;
  color: #fff;
  font-weight: 600;
}

.event-dots {
  display: flex;
  gap: 4px;
  margin-top: auto;
  padding-bottom: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.event-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Day event list in dialog */
.day-event-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.day-event-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background-color: #fafafa;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.day-event-item:hover {
  background-color: #f0f2f5;
}

.event-indicator {
  width: 4px;
  min-height: 40px;
  border-radius: 2px;
  flex-shrink: 0;
  align-self: stretch;
}

.event-info {
  flex: 1;
  min-width: 0;
}

.event-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.event-source {
  font-size: 12px;
  color: #909399;
}

.event-desc {
  font-size: 13px;
  color: #606266;
  margin-top: 4px;
  line-height: 1.5;
}

.empty-tip {
  padding: 20px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .calendar-header {
    justify-content: center;
  }

  .calendar-title {
    width: 100%;
    text-align: center;
    order: -1;
    font-size: 18px;
  }

  .day-cell {
    min-height: 50px;
    padding: 3px;
  }

  .day-number {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .event-dot {
    width: 6px;
    height: 6px;
  }

  .weekday-header {
    font-size: 12px;
    padding: 6px 0;
  }
}
</style>
