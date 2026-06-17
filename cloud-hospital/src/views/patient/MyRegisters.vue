<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyRegistersApi, cancelRegisterApi } from '../../api/registration'
import { confirmArrivalApi, getVisitTimelineApi } from '../../api/visit-flow'
import VisitTimeline from '../../components/VisitTimeline.vue'
import type { RegisterRecord, VisitTimelineVO } from '../../types'

const router = useRouter()
const list = ref<RegisterRecord[]>([])
const loading = ref(false)

const timelineDialog = ref(false)
const timelineLoading = ref(false)
const currentTimeline = ref<VisitTimelineVO | null>(null)

onMounted(() => {
  loadList()
})

async function loadList() {
  loading.value = true
  try {
    const res = await getMyRegistersApi()
    if (res.code === 200) {
      list.value = res.data || []
    }
  } finally {
    loading.value = false
  }
}

async function handleCancel(row: RegisterRecord) {
  try {
    await ElMessageBox.confirm(
      `确定取消【${row.deptName}】${row.doctorName}(${row.doctorTitle}) 的挂号吗？\n日期：${row.registerDate}  时段：${row.timeSlot}`,
      '取消挂号',
      { confirmButtonText: '确定取消', cancelButtonText: '再想想', type: 'warning' }
    )
  } catch {
    return
  }
  const res = await cancelRegisterApi(row.id)
  if (res.code === 200) {
    ElMessage.success('已取消挂号')
    loadList()
  }
}

async function handleArrival(row: RegisterRecord) {
  try {
    await ElMessageBox.confirm(
      `确认您已到达医院并准备就诊吗？\n科室：${row.deptName}\n医生：${row.doctorName}\n时段：${row.timeSlot}`,
      '到院确认',
      { confirmButtonText: '我已到院', cancelButtonText: '取消', type: 'info' }
    )
  } catch {
    return
  }

  const res = await confirmArrivalApi(row.id)
  if (res.code === 200) {
    ElMessage.success('到院确认成功，请等待医生接诊')
    await loadList()
  }
}

async function openTimeline(row: RegisterRecord) {
  timelineDialog.value = true
  timelineLoading.value = true
  currentTimeline.value = null
  try {
    const res = await getVisitTimelineApi(row.id)
    if (res.code === 200) {
      currentTimeline.value = res.data
    }
  } finally {
    timelineLoading.value = false
  }
}

function getStatusTag(status: number) {
  if (status === 0) return { text: '待就诊', type: 'warning' as const }
  if (status === 1) return { text: '已就诊', type: 'success' as const }
  return { text: '已取消', type: 'info' as const }
}

function getArrivalTag(status?: number) {
  if (status === 1) return { text: '已到院', type: 'success' as const }
  if (status === 2) return { text: '爽约', type: 'danger' as const }
  return { text: '未到院', type: 'info' as const }
}

function isToday(date: string) {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return date === `${yyyy}-${mm}-${dd}`
}

function canConfirmArrival(row: RegisterRecord) {
  return row.registerStatus === 0 && (row.arrivalStatus || 0) === 0 && isToday(row.registerDate)
}
</script>

<template>
  <div class="my-registers-page">
    <div class="topbar">
      <el-button @click="router.push('/patient/home')" :icon="'ArrowLeft'">返回首页</el-button>
      <span class="topbar-title">我的挂号记录</span>
      <el-button type="primary" @click="router.push('/patient/register')">去挂号</el-button>
    </div>

    <div class="content">
      <el-card v-loading="loading">
        <template #header>
          <span style="font-weight:600">挂号记录列表</span>
        </template>

        <el-alert
          title="到达医院后，请在当天预约记录中点击“我已到院”，医生端会优先看到已到院患者。"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 14px"
        />

        <el-empty v-if="list.length === 0 && !loading" description="暂无挂号记录" />

        <el-table v-else :data="list" stripe style="width:100%">
          <el-table-column prop="id" label="挂号编号" width="90" />
          <el-table-column prop="deptName" label="科室" width="100" />
          <el-table-column label="医生" width="150">
            <template #default="{ row }">
              {{ row.doctorName }}
              <el-tag size="small" type="info">{{ row.doctorTitle }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="registerDate" label="就诊日期" width="120" />
          <el-table-column prop="timeSlot" label="就诊时段" width="160" />
          <el-table-column prop="registerFee" label="挂号费" width="90">
            <template #default="{ row }">¥{{ Number(row.registerFee).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="就诊状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.registerStatus).type">
                {{ getStatusTag(row.registerStatus).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="到诊状态" width="110">
            <template #default="{ row }">
              <el-tag :type="getArrivalTag(row.arrivalStatus).type">
                {{ getArrivalTag(row.arrivalStatus).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="arrivalTime" label="到院时间" width="170" />
          <el-table-column prop="createTime" label="挂号时间" width="170" />
          <el-table-column label="操作" min-width="260" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="canConfirmArrival(row)"
                type="success"
                size="small"
                text
                @click="handleArrival(row)"
              >
                我已到院
              </el-button>
              <el-button
                type="primary"
                size="small"
                text
                @click="openTimeline(row)"
              >
                就医进度
              </el-button>
              <el-button
                v-if="row.registerStatus === 0"
                type="danger"
                size="small"
                text
                @click="handleCancel(row)"
              >
                取消挂号
              </el-button>
              <span v-if="row.registerStatus !== 0" style="color:#c0c4cc">--</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <el-dialog v-model="timelineDialog" title="就医进度" width="760px">
      <div v-loading="timelineLoading">
        <VisitTimeline :timeline="currentTimeline" />
      </div>
      <template #footer>
        <el-button @click="timelineDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.my-registers-page {
  min-height: 100vh;
  background: #f4f6fb;
  padding-bottom: 40px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 28px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-bottom: 20px;
}
.topbar-title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}
.content {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 20px;
}
</style>