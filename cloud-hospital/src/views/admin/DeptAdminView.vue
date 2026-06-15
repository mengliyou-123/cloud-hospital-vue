<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  deptPageApi,
  deptAddApi,
  deptUpdateApi,
  deptDeleteApi,
  deptUpdateStatusApi,
  deptDoctorsApi,
  doctorAllApi,
  assignDoctorDeptApi,
  deptAllApi
} from '../../api/admin'
import type { Department, Doctor } from '../../types'

const router = useRouter()

const list = ref<Department[]>([])
const total = ref(0)
const loading = ref(false)
const doctorList = ref<Doctor[]>([])
const deptList = ref<Department[]>([])

const searchParams = reactive({
  deptName: '',
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
  deptName: '',
  deptDesc: '',
  status: 1
})

const editRules: FormRules = {
  deptName: [{ required: true, message: '请输入科室名称', trigger: 'blur' }]
}

// 医生分配对话框
const assignDialogVisible = ref(false)
const assignDeptId = ref<number | null>(null)
const assignDeptName = ref('')
const doctorsInDept = ref<Doctor[]>([])
const allDoctors = ref<Doctor[]>([])
const assignLoading = ref(false)
// 每个医生选择的科室
const doctorSelectedDept = ref<Record<number, number>>({})

async function loadDepts() {
  const res = await deptAllApi()
  if (res.code === 200) deptList.value = res.data || []
}

async function loadDoctors() {
  const res = await doctorAllApi()
  if (res.code === 200) doctorList.value = res.data || []
}

async function loadList() {
  loading.value = true
  try {
    const p: any = { ...searchParams }
    if (p.status === '' || p.status === null) p.status = undefined
    const res = await deptPageApi(p)
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
  searchParams.deptName = ''
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

function openAdd() {
  editId.value = null
  dialogTitle.value = '新增科室'
  editForm.deptName = ''
  editForm.deptDesc = ''
  editForm.status = 1
  dialogVisible.value = true
}

function openEdit(row: Department) {
  editId.value = row.id
  dialogTitle.value = '编辑科室'
  editForm.deptName = row.deptName
  editForm.deptDesc = row.deptDesc || ''
  editForm.status = row.status
  dialogVisible.value = true
}

async function submitEdit() {
  if (!editFormRef.value) return
  const valid = await editFormRef.value.validate().catch(() => false)
  if (!valid) return
  editLoading.value = true
  try {
    const payload: any = {
      deptName: editForm.deptName,
      deptDesc: editForm.deptDesc
    }
    let res
    if (editId.value) {
      payload.id = editId.value
      res = await deptUpdateApi(payload)
    } else {
      res = await deptAddApi(payload)
    }
    if (res.code === 200) {
      ElMessage.success(editId.value ? '修改成功' : '新增成功')
      dialogVisible.value = false
      loadList()
      loadDepts()
    }
  } finally {
    editLoading.value = false
  }
}

async function handleStatus(row: Department) {
  const next = row.status === 1 ? 0 : 1
  try {
    await ElMessageBox.confirm(`确定要${next === 1 ? '启用' : '停用'}该科室吗？`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }
  const res = await deptUpdateStatusApi(row.id, next)
  if (res.code === 200) {
    ElMessage.success('操作成功')
    loadList()
  }
}

async function handleDelete(row: Department) {
  try {
    await ElMessageBox.confirm(`确定要删除科室 ${row.deptName} 吗？`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }
  const res = await deptDeleteApi(row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    loadList()
    loadDepts()
  }
}

async function openAssignDoctors(row: Department) {
  assignDeptId.value = row.id
  assignDeptName.value = row.deptName
  assignLoading.value = true
  assignDialogVisible.value = true
  doctorSelectedDept.value = {}
  try {
    const resDoctors = await doctorAllApi()
    if (resDoctors.code === 200) allDoctors.value = resDoctors.data || []
    const resDeptDoctors = await deptDoctorsApi(row.id)
    if (resDeptDoctors.code === 200) doctorsInDept.value = resDeptDoctors.data || []
  } finally {
    assignLoading.value = false
  }
}

async function handleAssignDoctor(doctor: Doctor, deptId: number) {
  try {
    await ElMessageBox.confirm(
      `确定要将医生 ${doctor.realName} 分配到 ${deptList.value.find(d => d.id === deptId)?.deptName || '该科室'} 吗？`,
      '分配确认',
      { type: 'info' }
    )
  } catch {
    return
  }
  const res = await assignDoctorDeptApi(doctor.id, deptId)
  if (res.code === 200) {
    ElMessage.success('分配成功')
    // 清除该医生的选择
    doctorSelectedDept.value[doctor.id] = 0
    loadDoctors()
    if (assignDeptId.value) {
      const resDeptDoctors = await deptDoctorsApi(assignDeptId.value)
      if (resDeptDoctors.code === 200) doctorsInDept.value = resDeptDoctors.data || []
    }
  }
}

async function handleRemoveFromDept(doctor: Doctor) {
  try {
    await ElMessageBox.confirm(
      `确定要将医生 ${doctor.realName} 从科室 ${assignDeptName.value} 移除吗？`,
      '移除确认',
      { type: 'warning' }
    )
  } catch {
    return
  }
  // 移除医生（分配到科室ID为0表示未分配）
  const res = await assignDoctorDeptApi(doctor.id, 0)
  if (res.code === 200) {
    ElMessage.success('移除成功')
    const resDeptDoctors = await deptDoctorsApi(assignDeptId.value!)
    if (resDeptDoctors.code === 200) doctorsInDept.value = resDeptDoctors.data || []
    loadDoctors()
  }
}

function getSelectedDept(doctorId: number): number | undefined {
  return doctorSelectedDept.value[doctorId]
}

function setSelectedDept(doctorId: number, deptId: number) {
  doctorSelectedDept.value[doctorId] = deptId
}

onMounted(() => {
  loadDepts()
  loadDoctors()
  loadList()
})
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <el-button link @click="router.push('/super-admin/home')">返回首页</el-button>
        <h2>科室管理</h2>
        <el-button type="primary" @click="openAdd">+ 新增科室</el-button>
      </div>

      <el-card shadow="never" class="card">
        <el-form :inline="true" class="search-form">
          <el-form-item label="科室名称">
            <el-input
              v-model="searchParams.deptName"
              placeholder="输入科室名称"
              clearable
              style="width:180px"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchParams.status"
              placeholder="全部"
              clearable
              style="width:120px"
            >
              <el-option label="启用" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="deptName" label="科室名称" width="180" />
          <el-table-column prop="deptDesc" label="科室描述" min-width="200" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" link type="warning" @click="handleStatus(row)">
                {{ row.status === 1 ? '停用' : '启用' }}
              </el-button>
              <el-button size="small" link type="success" @click="openAssignDoctors(row)">
                分配医生
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

    <!-- 科室编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="86px"
      >
        <el-form-item label="科室名称" prop="deptName">
          <el-input v-model="editForm.deptName" placeholder="请输入科室名称" />
        </el-form-item>
        <el-form-item label="科室描述">
          <el-input
            v-model="editForm.deptDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入科室描述（选填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 医生分配对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      :title="`分配医生 - ${assignDeptName}`"
      width="90%"
      :close-on-click-modal="false"
      top="6vh"
    >
      <div v-loading="assignLoading" class="assign-container">
        <el-row :gutter="24">
          <el-col :span="12">
            <div class="section-title">当前科室医生</div>
            <el-table :data="doctorsInDept" stripe border max-height="420">
              <el-table-column prop="realName" label="姓名" min-width="110" />
              <el-table-column prop="title" label="职称" min-width="130" />
              <el-table-column prop="deptName" label="当前科室" min-width="140">
                <template #default="{ row }">
                  <el-tag :type="row.deptId ? 'success' : 'info'">
                    {{ row.deptName || '未分配' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template #default="{ row }">
                  <el-button link type="danger" @click="handleRemoveFromDept(row)">
                    移除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="doctorsInDept.length === 0" class="empty-tip">
              当前科室暂无医生
            </div>
          </el-col>
          <el-col :span="12">
            <div class="section-title">所有医生</div>
            <el-table :data="allDoctors" stripe border max-height="420">
              <el-table-column prop="realName" label="姓名" min-width="100" />
              <el-table-column prop="title" label="职称" min-width="120" />
              <el-table-column prop="deptName" label="当前科室" min-width="120">
                <template #default="{ row }">
                  <el-tag :type="row.deptId ? 'success' : 'info'">
                    {{ row.deptName || '未分配' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="分配到科室" min-width="280">
                <template #default="{ row }">
                  <div class="assign-cell">
                    <el-select
                      :model-value="getSelectedDept(row.id)"
                      @update:model-value="setSelectedDept(row.id, $event)"
                      placeholder="请选择科室"
                      size="default"
                      style="width: 160px"
                    >
                      <el-option
                        v-for="d in deptList"
                        :key="d.id"
                        :label="d.deptName"
                        :value="d.id"
                      />
                    </el-select>
                    <el-button
                      type="primary"
                      size="small"
                      :disabled="!getSelectedDept(row.id)"
                      @click="handleAssignDoctor(row, getSelectedDept(row.id)!)"
                    >
                      分配
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
        </el-row>
      </div>
      <template #footer>
        <el-button @click="assignDialogVisible = false">关闭</el-button>
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
  max-width: 1300px;
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
.assign-container {
  padding: 4px 0;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 12px;
  padding-left: 4px;
  border-left: 3px solid #409eff;
}
.empty-tip {
  color: #999;
  padding: 30px;
  text-align: center;
  background: #fafafa;
  border-radius: 4px;
}
.assign-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>