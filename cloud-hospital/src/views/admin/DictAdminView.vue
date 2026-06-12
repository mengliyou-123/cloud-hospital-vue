<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  dictPageApi,
  dictTypesApi,
  dictAddApi,
  dictUpdateApi,
  dictDeleteApi
} from '../../api/common'
import type { SysDict } from '../../types'

const router = useRouter()

const list = ref<SysDict[]>([])
const total = ref(0)
const loading = ref(false)
const allTypes = ref<string[]>([])

const searchParams = reactive({
  dictType: '',
  dictLabel: '',
  pageNum: 1,
  pageSize: 15
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const editId = ref<number | null>(null)
const editLoading = ref(false)
const editFormRef = ref<FormInstance>()

const editForm = reactive({
  dictType: '',
  dictLabel: '',
  dictValue: '',
  sort: 0
})

const editRules: FormRules = {
  dictType: [{ required: true, message: '请输入字典类型', trigger: 'blur' }],
  dictLabel: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  dictValue: [{ required: true, message: '请输入字典值', trigger: 'blur' }]
}

async function loadTypes() {
  const res = await dictTypesApi()
  if (res.code === 200) allTypes.value = res.data || []
}
async function loadList() {
  loading.value = true
  try {
    const res = await dictPageApi({
      dictType: searchParams.dictType || undefined,
      dictLabel: searchParams.dictLabel || undefined,
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
  searchParams.dictType = ''
  searchParams.dictLabel = ''
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
  dialogTitle.value = '新增字典项'
  editForm.dictType = searchParams.dictType || ''
  editForm.dictLabel = ''
  editForm.dictValue = ''
  editForm.sort = 0
  dialogVisible.value = true
}
function openEdit(row: SysDict) {
  editId.value = row.id
  dialogTitle.value = '编辑字典项'
  editForm.dictType = row.dictType
  editForm.dictLabel = row.dictLabel
  editForm.dictValue = row.dictValue
  editForm.sort = row.sort || 0
  dialogVisible.value = true
}

async function submitEdit() {
  if (!editFormRef.value) return
  const valid = await editFormRef.value.validate().catch(() => false)
  if (!valid) return
  editLoading.value = true
  try {
    const payload: any = {
      dictType: editForm.dictType,
      dictLabel: editForm.dictLabel,
      dictValue: editForm.dictValue,
      sort: editForm.sort
    }
    let res
    if (editId.value) {
      payload.id = editId.value
      res = await dictUpdateApi(payload)
    } else {
      res = await dictAddApi(payload)
    }
    if (res.code === 200) {
      ElMessage.success(editId.value ? '修改成功' : '新增成功')
      dialogVisible.value = false
      loadTypes()
      loadList()
    }
  } finally {
    editLoading.value = false
  }
}

async function handleDelete(row: SysDict) {
  try {
    await ElMessageBox.confirm(`确定要删除字典项【${row.dictLabel}】吗？`, '提示', {
      type: 'warning'
    })
  } catch {
    return
  }
  const res = await dictDeleteApi(row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    loadList()
  }
}

onMounted(() => {
  loadTypes()
  loadList()
})
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <el-button link @click="router.push('/super-admin/home')">返回首页</el-button>
        <h2>数据字典</h2>
        <el-button type="primary" @click="openAdd">+ 新增字典</el-button>
      </div>

      <el-card shadow="never" class="card">
        <el-form :inline="true" class="search-form">
          <el-form-item label="字典类型">
            <el-select
              v-model="searchParams.dictType"
              placeholder="全部"
              clearable
              filterable
              style="width:220px"
            >
              <el-option
                v-for="t in allTypes"
                :key="t"
                :label="t"
                :value="t"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="字典名称">
            <el-input
              v-model="searchParams.dictLabel"
              placeholder="按名称搜索"
              clearable
              style="width:180px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="dictType" label="字典类型" width="160" />
          <el-table-column prop="dictLabel" label="字典名称" width="200" />
          <el-table-column prop="dictValue" label="字典值" width="180" />
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="160" fixed="right">
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
        <el-form-item label="字典类型" prop="dictType">
          <el-select
            v-model="editForm.dictType"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入新的字典类型，如 department"
            style="width:100%"
          >
            <el-option
              v-for="t in allTypes"
              :key="t"
              :label="t"
              :value="t"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="字典名称" prop="dictLabel">
          <el-input v-model="editForm.dictLabel" placeholder="例如：内科" />
        </el-form-item>
        <el-form-item label="字典值" prop="dictValue">
          <el-input v-model="editForm.dictValue" placeholder="例如：1" />
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="editForm.sort" :min="0" :max="9999" />
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
