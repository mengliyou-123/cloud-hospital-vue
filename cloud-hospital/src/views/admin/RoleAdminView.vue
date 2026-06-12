<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  rolePageApi,
  roleAddApi,
  roleUpdateApi,
  roleDeleteApi
} from '../../api/admin'
import type { SysRole } from '../../types'

const router = useRouter()

const list = ref<SysRole[]>([])
const total = ref(0)
const loading = ref(false)

const searchParams = reactive({
  roleName: '',
  roleCode: '',
  pageNum: 1,
  pageSize: 15
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const editId = ref<number | null>(null)
const editLoading = ref(false)
const editFormRef = ref<FormInstance>()

const editForm = reactive({
  roleName: '',
  roleCode: '',
  roleDesc: ''
})

const editRules: FormRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[a-z_][a-z0-9_]{0,49}$/i, message: '仅允许字母、数字、下划线', trigger: 'blur' }
  ]
}

async function loadList() {
  loading.value = true
  try {
    const res = await rolePageApi({
      roleName: searchParams.roleName || undefined,
      roleCode: searchParams.roleCode || undefined,
      pageNum: searchParams.pageNum,
      pageSize: searchParams.pageSize
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
  searchParams.pageNum = 1
  loadList()
}
function onReset() {
  searchParams.roleName = ''
  searchParams.roleCode = ''
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
  dialogTitle.value = '新增角色'
  editForm.roleName = ''
  editForm.roleCode = ''
  editForm.roleDesc = ''
  dialogVisible.value = true
}
function openEdit(row: SysRole) {
  editId.value = row.id
  dialogTitle.value = '编辑角色'
  editForm.roleName = row.roleName
  editForm.roleCode = row.roleCode
  editForm.roleDesc = row.roleDesc || ''
  dialogVisible.value = true
}

async function submitEdit() {
  if (!editFormRef.value) return
  const valid = await editFormRef.value.validate().catch(() => false)
  if (!valid) return
  editLoading.value = true
  try {
    const payload: any = {
      roleName: editForm.roleName,
      roleCode: editForm.roleCode,
      roleDesc: editForm.roleDesc
    }
    let res
    if (editId.value) {
      payload.id = editId.value
      res = await roleUpdateApi(payload)
    } else {
      res = await roleAddApi(payload)
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

async function handleDelete(row: SysRole) {
  try {
    await ElMessageBox.confirm(`确定要删除角色【${row.roleName}】吗？若该角色存在用户，无法删除。`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }
  const res = await roleDeleteApi(row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    loadList()
  }
}

onMounted(loadList)
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <el-button link @click="router.push('/super-admin/home')">返回首页</el-button>
        <h2>角色管理</h2>
        <el-button type="primary" @click="openAdd">+ 新增角色</el-button>
      </div>

      <el-card shadow="never" class="card">
        <el-form :inline="true" class="search-form">
          <el-form-item label="角色名称">
            <el-input v-model="searchParams.roleName" placeholder="角色名称" clearable style="width:160px" />
          </el-form-item>
          <el-form-item label="角色编码">
            <el-input v-model="searchParams.roleCode" placeholder="角色编码" clearable style="width:160px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="roleName" label="角色名称" width="160" />
          <el-table-column prop="roleCode" label="角色编码" width="180" />
          <el-table-column prop="roleDesc" label="角色描述" min-width="280" show-overflow-tooltip />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
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

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="96px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="editForm.roleName" placeholder="例如：门诊医生" />
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input
            v-model="editForm.roleCode"
            :disabled="!!editId"
            placeholder="例如：doctor"
          />
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input
            v-model="editForm.roleDesc"
            type="textarea"
            :rows="3"
            placeholder="选填"
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
  max-width: 1200px;
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
