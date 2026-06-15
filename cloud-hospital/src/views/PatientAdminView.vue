<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import {
  patientPageApi,
  patientAddApi,
  patientUpdateApi,
  patientDeleteApi,
  patientUpdateStatusApi
} from '../api/patient'
import type { Patient } from '../types'

const router = useRouter()
const route = useRoute()

// 角色：医生或管理员都能进入
const isDoctor = (route.path || '').startsWith('/doctor')

const list = ref<Patient[]>([])
const total = ref(0)
const loading = ref(false)

const searchParams = reactive({
  realName: '',
  phone: '',
  idCard: '',
  status: undefined as number | undefined,
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
  age: null as number | null,
  gender: 0,
  address: '',
  pastMedical: ''
})

const editRules: FormRules = {
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

async function loadList() {
  loading.value = true
  try {
    const p: any = { ...searchParams }
    if (p.status === '' || p.status === null) p.status = undefined
    const res = await patientPageApi(p)
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
  searchParams.phone = ''
  searchParams.idCard = ''
  searchParams.status = undefined
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

function resetEditForm() {
  editForm.username = ''
  editForm.password = ''
  editForm.realName = ''
  editForm.phone = ''
  editForm.idCard = ''
  editForm.age = null
  editForm.gender = 0
  editForm.address = ''
  editForm.pastMedical = ''
}

function openAdd() {
  editId.value = null
  dialogTitle.value = '新增患者'
  resetEditForm()
  dialogVisible.value = true
}

function openEdit(row: Patient) {
  editId.value = row.id
  dialogTitle.value = '编辑患者'
  editForm.username = row.username || ''
  editForm.password = ''
  editForm.realName = row.realName
  editForm.phone = row.phone
  editForm.idCard = row.idCard || ''
  editForm.age = row.age ?? null
  editForm.gender = row.gender ?? 0
  editForm.address = row.address || ''
  editForm.pastMedical = row.pastMedical || ''
  dialogVisible.value = true
}

async function submitEdit() {
  if (!editFormRef.value) return
  const valid = await editFormRef.value.validate().catch(() => false)
  if (!valid) return
  editLoading.value = true
  try {
    const payload: any = {
      id: editId.value ?? undefined,
      realName: editForm.realName,
      phone: editForm.phone,
      idCard: editForm.idCard,
      age: editForm.age,
      gender: editForm.gender,
      address: editForm.address,
      pastMedical: editForm.pastMedical
    }
    let res
    if (editId.value) {
      res = await patientUpdateApi(payload)
    } else {
      payload.username = editForm.username || ('p_' + editForm.phone)
      payload.password = editForm.password || '123456'
      res = await patientAddApi(payload)
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

async function handleStatus(row: Patient) {
  const next = row.status === 1 ? 0 : 1
  try {
    await ElMessageBox.confirm(`确定要${next === 1 ? '启用' : '禁用'}该患者吗？`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }
  const res = await patientUpdateStatusApi(row.id, next)
  if (res.code === 200) {
    ElMessage.success('操作成功')
    loadList()
  }
}

async function handleDelete(row: Patient) {
  try {
    await ElMessageBox.confirm(`确定要删除患者 ${row.realName} 吗？删除后无法恢复！`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }
  const res = await patientDeleteApi(row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    loadList()
  }
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <el-button link @click="router.push(isDoctor ? '/doctor/home' : '/super-admin/home')">返回首页</el-button>
        <h2>患者档案管理</h2>
        <el-button type="primary" @click="openAdd">+ 新增患者</el-button>
      </div>

      <el-card shadow="never" class="card">
        <el-form :inline="true" class="search-form">
          <el-form-item label="姓名">
            <el-input v-model="searchParams.realName" placeholder="输入姓名" clearable style="width:160px" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="searchParams.phone" placeholder="输入手机号" clearable style="width:160px" />
          </el-form-item>
          <el-form-item label="身份证号">
            <el-input v-model="searchParams.idCard" placeholder="输入身份证号" clearable style="width:200px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchParams.status" placeholder="全部" clearable style="width:120px">
              <el-option label="正常" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="id" label="档案ID" width="80" />
          <el-table-column prop="realName" label="姓名" width="110" />
          <el-table-column prop="phone" label="手机号" width="130" />
          <el-table-column prop="idCard" label="身份证号" width="180" />
          <el-table-column prop="age" label="年龄" width="70" />
          <el-table-column label="性别" width="70">
            <template #default="{ row }">{{ row.gender === 1 ? '男' : '女' }}</template>
          </el-table-column>
          <el-table-column prop="address" label="住址" min-width="180" show-overflow-tooltip />
          <el-table-column prop="pastMedical" label="既往病史" min-width="200" show-overflow-tooltip />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="建档时间" width="170" />
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" link type="warning" @click="handleStatus(row)">
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" :close-on-click-modal="false">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="96px">
        <el-form-item v-if="!editId" label="登录账号" prop="username">
          <el-input v-model="editForm.username" placeholder="留空将使用 p_手机号" />
        </el-form-item>
        <el-form-item v-if="!editId" label="初始密码" prop="password">
          <el-input v-model="editForm.password" placeholder="默认 123456" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="editForm.realName" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="editForm.idCard" />
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="editForm.age" :min="0" :max="150" controls-position="right" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="住址">
          <el-input v-model="editForm.address" />
        </el-form-item>
        <el-form-item label="既往病史">
          <el-input v-model="editForm.pastMedical" type="textarea" :rows="3" />
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
