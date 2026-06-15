<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  userPageApi,
  userAddApi,
  userUpdateApi,
  userDeleteApi,
  userUpdateStatusApi,
  userBindRoleApi,
  userResetPasswordApi,
  roleAllApi
} from '../../api/admin'
import type { SysUser, SysRole } from '../../types'

const router = useRouter()

const list = ref<SysUser[]>([])
const total = ref(0)
const loading = ref(false)
const roleList = ref<SysRole[]>([])

const searchParams = reactive({
  username: '',
  realName: '',
  roleId: undefined as number | undefined,
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
  roleId: undefined as number | undefined,
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
  ],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

async function loadRoles() {
  const res = await roleAllApi()
  if (res.code === 200) roleList.value = res.data || []
}

async function loadList() {
  loading.value = true
  try {
    const p: any = { ...searchParams }
    if (p.roleId === '' || p.roleId === null) p.roleId = undefined
    if (p.status === '' || p.status === null) p.status = undefined
    const res = await userPageApi(p)
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
  searchParams.username = ''
  searchParams.realName = ''
  searchParams.roleId = undefined
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
  dialogTitle.value = '新增用户'
  editForm.username = ''
  editForm.password = ''
  editForm.realName = ''
  editForm.phone = ''
  editForm.idCard = ''
  editForm.roleId = undefined
  editForm.status = 1
  dialogVisible.value = true
}

function openEdit(row: SysUser) {
  editId.value = row.id
  dialogTitle.value = '编辑用户'
  editForm.username = row.username
  editForm.password = ''
  editForm.realName = row.realName
  editForm.phone = row.phone
  editForm.idCard = row.idCard || ''
  editForm.roleId = row.roleId
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
      realName: editForm.realName,
      phone: editForm.phone,
      idCard: editForm.idCard,
      roleId: editForm.roleId,
      status: editForm.status
    }
    let res
    if (editId.value) {
      payload.id = editId.value
      res = await userUpdateApi(payload)
    } else {
      payload.username = editForm.username
      payload.password = editForm.password || '123456'
      res = await userAddApi(payload)
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

async function handleStatus(row: SysUser) {
  const next = row.status === 1 ? 0 : 1
  try {
    await ElMessageBox.confirm(`确定要${next === 1 ? '启用' : '禁用'}该用户吗？`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }
  const res = await userUpdateStatusApi(row.id, next)
  if (res.code === 200) {
    ElMessage.success('操作成功')
    loadList()
  }
}

async function handleDelete(row: SysUser) {
  try {
    await ElMessageBox.confirm(`确定要删除用户 ${row.username} 吗？`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }
  const res = await userDeleteApi(row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    loadList()
  }
}

async function handleResetPwd(row: SysUser) {
  try {
    const { value }: any = await ElMessageBox.prompt(
      '请输入新密码（留空则为默认 123456）',
      `重置 ${row.username} 的密码`,
      { confirmButtonText: '确定', cancelButtonText: '取消', inputPlaceholder: '至少6位' }
    )
    const pwd: string = (value || '').trim()
    if (pwd && pwd.length < 6) {
      ElMessage.warning('密码至少6位')
      return
    }
    const res = await userResetPasswordApi(row.id, pwd)
    if (res.code === 200) ElMessage.success('重置成功')
  } catch {
    /* user cancel */
  }
}

async function handleBindRole(row: SysUser) {
  try {
    const roleTips = roleList.value.map((r) => `${r.id}=${r.roleName}`).join('，')
    const { value }: any = await ElMessageBox.prompt(
      `请输入新的角色ID（${roleTips}）`,
      `绑定角色 - ${row.username}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: String(row.roleId),
        inputPattern: /^\d+$/,
        inputErrorMessage: '请选择角色',
        inputValidator: (v: any) => (v == null || v === '' ? '请选择角色' : true)
      }
    )
    const rid: number = Number(value)
    if (!rid) return
    const res = await userBindRoleApi(row.id, rid)
    if (res.code === 200) {
      ElMessage.success('绑定成功')
      loadList()
    }
  } catch {
    /* user cancel */
  }
}

onMounted(() => {
  loadRoles()
  loadList()
})
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <el-button link @click="router.push('/super-admin/home')">返回首页</el-button>
        <h2>用户管理</h2>
        <el-button type="primary" @click="openAdd">+ 新增用户</el-button>
      </div>

      <el-card shadow="never" class="card">
        <el-form :inline="true" class="search-form">
          <el-form-item label="账号">
            <el-input
              v-model="searchParams.username"
              placeholder="输入账号"
              clearable
              style="width:160px"
            />
          </el-form-item>
          <el-form-item label="姓名">
            <el-input
              v-model="searchParams.realName"
              placeholder="输入姓名"
              clearable
              style="width:160px"
            />
          </el-form-item>
          <el-form-item label="角色">
            <el-select
              v-model="searchParams.roleId"
              placeholder="全部"
              clearable
              style="width:160px"
            >
              <el-option
                v-for="r in roleList"
                :key="r.id"
                :label="r.roleName"
                :value="r.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchParams.status"
              placeholder="全部"
              clearable
              style="width:120px"
            >
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="username" label="账号" width="140" />
          <el-table-column prop="realName" label="姓名" width="120" />
          <el-table-column prop="phone" label="手机号" width="140" />
          <el-table-column label="角色" width="130">
            <template #default="{ row }">
              <el-tag size="small">{{ row.roleName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="420" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" link type="warning" @click="handleStatus(row)">
                {{ row.status === 1 ? '禁用' : '启用' }}
              </el-button>
              <el-button size="small" link @click="handleBindRole(row)">绑定角色</el-button>
              <el-button size="small" link @click="handleResetPwd(row)">重置密码</el-button>
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
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="86px"
      >
        <el-form-item label="账号" prop="username">
          <el-input
            v-model="editForm.username"
            :disabled="!!editId"
            placeholder="登录账号"
          />
        </el-form-item>
        <el-form-item
          :label="editId ? '新密码' : '密码'"
          :prop="editId ? undefined : 'password'"
        >
          <el-input
            v-model="editForm.password"
            type="password"
            show-password
            :placeholder="editId ? '不修改请留空' : '默认 123456'"
          />
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
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="editForm.roleId" placeholder="请选择角色" style="width:100%">
            <el-option
              v-for="r in roleList"
              :key="r.id"
              :label="r.roleName"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
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
</style>
