<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { doctorScheduleListApi } from '../../api/admin'
import type { DoctorSchedule } from '../../api/admin'

const router = useRouter()

const list = ref<DoctorSchedule[]>([])
const loading = ref(false)
const viewMode = ref<'week' | 'month' | 'list'>('week')

const filterParams = reactive({
  startDate: '',
  endDate: ''
})

async function loadList() {
  loading.value = true
  try {
    const params: any = { pageNum: 1, pageSize: 50 }
    if (filterParams.startDate) params.startDate = filterParams.startDate
    if (filterParams.endDate) params.endDate = filterParams.endDate
    const res = await doctorScheduleListApi(params)
    if (res.code === 200) list.value = res.data.list || []
  } finally {
    loading.value = false
  }
}

function setThisWeek() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  filterParams.startDate = formatDate(monday)
  filterParams.endDate = formatDate(sunday)
  loadList()
}

function setThisMonth() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  filterParams.startDate = formatDate(first)
  filterParams.endDate = formatDate(last)
  loadList()
}

function clearFilter() {
  filterParams.startDate = ''
  filterParams.endDate = ''
  loadList()
}

function onViewModeChange(val: string) {
  if (val === 'week') setThisWeek()
  else if (val === 'month') setThisMonth()
  else clearFilter()
}

function formatDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function statusText(v: number) {
  if (v === 1) return '正常'
  if (v === 2) return '调班'
  if (v === 0) return '已取消'
  return '未知'
}
function statusType(v: number) {
  if (v === 1) return 'success'
  if (v === 2) return 'warning'
  return 'info'
}

// 按日期分组用于 list 视图
const groupedList = computed(() => {
  const map = new Map<string, DoctorSchedule[]>()
  for (const item of list.value) {
    if (!map.has(item.scheduleDate)) map.set(item.scheduleDate, [])
    map.get(item.scheduleDate)!.push(item)
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1))
})

onMounted(() => {
  setThisWeek()
})
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <div class="topbar-left">
          <el-button @click="router.push('/doctor/home')" :icon="'ArrowLeft'">返回首页</el-button>
        </div>
        <span class="topbar-title">我的排班</span>
        <div class="topbar-right">
          <el-radio-group v-model="viewMode" @change="onViewModeChange">
            <el-radio-button value="week">本周</el-radio-button>
            <el-radio-button value="month">本月</el-radio-button>
            <el-radio-button value="list">全部</el-radio-button>
          </el-radio-group>
          <el-button @click="clearFilter">清除筛选</el-button>
        </div>
      </div>

      <el-card shadow="never" class="card">
        <el-form :inline="true">
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="filterParams.startDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="开始日期"
              style="width:140px"
            />
            <span style="margin:0 6px">-</span>
            <el-date-picker
              v-model="filterParams.endDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="结束日期"
              style="width:140px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadList">查询</el-button>
          </el-form-item>
        </el-form>

        <div v-if="list.length === 0 && !loading" class="empty-tip">
          <el-empty description="暂无排班信息" />
        </div>

        <div v-else-if="viewMode === 'list'" class="list-view">
          <div v-for="[date, items] in groupedList" :key="date" class="day-group">
            <div class="date-label">{{ date }}</div>
            <el-row :gutter="12">
              <el-col :span="8" v-for="item in items" :key="item.id">
                <el-card class="schedule-card" shadow="hover">
                  <div class="row1">
                    <span class="slot">{{ item.timeSlot }}</span>
                    <el-tag :type="statusType(item.status)" size="small">{{ statusText(item.status) }}</el-tag>
                  </div>
                  <div class="row2">科室：{{ item.deptName }}</div>
                  <div class="row2" v-if="item.remark">备注：{{ item.remark }}</div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </div>

        <div v-else class="list-view">
          <el-table :data="list" stripe border v-loading="loading" style="width:100%">
            <el-table-column prop="scheduleDate" label="日期" width="140" />
            <el-table-column prop="timeSlot" label="时段" width="100" />
            <el-table-column prop="deptName" label="科室" width="150" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" />
          </el-table>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #f4f6fb;
  padding: 24px 12px;
  box-sizing: border-box;
}
.container { max-width: 1200px; margin: 0 auto; }
.topbar { display: flex; align-items: center; padding: 12px 20px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-radius: 8px; margin-bottom: 16px; }
.topbar-left, .topbar-right { display: flex; align-items: center; gap: 12px; min-width: 180px; flex-wrap: wrap; }
.topbar-right { justify-content: flex-end; }
.topbar-title { flex: 1; text-align: center; font-size: 18px; font-weight: 700; color: #1f2d3d; }
.card { border-radius: 8px; }
.empty-tip { padding: 40px 0; }
.day-group { margin-bottom: 20px; }
.date-label {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
  padding: 8px 12px;
  background: #ecf5ff;
  border-left: 4px solid #409eff;
  margin-bottom: 10px;
  border-radius: 4px;
}
.schedule-card { margin-bottom: 12px; }
.row1 { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.slot { font-size: 16px; font-weight: 600; color: #409eff; }
.row2 { font-size: 13px; color: #606266; margin: 2px 0; }
</style>
