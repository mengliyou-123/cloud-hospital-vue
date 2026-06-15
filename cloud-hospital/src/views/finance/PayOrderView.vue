<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  payOrderAddApi,
  payOrderPageApi,
  payOrderPaidApi,
  payOrderUpdateApi,
  payOrderVoidApi
} from '../../api/finance'
import type { PayOrder } from '../../types'

const router = useRouter()
const list = ref<PayOrder[]>([])
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const editId = ref<number | null>(null)
const editLoading = ref(false)
const formRef = ref<FormInstance>()

const params = reactive({
  patientName: '',
  payStatus: undefined as number | undefined,
  startTime: '',
  endTime: '',
  pageNum: 1,
  pageSize: 15
})

const form = reactive({
  patientId: undefined as number | undefined,
  registerId: undefined as number | undefined,
  prescriptionId: undefined as number | undefined,
  totalFee: 0,
  payType: 1,
  payStatus: 0
})

const rules: FormRules = {
  patientId: [{ required: true, message: '请输入患者ID', trigger: 'blur' }],
  totalFee: [{ required: true, message: '请输入缴费金额', trigger: 'blur' }]
}

function statusText(status: number) {
  return status === 1 ? '已缴费' : status === 2 ? '已作废' : '待缴费'
}
function statusType(status: number) {
  return status === 1 ? 'success' : status === 2 ? 'info' : 'warning'
}
function payTypeText(type: number) {
  return type === 2 ? '线上' : '线下'
}

async function load() {
  loading.value = true
  try {
    const res = await payOrderPageApi({
      patientName: params.patientName || undefined,
      payStatus: params.payStatus,
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

function onSearch() {
  params.pageNum = 1
  load()
}
function onReset() {
  params.patientName = ''
  params.payStatus = undefined
  params.startTime = ''
  params.endTime = ''
  onSearch()
}
function handlePage(p: number) {
  params.pageNum = p
  load()
}
function handleSize(s: number) {
  params.pageSize = s
  params.pageNum = 1
  load()
}

function openAdd() {
  editId.value = null
  dialogTitle.value = '新增缴费单'
  form.patientId = undefined
  form.registerId = undefined
  form.prescriptionId = undefined
  form.totalFee = 0
  form.payType = 1
  form.payStatus = 0
  dialogVisible.value = true
}
function openEdit(row: PayOrder) {
  editId.value = row.id
  dialogTitle.value = '编辑缴费单'
  form.patientId = row.patientId
  form.registerId = row.registerId || undefined
  form.prescriptionId = row.prescriptionId || undefined
  form.totalFee = Number(row.totalFee)
  form.payType = row.payType || 1
  form.payStatus = row.payStatus || 0
  dialogVisible.value = true
}

async function submit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  editLoading.value = true
  try {
    const payload: Partial<PayOrder> = {
      patientId: form.patientId,
      registerId: form.registerId || null,
      prescriptionId: form.prescriptionId || null,
      totalFee: form.totalFee,
      payType: form.payType,
      payStatus: form.payStatus
    }
    const res = editId.value
      ? await payOrderUpdateApi({ ...payload, id: editId.value })
      : await payOrderAddApi(payload)
    if (res.code === 200) {
      ElMessage.success(editId.value ? '修改成功' : '新增成功')
      dialogVisible.value = false
      load()
    }
  } finally {
    editLoading.value = false
  }
}

async function handlePaid(row: PayOrder, payType: number) {
  try {
    await ElMessageBox.confirm(`确认将缴费单 #${row.id} 标记为${payTypeText(payType)}已缴费？`, '确认缴费', {
      type: 'warning'
    })
  } catch {
    return
  }
  const res = await payOrderPaidApi(row.id, payType)
  if (res.code === 200) {
    ElMessage.success('缴费成功，已自动生成收入流水')
    load()
  }
}

async function handleVoid(row: PayOrder) {
  try {
    await ElMessageBox.confirm(`确定作废缴费单 #${row.id} 吗？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  const res = await payOrderVoidApi(row.id)
  if (res.code === 200) {
    ElMessage.success('作废成功')
    load()
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <el-button link @click="router.push('/finance-admin/home')">返回首页</el-button>
        <h2>收费结算</h2>
        <el-button type="primary" @click="openAdd">+ 新增缴费单</el-button>
      </div>

      <el-card shadow="never" class="card">
        <el-form :inline="true" class="search-form">
          <el-form-item label="患者">
            <el-input v-model="params.patientName" clearable placeholder="姓名/手机号" style="width:180px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="params.payStatus" clearable placeholder="全部" style="width:130px">
              <el-option label="待缴费" :value="0" />
              <el-option label="已缴费" :value="1" />
              <el-option label="已作废" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="开始日期">
            <el-date-picker v-model="params.startTime" type="date" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-form-item label="结束日期">
            <el-date-picker v-model="params.endTime" type="date" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="id" label="单号" width="80" />
          <el-table-column label="患者" min-width="160">
            <template #default="{ row }">
              {{ row.patientName || `患者ID:${row.patientId}` }}
              <span class="muted" v-if="row.patientPhone">{{ row.patientPhone }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="registerId" label="挂号单" width="90" />
          <el-table-column prop="prescriptionId" label="处方单" width="90" />
          <el-table-column label="金额" width="120">
            <template #default="{ row }">￥{{ Number(row.totalFee || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="缴费方式" width="100">
            <template #default="{ row }">{{ payTypeText(row.payType) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.payStatus) as any" size="small">{{ statusText(row.payStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="payTime" label="缴费时间" width="180" />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.payStatus === 0" size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button v-if="row.payStatus === 0" size="small" link type="success" @click="handlePaid(row, 1)">线下缴费</el-button>
              <el-button v-if="row.payStatus === 0" size="small" link type="success" @click="handlePaid(row, 2)">线上缴费</el-button>
              <el-button v-if="row.payStatus === 0" size="small" link type="danger" @click="handleVoid(row)">作废</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager">
          <el-pagination
            :current-page="params.pageNum"
            :page-size="params.pageSize"
            :page-sizes="[10, 15, 30, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="handlePage"
            @size-change="handleSize"
          />
        </div>
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="患者ID" prop="patientId">
          <el-input-number v-model="form.patientId" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="挂号单ID">
          <el-input-number v-model="form.registerId" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="处方单ID">
          <el-input-number v-model="form.prescriptionId" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="缴费金额" prop="totalFee">
          <el-input-number v-model="form.totalFee" :min="0.01" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="缴费方式">
          <el-radio-group v-model="form.payType">
            <el-radio :value="1">线下</el-radio>
            <el-radio :value="2">线上</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submit">确定</el-button>
      </template>
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
.muted { color: #909399; margin-left: 8px; font-size: 12px; }
</style>
