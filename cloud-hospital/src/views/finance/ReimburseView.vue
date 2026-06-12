<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  reimburseAddApi,
  reimburseDeleteApi,
  reimbursePageApi,
  reimburseStatusApi,
  reimburseUpdateApi
} from '../../api/finance'
import type { Reimburse } from '../../types'

const router = useRouter()
const list = ref<Reimburse[]>([])
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const editId = ref<number | null>(null)
const editLoading = ref(false)
const formRef = ref<FormInstance>()

const params = reactive({
  realName: '',
  auditStatus: undefined as number | undefined,
  startTime: '',
  endTime: '',
  pageNum: 1,
  pageSize: 15
})

const form = reactive({
  userId: undefined as number | undefined,
  reimburseType: '',
  totalMoney: 0,
  reimburseDesc: '',
  auditStatus: 0
})

const rules: FormRules = {
  userId: [{ required: true, message: '请输入报销人ID', trigger: 'blur' }],
  reimburseType: [{ required: true, message: '请输入报销类型', trigger: 'blur' }],
  totalMoney: [{ required: true, message: '请输入报销金额', trigger: 'blur' }]
}

function statusText(status: number) {
  return status === 1 ? '已通过' : status === 2 ? '已驳回' : '待审核'
}
function statusTag(status: number) {
  return status === 1 ? 'success' : status === 2 ? 'danger' : 'warning'
}

async function load() {
  loading.value = true
  try {
    const res = await reimbursePageApi({
      realName: params.realName || undefined,
      auditStatus: params.auditStatus,
      startTime: params.startTime || undefined,
      endTime: params.endTime || undefined,
      pageNum: params.pageNum,
      pageSize: params.pageSize
    })
    if (res.code === 200) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    loading.value = false
  }
}
function onSearch() { params.pageNum = 1; load() }
function onReset() {
  params.realName = ''
  params.auditStatus = undefined
  params.startTime = ''
  params.endTime = ''
  onSearch()
}
function handlePage(p: number) { params.pageNum = p; load() }
function handleSize(s: number) { params.pageSize = s; params.pageNum = 1; load() }

function openAdd() {
  editId.value = null
  dialogTitle.value = '新增报销单'
  form.userId = undefined
  form.reimburseType = ''
  form.totalMoney = 0
  form.reimburseDesc = ''
  form.auditStatus = 0
  dialogVisible.value = true
}
function openEdit(row: Reimburse) {
  editId.value = row.id
  dialogTitle.value = '编辑报销单'
  form.userId = row.userId
  form.reimburseType = row.reimburseType
  form.totalMoney = Number(row.totalMoney)
  form.reimburseDesc = row.reimburseDesc || ''
  form.auditStatus = row.auditStatus
  dialogVisible.value = true
}

async function submit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  editLoading.value = true
  try {
    const payload: Partial<Reimburse> = {
      userId: form.userId,
      reimburseType: form.reimburseType,
      totalMoney: form.totalMoney,
      reimburseDesc: form.reimburseDesc,
      auditStatus: form.auditStatus
    }
    const res = editId.value
      ? await reimburseUpdateApi({ ...payload, id: editId.value })
      : await reimburseAddApi(payload)
    if (res.code === 200) {
      ElMessage.success(editId.value ? '修改成功' : '新增成功')
      dialogVisible.value = false
      load()
    }
  } finally {
    editLoading.value = false
  }
}

async function handleStatus(row: Reimburse, auditStatus: number) {
  try {
    await ElMessageBox.confirm(`确认将报销单 #${row.id} 标记为【${statusText(auditStatus)}】？`, '审核确认', { type: 'warning' })
  } catch { return }
  const res = await reimburseStatusApi(row.id, auditStatus)
  if (res.code === 200) {
    ElMessage.success(auditStatus === 1 ? '审核通过，已自动生成支出流水' : '审核完成')
    load()
  }
}
async function handleDelete(row: Reimburse) {
  try { await ElMessageBox.confirm(`确定删除报销单 #${row.id} 吗？`, '提示', { type: 'warning' }) } catch { return }
  const res = await reimburseDeleteApi(row.id)
  if (res.code === 200) { ElMessage.success('删除成功'); load() }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <el-button link @click="router.push('/finance-admin/home')">返回首页</el-button>
        <h2>报销管理</h2>
        <el-button type="primary" @click="openAdd">+ 新增报销</el-button>
      </div>

      <el-card shadow="never" class="card">
        <el-form :inline="true" class="search-form">
          <el-form-item label="报销人"><el-input v-model="params.realName" clearable placeholder="姓名/账号" style="width:180px" /></el-form-item>
          <el-form-item label="状态">
            <el-select v-model="params.auditStatus" clearable placeholder="全部" style="width:130px">
              <el-option label="待审核" :value="0" /><el-option label="已通过" :value="1" /><el-option label="已驳回" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="开始日期"><el-date-picker v-model="params.startTime" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item label="结束日期"><el-date-picker v-model="params.endTime" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item><el-button type="primary" @click="onSearch">查询</el-button><el-button @click="onReset">重置</el-button></el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="报销人" width="160"><template #default="{ row }">{{ row.realName || row.username || `用户ID:${row.userId}` }}</template></el-table-column>
          <el-table-column prop="reimburseType" label="类型" width="120" />
          <el-table-column label="金额" width="120"><template #default="{ row }">￥{{ Number(row.totalMoney || 0).toFixed(2) }}</template></el-table-column>
          <el-table-column prop="reimburseDesc" label="说明" min-width="260" show-overflow-tooltip />
          <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="statusTag(row.auditStatus) as any">{{ statusText(row.auditStatus) }}</el-tag></template></el-table-column>
          <el-table-column prop="createTime" label="提交时间" width="180" />
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button v-if="row.auditStatus !== 1" size="small" link type="success" @click="handleStatus(row, 1)">通过</el-button>
              <el-button v-if="row.auditStatus !== 2" size="small" link type="warning" @click="handleStatus(row, 2)">驳回</el-button>
              <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager"><el-pagination :current-page="params.pageNum" :page-size="params.pageSize" :page-sizes="[10,15,30,50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background @current-change="handlePage" @size-change="handleSize" /></div>
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="报销人ID" prop="userId"><el-input-number v-model="form.userId" :min="1" style="width:100%" /></el-form-item>
        <el-form-item label="报销类型" prop="reimburseType"><el-input v-model="form.reimburseType" placeholder="差旅费/采购报销等" /></el-form-item>
        <el-form-item label="报销金额" prop="totalMoney"><el-input-number v-model="form.totalMoney" :min="0.01" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item label="说明"><el-input v-model="form.reimburseDesc" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="editLoading" @click="submit">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f4f6fb; padding: 24px 12px; box-sizing: border-box; }
.container { max-width: 1280px; margin: 0 auto; }
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.topbar h2 { margin: 0; font-size: 20px; color: #1f2d3d; }
.card { border-radius: 8px; }
.search-form { margin-bottom: 8px; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
