<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { leaveApplyApi, leaveListApi } from '../../api/admin'
import type { DoctorLeave } from '../../api/admin'

const router = useRouter()

const list = ref<DoctorLeave[]>([])
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)

const form = reactive({
  leaveType: '事假',
  startDate: '',
  endDate: '',
  totalDays: 1,
  reason: ''
})

const searchParams = reactive({
  auditStatus: undefined as number | undefined,
  pageNum: 1,
  pageSize: 15
})

const leaveTypes = ['事假', '病假', '年假', '婚假', '其他']

async function loadList() {
  loading.value = true
  try {
    const params: any = { pageNum: searchParams.pageNum, pageSize: searchParams.pageSize }
    if (searchParams.auditStatus !== undefined) params.auditStatus = searchParams.auditStatus
    const res = await leaveListApi(params)
    if (res.code === 200) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    loading.value = false
  }
}

function openApply() {
  form.leaveType = '事假'
  form.startDate = ''
  form.endDate = ''
  form.totalDays = 1
  form.reason = ''
  dialogVisible.value = true
}

function computeDays() {
  if (form.startDate && form.endDate) {
    const start = new Date(form.startDate).getTime()
    const end = new Date(form.endDate).getTime()
    if (end >= start) {
      form.totalDays = Math.floor((end - start) / 86400000) + 1
    }
  }
}

async function submitApply() {
  if (!form.startDate || !form.endDate) {
    ElMessage.warning('请选择请假起止日期')
    return
  }
  if (!form.reason || form.reason.trim() === '') {
    ElMessage.warning('请填写请假原因')
    return
  }
  const res = await leaveApplyApi(form)
  if (res.code === 200) {
    ElMessage.success('请假申请已提交，请等待审核')
    dialogVisible.value = false
    loadList()
  }
}

function auditText(v: number) {
  if (v === 0) return '待审核'
  if (v === 1) return '已通过'
  if (v === 2) return '已拒绝'
  return '未知'
}
function auditType(v: number) {
  if (v === 0) return 'warning'
  if (v === 1) return 'success'
  return 'danger'
}

onMounted(() => { loadList() })
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <div class="topbar-left">
          <el-button @click="router.push('/doctor/home')" :icon="'ArrowLeft'">返回首页</el-button>
        </div>
        <span class="topbar-title">请假申请</span>
        <div class="topbar-right">
          <el-button type="primary" @click="openApply">+ 新申请</el-button>
        </div>
      </div>

      <el-card shadow="never" class="card">
        <el-form :inline="true">
          <el-form-item label="审核状态">
            <el-select v-model="searchParams.auditStatus" placeholder="全部" clearable style="width:140px" @change="loadList">
              <el-option label="待审核" :value="0" />
              <el-option label="已通过" :value="1" />
              <el-option label="已拒绝" :value="2" />
            </el-select>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="leaveType" label="类型" width="90" />
          <el-table-column prop="startDate" label="开始日期" width="120" />
          <el-table-column prop="endDate" label="结束日期" width="120" />
          <el-table-column prop="totalDays" label="天数" width="80" />
          <el-table-column prop="reason" label="原因" min-width="200" show-overflow-tooltip />
          <el-table-column label="审核状态" width="100">
            <template #default="{ row }">
              <el-tag :type="auditType(row.auditStatus)" size="small">{{ auditText(row.auditStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="auditRemark" label="审核备注" min-width="180" show-overflow-tooltip />
          <el-table-column prop="createTime" label="申请时间" width="170" />
        </el-table>
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" title="请假申请" width="520px">
      <el-form :model="form" label-width="96px">
        <el-form-item label="请假类型">
          <el-select v-model="form.leaveType" style="width:100%">
            <el-option v-for="t in leaveTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width:100%" @change="computeDays" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" style="width:100%" @change="computeDays" />
        </el-form-item>
        <el-form-item label="总天数">
          <el-input-number v-model="form.totalDays" :min="1" :max="365" />
        </el-form-item>
        <el-form-item label="请假原因">
          <el-input v-model="form.reason" type="textarea" :rows="4" placeholder="请详细说明请假原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApply">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--h-bg);
  padding: 24px 12px;
  box-sizing: border-box;
}
.container { max-width: 1000px; margin: 0 auto; }
.topbar { display: flex; align-items: center; padding: 12px 20px; background: var(--h-card); border: 1px solid var(--h-border); border-radius: 8px; margin-bottom: 16px; }
.topbar-left, .topbar-right { display: flex; align-items: center; gap: 12px; min-width: 180px; }
.topbar-right { justify-content: flex-end; }
.topbar-title { flex: 1; text-align: center; font-size: 18px; font-weight: 700; color: #1f2d3d; }
.card { border-radius: 8px; }
</style>
