<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  financeRecordAddApi,
  financeRecordDeleteApi,
  financeRecordPageApi,
  financeRecordUpdateApi
} from '../../api/finance'
import type { FinanceRecord } from '../../types'

const router = useRouter()
const list = ref<FinanceRecord[]>([])
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const editId = ref<number | null>(null)
const editLoading = ref(false)
const formRef = ref<FormInstance>()

const params = reactive({
  recordType: undefined as number | undefined,
  startTime: '',
  endTime: '',
  pageNum: 1,
  pageSize: 15
})

const form = reactive({
  orderId: undefined as number | undefined,
  recordType: 1,
  money: 0,
  recordDesc: ''
})

const rules: FormRules = {
  recordType: [{ required: true, message: '请选择收支类型', trigger: 'change' }],
  money: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  recordDesc: [{ required: true, message: '请输入说明', trigger: 'blur' }]
}

function typeText(type: number) {
  return type === 1 ? '收入' : '支出'
}
function typeTag(type: number) {
  return type === 1 ? 'success' : 'danger'
}

async function load() {
  loading.value = true
  try {
    const res = await financeRecordPageApi({
      recordType: params.recordType,
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
  params.recordType = undefined
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
  dialogTitle.value = '新增收支记录'
  form.orderId = undefined
  form.recordType = 1
  form.money = 0
  form.recordDesc = ''
  dialogVisible.value = true
}
function openEdit(row: FinanceRecord) {
  editId.value = row.id
  dialogTitle.value = '编辑收支记录'
  form.orderId = row.orderId || undefined
  form.recordType = row.recordType
  form.money = Number(row.money)
  form.recordDesc = row.recordDesc || ''
  dialogVisible.value = true
}

async function submit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  editLoading.value = true
  try {
    const payload: Partial<FinanceRecord> = {
      orderId: form.orderId || null,
      recordType: form.recordType,
      money: form.money,
      recordDesc: form.recordDesc
    }
    const res = editId.value
      ? await financeRecordUpdateApi({ ...payload, id: editId.value })
      : await financeRecordAddApi(payload)
    if (res.code === 200) {
      ElMessage.success(editId.value ? '修改成功' : '新增成功')
      dialogVisible.value = false
      load()
    }
  } finally {
    editLoading.value = false
  }
}

async function handleDelete(row: FinanceRecord) {
  try {
    await ElMessageBox.confirm(`确定删除收支记录 #${row.id} 吗？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  const res = await financeRecordDeleteApi(row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
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
        <h2>财务台账</h2>
        <el-button type="primary" @click="openAdd">+ 新增流水</el-button>
      </div>

      <el-card shadow="never" class="card">
        <el-form :inline="true" class="search-form">
          <el-form-item label="类型">
            <el-select v-model="params.recordType" clearable placeholder="全部" style="width:130px">
              <el-option label="收入" :value="1" />
              <el-option label="支出" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="开始日期"><el-date-picker v-model="params.startTime" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item label="结束日期"><el-date-picker v-model="params.endTime" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="类型" width="100">
            <template #default="{ row }"><el-tag :type="typeTag(row.recordType) as any">{{ typeText(row.recordType) }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="orderId" label="缴费单" width="100" />
          <el-table-column label="金额" width="140">
            <template #default="{ row }">￥{{ Number(row.money || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="recordDesc" label="说明" min-width="260" show-overflow-tooltip />
          <el-table-column prop="recordTime" label="记录时间" width="180" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager"><el-pagination :current-page="params.pageNum" :page-size="params.pageSize" :page-sizes="[10,15,30,50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background @current-change="handlePage" @size-change="handleSize" /></div>
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="缴费单ID"><el-input-number v-model="form.orderId" :min="1" style="width:100%" /></el-form-item>
        <el-form-item label="收支类型" prop="recordType">
          <el-radio-group v-model="form.recordType"><el-radio :value="1">收入</el-radio><el-radio :value="2">支出</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="金额" prop="money"><el-input-number v-model="form.money" :min="0.01" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item label="说明" prop="recordDesc"><el-input v-model="form.recordDesc" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="editLoading" @click="submit">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f4f6fb; padding: 24px 12px; box-sizing: border-box; }
.container { max-width: 1200px; margin: 0 auto; }
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.topbar h2 { margin: 0; font-size: 20px; color: #1f2d3d; }
.card { border-radius: 8px; }
.search-form { margin-bottom: 8px; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
