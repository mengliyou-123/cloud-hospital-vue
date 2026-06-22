<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
import { doctorCheckInApi, doctorCheckOutApi, doctorAttendanceListApi } from '../../api/admin'
import type { DoctorAttendance } from '../../api/admin'

const today = ref('')
const nowTime = ref('')
const list = ref<DoctorAttendance[]>([])
const loading = ref(false)
const checkInTime = ref('')
const checkOutTime = ref('')

const filterParams = reactive({
  startDate: '',
  endDate: ''
})

function updateClock() {
  const now = new Date()
  today.value = now.toLocaleDateString('zh-CN')
  nowTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
}

let timer: any = null
onMounted(() => {
  updateClock()
  timer = setInterval(updateClock, 1000)
  loadList()
  return () => clearInterval(timer)
})

async function handleCheckIn() {
  const res = await doctorCheckInApi({ location: '医院', remark: '' })
  if (res.code === 200) {
    ElMessage.success('上班打卡成功！')
    loadList()
  }
}

async function handleCheckOut() {
  const res = await doctorCheckOutApi({ location: '医院', remark: '' })
  if (res.code === 200) {
    ElMessage.success('下班打卡成功！')
    loadList()
  }
}

async function loadList() {
  loading.value = true
  try {
    const params: any = { pageNum: 1, pageSize: 30 }
    if (filterParams.startDate) params.startDate = filterParams.startDate
    if (filterParams.endDate) params.endDate = filterParams.endDate
    const res = await doctorAttendanceListApi(params)
    if (res.code === 200) {
      list.value = res.data.list || []
      // 从列表中找出今天的打卡时间
      const today = new Date().toISOString().substring(0, 10)
      const todayRecord = list.value.find((r: any) => r.attendanceDate === today)
      checkInTime.value = todayRecord?.checkInTime || ''
      checkOutTime.value = todayRecord?.checkOutTime || ''
    }
  } finally {
    loading.value = false
  }
}

function statusText(v: number) {
  if (v === 1) return '正常'
  if (v === 2) return '迟到'
  if (v === 3) return '请假'
  if (v === 0) return '未出勤'
  return '未知'
}
function statusType(v: number) {
  if (v === 1) return 'success'
  if (v === 2) return 'warning'
  if (v === 3) return 'info'
  return 'danger'
}
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <div class="topbar-left">
          <el-button @click="router.push('/doctor/home')" :icon="'ArrowLeft'">返回首页</el-button>
        </div>
        <span class="topbar-title">考勤打卡</span>
        <div class="topbar-right"></div>
      </div>

      <el-card shadow="never" class="card clock-card">
        <div class="clock">
          <div class="date">{{ today }}</div>
          <div class="time">{{ nowTime }}</div>
        </div>
        <div class="check-records">
          <div class="record-item">
            <div class="label">上班打卡</div>
            <div class="value">{{ checkInTime || '未打卡' }}</div>
          </div>
          <div class="record-item">
            <div class="label">下班打卡</div>
            <div class="value">{{ checkOutTime || '未打卡' }}</div>
          </div>
        </div>
        <div class="actions">
          <el-button type="primary" size="large" :disabled="!!checkInTime" @click="handleCheckIn">
            上班打卡
          </el-button>
          <el-button type="success" size="large" :disabled="!checkInTime || !!checkOutTime" @click="handleCheckOut">
            下班打卡
          </el-button>
        </div>
      </el-card>

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

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="attendanceDate" label="日期" width="140" />
          <el-table-column prop="checkInTime" label="上班时间" width="140" />
          <el-table-column prop="checkOutTime" label="下班时间" width="140" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--h-bg);
  padding: 24px 12px;
  box-sizing: border-box;
}
.container { max-width: 900px; margin: 0 auto; }
.topbar { display: flex; align-items: center; padding: 12px 20px; background: var(--h-card); border: 1px solid var(--h-border); border-radius: 8px; margin-bottom: 16px; }
.topbar-left, .topbar-right { display: flex; align-items: center; gap: 12px; min-width: 180px; }
.topbar-right { justify-content: flex-end; }
.topbar-title { flex: 1; text-align: center; font-size: 18px; font-weight: 700; color: #1f2d3d; }
.card { border-radius: 8px; margin-bottom: 16px; }
.clock-card { text-align: center; padding: 20px 0; }
.clock { margin-bottom: 20px; }
.date { font-size: 18px; color: #606266; margin-bottom: 8px; }
.time { font-size: 48px; font-weight: 700; color: #409eff; font-family: 'Courier New', monospace; letter-spacing: 2px; }
.check-records { display: flex; justify-content: center; gap: 40px; margin-bottom: 20px; }
.record-item { padding: 16px 24px; background: #f4f6fb; border-radius: 8px; min-width: 180px; }
.record-item .label { font-size: 14px; color: #909399; margin-bottom: 6px; }
.record-item .value { font-size: 22px; font-weight: 600; color: #303133; }
.actions button { margin: 0 10px; min-width: 140px; }
</style>
