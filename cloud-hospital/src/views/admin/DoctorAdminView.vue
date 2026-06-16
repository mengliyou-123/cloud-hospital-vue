<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  doctorAdminPageApi,
  doctorAdminDetailApi,
  doctorAdminAddApi,
  doctorAdminUpdateApi,
  doctorAdminUpdateStatusApi,
  doctorAdminDeleteApi,
  deptAllApi
} from '../../api/admin'
import type { Department } from '../../types'

const router = useRouter()

const list = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const deptList = ref<Department[]>([])

const searchParams = reactive({
  realName: '',
  deptId: undefined as number | undefined,
  workStatus: undefined as number | undefined,
  pageNum: 1,
  pageSize: 15
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const editId = ref<number | null>(null)
const editLoading = ref(false)
const editFormRef = ref<FormInstance>()

const editForm = reactive({
  username: '',
  password: '',
  realName: '',
  phone: '',
  idCard: '',
  deptId: undefined as number | undefined,
  title: '',
  skill: '',
  workStatus: 1,
  status: 1
})

const editRules: FormRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, message: '账号至少3位', trigger: 'blur' }
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

async function loadDepts() {
  const res = await deptAllApi()
  if (res.code === 200) deptList.value = res.data || []
}

async function loadList() {
  loading.value = true
  try {
    const res = await doctorAdminPageApi(searchParams)
    if (res.code === 200) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    loading.value = false
  }
}

function onSearch() {
  searchParams.pageNum = 1
  loadList()
}

function onReset() {
  searchParams.realName = ''
  searchParams.deptId = undefined
  searchParams.workStatus = undefined
  onSearch()
}

function handlePage(p: number) {
  searchParams.pageNum = p
  loadList()
}
function handleSize(s: number) {
  searchParams.pageSize = s
  searchParams.pageNum = 1
  loadList()
}

function openAdd() {
  editId.value = null
  dialogTitle.value = '新增医生'
  editForm.username = ''
  editForm.password = ''
  editForm.realName = ''
  editForm.phone = ''
  editForm.idCard = ''
  editForm.deptId = undefined
  editForm.title = ''
  editForm.skill = ''
  editForm.workStatus = 1
  editForm.status = 1
  dialogVisible.value = true
}

async function openEdit(row: any) {
  editId.value = row.id
  dialogTitle.value = '编辑医生'
  const res = await doctorAdminDetailApi(row.id)
  if (res.code === 200 && res.data) {
    const d = res.data
    editForm.username = d.username || ''
    editForm.password = ''
    editForm.realName = d.realName || ''
    editForm.phone = d.phone || ''
    editForm.idCard = d.idCard || ''
    editForm.deptId = d.deptId
    editForm.title = d.title || ''
    editForm.skill = d.skill || ''
    editForm.workStatus = d.workStatus != null ? d.workStatus : 1
    editForm.status = d.status != null ? d.status : 1
  }
  dialogVisible.value = true
}

async function submitEdit() {
  if (!editFormRef.value) return
  const valid = await editFormRef.value.validate().catch(() => false)
  if (!valid) return
  editLoading.value = true
  try {
    const payload: any = {
      realName: editForm.realName,
      phone: editForm.phone,
      idCard: editForm.idCard,
      deptId: editForm.deptId,
      title: editForm.title,
      skill: editForm.skill,
      workStatus: editForm.workStatus,
      status: editForm.status
    }
    let res
    if (editId.value) {
      payload.id = editId.value
      res = await doctorAdminUpdateApi(payload)
    } else {
      payload.username = editForm.username
      payload.password = editForm.password || '123456'
      res = await doctorAdminAddApi(payload)
    }
    if (res.code === 200) {
      ElMessage.success(editId.value ? '修改成功' : '新增成功')
      dialogVisible.value = false
      loadList()
    }
  } finally {
    editLoading.value = false
  }
}

async function handleStatus(row: any) {
  const options = [
    { label: '在职', value: 1 },
    { label: '请假', value: 2 },
    { label: '离岗', value: 0 }
  ]
  const labelMap: Record<number, string> = { 1: '在职', 2: '请假', 0: '离岗' }
  const next = row.workStatus === 1 ? 0 : 1
  try {
    await ElMessageBox.confirm(
      `确定把该医生状态修改为"${labelMap[next]}"吗？`,
      '提示',
      { type: 'warning' }
    )
  } catch {
    return
  }
  const res = await doctorAdminUpdateStatusApi(row.id, next)
  if (res.code === 200) {
    ElMessage.success('操作成功')
    loadList()
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定删除医生 ${row.realName} 吗？该医生的账号将一并删除！`,
      '提示',
      { type: 'warning' }
    )
  } catch {
    return
  }
  const res = await doctorAdminDeleteApi(row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    loadList()
  }
}

function workStatusLabel(v: number): string {
  if (v === 1) return '在职'
  if (v === 2) return '请假'
  if (v === 0) return '离岗'
  return '未知'
}

onMounted(() => {
  loadDepts()
  loadList()
})
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <el-button link @click="router.push('/super-admin/home')">返回首页</el-button>
        <h2>医护人员管理</h2>
        <el-button type="primary" @click="openAdd">+ 新增医生</el-button>
      </div>

      <el-card shadow="never" class="card">
        <el-form :inline="true" class="search-form">
          <el-form-item label="姓名">
            <el-input v-model="searchParams.realName" placeholder="输入姓名" clearable style="width:140px" />
          </el-form-item>
          <el-form-item label="科室">
            <el-select v-model="searchParams.deptId" placeholder="全部科室" clearable style="width:150px">
              <el-option v-for="d in deptList" :key="d.id" :label="d.deptName" :value="d.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="工作状态">
            <el-select v-model="searchParams.workStatus" placeholder="全部" clearable style="width:130px">
              <el-option label="在职" :value="1" />
              <el-option label="请假" :value="2" />
              <el-option label="离岗" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="username" label="账号" width="120" />
          <el-table-column prop="realName" label="姓名" width="100" />
          <el-table-column prop="phone" label="手机号" width="130" />
          <el-table-column prop="deptName" label="所属科室" width="130" />
          <el-table-column prop="title" label="职称" width="120" />
          <el-table-column prop="skill" label="专业技能" min-width="180" show-overflow-tooltip />
          <el-table-column label="工作状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.workStatus === 1 ? 'success' : row.workStatus === 2 ? 'warning' : 'info'" size="small">
                {{ workStatusLabel(row.workStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="账号状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="建档时间" width="170" />
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" link type="warning" @click="handleStatus(row)">切换状态</el-button>
              <el-button size="small" link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager">
          <el-pagination
            :current-page="searchParams.pageNum"
            :page-size="searchParams.pageSize"
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="96px">
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="editForm.username" :disabled="!!editId" :placeholder="editId ? '' : '例如 doctor_zhang'" />
        </el-form-item>
        <el-form-item v-if="!editId" label="初始密码" prop="password">
          <el-input v-model="editForm.password" placeholder="默认 123456" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="editForm.realName" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="editForm.idCard" placeholder="选填" />
        </el-form-item>
        <el-form-item label="所属科室">
          <el-select v-model="editForm.deptId" placeholder="请选择科室" style="width:100%" clearable>
            <el-option v-for="d in deptList" :key="d.id" :label="d.deptName" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="职称">
          <el-input v-model="editForm.title" placeholder="主任医师 / 主治医师 / 住院医师" />
        </el-form-item>
        <el-form-item label="专业技能">
          <el-input v-model="editForm.skill" type="textarea" :rows="2" placeholder="擅长的领域" />
        </el-form-item>
        <el-form-item label="工作状态">
          <el-radio-group v-model="editForm.workStatus">
            <el-radio :value="1">在职</el-radio>
            <el-radio :value="2">请假</el-radio>
            <el-radio :value="0">离岗</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="账号状态">
          <el-radio-group v-model="editForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">确定</el-button>
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
.container {
  max-width: 1400px;
  margin: 0 auto;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.topbar h2 {
  margin: 0;
  font-size: 20px;
  color: #1f2d3d;
}
.card {
  border-radius: 8px;
}
.search-form {
  margin-bottom: 8px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
