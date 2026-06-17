<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { leaveAdminListApi, leaveAuditApi } from '../../api/admin'
import type { DoctorLeave } from '../../api/admin'

const router = useRouter()

const list = ref<DoctorLeave[]>([])
const total = ref(0)
const loading = ref(false)

const searchParams = reactive({
  auditStatus: undefined as number | undefined,
  pageNum: 1,
  pageSize: 15
})

const auditDialogVisible = ref(false)
const currentId = ref<number | null>(null)
const auditForm = reactive({
  auditStatus: 1,
  auditRemark: ''
})

async function loadList() {
  loading.value = true
  try {
    const params: any = { pageNum: searchParams.pageNum, pageSize: searchParams.pageSize }
    if (searchParams.auditStatus !== undefined) params.auditStatus = searchParams.auditStatus
    const res = await leaveAdminListApi(params)
    if (res.code === 200) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    loading.value = false
  }
}

function openAudit(row: DoctorLeave) {
  if (row.auditStatus !== 0) {
    ElMessage.warning('该申请已处理过')
    return
  }
  currentId.value = row.id
  auditForm.auditStatus = 1
  auditForm.auditRemark = ''
  auditDialogVisible.value = true
}

async function submitAudit() {
  if (currentId.value === null) return
  const res = await leaveAuditApi(currentId.value, auditForm)
  if (res.code === 200) {
    ElMessage.success('审核完成')
    auditDialogVisible.value = false
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
        <el-button link @click="router.push('/super-admin/home')">返回首页</el-button>
        <h2>请假审批</h2>
        <div></div>
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
          <el-table-column prop="doctorName" label="医生" width="110" />
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
          <el-table-column prop="auditUserName" label="审核人" width="100" />
          <el-table-column prop="auditRemark" label="审核备注" min-width="160" show-overflow-tooltip />
          <el-table-column prop="createTime" label="申请时间" width="170" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" :disabled="row.auditStatus !== 0" @click="openAudit(row)">
                审核
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-dialog v-model="auditDialogVisible" title="审核请假申请" width="520px">
      <el-form :model="auditForm" label-width="96px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="2">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input v-model="auditForm.auditRemark" type="textarea" :rows="3" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确定</el-button>
      </template>
    </el-dialog>
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
.card { border-radius: 8px; }
</style>
