<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  schedulePageApi,
  scheduleAddApi,
  scheduleBatchAddApi,
  scheduleUpdateApi,
  scheduleDeleteApi,
  doctorAdminAllApi,
  deptAllApi
} from '../../api/admin'
import type { Department } from '../../types'
import type { DoctorSchedule } from '../../api/admin'

const router = useRouter()

const list = ref<DoctorSchedule[]>([])
const total = ref(0)
const loading = ref(false)
const deptList = ref<Department[]>([])
const doctorList = ref<any[]>([])

const searchParams = reactive({
  doctorId: undefined as number | undefined,
  deptId: undefined as number | undefined,
  startDate: '',
  endDate: '',
  pageNum: 1,
  pageSize: 15
})

const dialogVisible = ref(false)
const batchDialogVisible = ref(false)
const isEdit = ref(false)

const editForm = reactive({
  id: undefined as number | undefined,
  doctorId: undefined as number | undefined,
  deptId: undefined as number | undefined,
  scheduleDate: '',
  timeSlot: '上午',
  status: 1,
  remark: ''
})

const batchForm = reactive({
  doctorIds: [] as number[],
  scheduleDates: [] as string[],
  timeSlots: ['上午', '下午'] as string[],
  deptId: undefined as number | undefined,
  remark: ''
})

const timeSlots = ['上午', '下午', '全天', '夜班']

async function loadDepts() {
  const res = await deptAllApi()
  if (res.code === 200) deptList.value = res.data || []
}

async function loadDoctors() {
  const res = await doctorAdminAllApi()
  if (res.code === 200) doctorList.value = res.data || []
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      doctorId: searchParams.doctorId,
      deptId: searchParams.deptId,
      startDate: searchParams.startDate || undefined,
      endDate: searchParams.endDate || undefined,
      pageNum: searchParams.pageNum,
      pageSize: searchParams.pageSize
    }
    const res = await schedulePageApi(params)
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
  searchParams.doctorId = undefined
  searchParams.deptId = undefined
  searchParams.startDate = ''
  searchParams.endDate = ''
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
  isEdit.value = false
  editForm.id = undefined
  editForm.doctorId = undefined
  editForm.deptId = undefined
  editForm.scheduleDate = ''
  editForm.timeSlot = '上午'
  editForm.status = 1
  editForm.remark = ''
  dialogVisible.value = true
}

function openEdit(row: DoctorSchedule) {
  isEdit.value = true
  editForm.id = row.id
  editForm.doctorId = row.doctorId
  editForm.deptId = row.deptId
  editForm.scheduleDate = row.scheduleDate
  editForm.timeSlot = row.timeSlot
  editForm.status = row.status
  editForm.remark = row.remark || ''
  dialogVisible.value = true
}

async function submitEdit() {
  if (!editForm.doctorId || !editForm.scheduleDate || !editForm.timeSlot) {
    ElMessage.warning('请选择医生、日期和时段')
    return
  }
  try {
    let res
    if (isEdit.value) {
      res = await scheduleUpdateApi(editForm)
    } else {
      res = await scheduleAddApi(editForm)
    }
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
      dialogVisible.value = false
      loadList()
    }
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function handleDelete(row: DoctorSchedule) {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.scheduleDate} ${row.timeSlot} 的排班吗？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  const res = await scheduleDeleteApi(row.id)
  if (res.code === 200) {
    ElMessage.success('删除成功')
    loadList()
  }
}

function openBatch() {
  batchForm.doctorIds = []
  batchForm.scheduleDates = []
  batchForm.timeSlots = ['上午', '下午']
  batchForm.deptId = undefined
  batchForm.remark = ''
  batchDialogVisible.value = true
}

async function submitBatch() {
  if (batchForm.doctorIds.length === 0) {
    ElMessage.warning('请至少选择一位医生')
    return
  }
  if (batchForm.scheduleDates.length === 0) {
    ElMessage.warning('请至少选择一个日期')
    return
  }
  if (batchForm.timeSlots.length === 0) {
    ElMessage.warning('请至少选择一个时段')
    return
  }
  const res = await scheduleBatchAddApi(batchForm)
  if (res.code === 200) {
    ElMessage.success('批量排班成功')
    batchDialogVisible.value = false
    loadList()
  }
}

function statusText(v: number) {
  if (v === 1) return '正常'
  if (v === 2) return '调班'
  if (v === 0) return '已取消'
  return '未知'
}

function statusType(v: number) {
  if (v === 1) return 'success'
  if (v === 2) return 'warning'
  return 'info'
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
        <h2>排班管理</h2>
        <div>
          <el-button type="primary" @click="openAdd">+ 新增排班</el-button>
          <el-button type="success" plain @click="openBatch">批量排班</el-button>
        </div>
      </div>

      <el-card shadow="never" class="card">
        <el-form :inline="true" class="search-form">
          <el-form-item label="科室">
            <el-select v-model="searchParams.deptId" placeholder="全部科室" clearable style="width:150px">
              <el-option v-for="d in deptList" :key="d.id" :label="d.deptName" :value="d.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="医生">
            <el-select v-model="searchParams.doctorId" placeholder="全部医生" clearable filterable style="width:180px">
              <el-option
                v-for="doc in doctorList"
                :key="doc.id"
                :label="doc.realName + ' (' + (doc.deptName || '-') + ')'"
                :value="doc.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="searchParams.startDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="开始日期"
              style="width:140px"
            />
            <span style="margin:0 6px">-</span>
            <el-date-picker
              v-model="searchParams.endDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="结束日期"
              style="width:140px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="scheduleDate" label="日期" width="120" />
          <el-table-column prop="timeSlot" label="时段" width="80" />
          <el-table-column prop="doctorName" label="医生" width="110" />
          <el-table-column prop="deptName" label="所属科室" width="130" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
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

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑排班' : '新增排班'" width="520px">
      <el-form :model="editForm" label-width="96px">
        <el-form-item label="医生">
          <el-select v-model="editForm.doctorId" placeholder="请选择医生" style="width:100%" filterable>
            <el-option
              v-for="doc in doctorList"
              :key="doc.id"
              :label="doc.realName + ' (' + (doc.deptName || '-') + ')'"
              :value="doc.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="科室">
          <el-select v-model="editForm.deptId" placeholder="自动使用医生所在科室" clearable style="width:100%">
            <el-option v-for="d in deptList" :key="d.id" :label="d.deptName" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排班日期">
          <el-date-picker v-model="editForm.scheduleDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="时段">
          <el-select v-model="editForm.timeSlot" style="width:100%">
            <el-option v-for="s in timeSlots" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editForm.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="2">调班</el-radio>
            <el-radio :value="0">已取消</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量排班弹窗 -->
    <el-dialog v-model="batchDialogVisible" title="批量排班" width="560px">
      <el-form :model="batchForm" label-width="96px">
        <el-form-item label="选择医生">
          <el-select v-model="batchForm.doctorIds" multiple placeholder="可多选" filterable style="width:100%">
            <el-option
              v-for="doc in doctorList"
              :key="doc.id"
              :label="doc.realName + ' (' + (doc.deptName || '-') + ')'"
              :value="doc.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="科室">
          <el-select v-model="batchForm.deptId" placeholder="自动使用医生所在科室" clearable style="width:100%">
            <el-option v-for="d in deptList" :key="d.id" :label="d.deptName" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排班日期">
          <el-date-picker
            v-model="batchForm.scheduleDates"
            type="dates"
            value-format="YYYY-MM-DD"
            placeholder="可多选日期"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="时段">
          <el-checkbox-group v-model="batchForm.timeSlots">
            <el-checkbox v-for="s in timeSlots" :key="s" :label="s">{{ s }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="batchForm.remark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatch">开始排班</el-button>
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
.container { max-width: 1400px; margin: 0 auto; }
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.topbar h2 { margin: 0; font-size: 20px; color: #1f2d3d; }
.topbar > div:nth-child(3) { display: flex; align-items: center; }
.topbar h2,
.topbar > div:first-child + h2 { flex: 1; text-align: center; }
.topbar > *:first-child { min-width: 120px; }
.topbar > *:last-child { min-width: 280px; display: flex; justify-content: flex-end; gap: 8px; }
.card { border-radius: 8px; }
.search-form { margin-bottom: 8px; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
