<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { attendanceAdminListApi, attendanceStatsApi, doctorAdminAllApi } from '../../api/admin'

const router = useRouter()

const list = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const doctorList = ref<any[]>([])
const stats = ref<any>({ total: 0, normal: 0, late: 0, leave: 0, absent: 0 })

const searchParams = reactive({
  doctorId: undefined as number | undefined,
  startDate: '',
  endDate: '',
  pageNum: 1,
  pageSize: 15
})

async function loadDoctors() {
  const res = await doctorAdminAllApi()
  if (res.code === 200) doctorList.value = res.data || []
}

async function loadList() {
  loading.value = true
  try {
    const params: any = { pageNum: searchParams.pageNum, pageSize: searchParams.pageSize }
    if (searchParams.doctorId) params.doctorId = searchParams.doctorId
    if (searchParams.startDate) params.startDate = searchParams.startDate
    if (searchParams.endDate) params.endDate = searchParams.endDate
    const res = await attendanceAdminListApi(params)
    if (res.code === 200) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
    const statsRes = await attendanceStatsApi({ startDate: searchParams.startDate, endDate: searchParams.endDate })
    if (statsRes.code === 200) stats.value = statsRes.data || { total: 0, normal: 0, late: 0, leave: 0, absent: 0 }
  } finally {
    loading.value = false
  }
}

function onSearch() { searchParams.pageNum = 1; loadList() }

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

onMounted(() => { loadDoctors(); loadList() })
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <el-button link @click="router.push('/super-admin/home')">返回首页</el-button>
        <h2>考勤记录 & 统计</h2>
        <div></div>
      </div>

      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-title">出勤总数</div>
            <div class="stat-value">{{ stats.total }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card stat-success">
            <div class="stat-title">正常</div>
            <div class="stat-value">{{ stats.normal }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card stat-warning">
            <div class="stat-title">迟到</div>
            <div class="stat-value">{{ stats.late }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card stat-info">
            <div class="stat-title">请假</div>
            <div class="stat-value">{{ stats.leave }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="card">
        <el-form :inline="true">
          <el-form-item label="医生">
            <el-select v-model="searchParams.doctorId" placeholder="全部医生" clearable filterable style="width:180px">
              <el-option v-for="doc in doctorList" :key="doc.id" :label="doc.realName" :value="doc.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker v-model="searchParams.startDate" type="date" value-format="YYYY-MM-DD" placeholder="开始" style="width:140px" />
            <span style="margin:0 6px">-</span>
            <el-date-picker v-model="searchParams.endDate" type="date" value-format="YYYY-MM-DD" placeholder="结束" style="width:140px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch">查询</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="doctorName" label="医生" width="110" />
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
  background: #f4f6fb;
  padding: 24px 12px;
  box-sizing: border-box;
}
.container { max-width: 1300px; margin: 0 auto; }
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.topbar h2 { margin: 0; font-size: 20px; color: #1f2d3d; }
.card { border-radius: 8px; margin-top: 16px; }
.stat-card { text-align: center; }
.stat-title { font-size: 14px; color: #909399; margin-bottom: 8px; }
.stat-value { font-size: 32px; font-weight: 700; color: #303133; }
.stat-success .stat-value { color: #67c23a; }
.stat-warning .stat-value { color: #e6a23c; }
.stat-info .stat-value { color: #909399; }
</style>
