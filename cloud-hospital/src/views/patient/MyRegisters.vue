<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyRegistersApi, cancelRegisterApi } from '../../api/registration'
import { getVisitTimelineApi } from '../../api/visit-flow'
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
</script>

<template>
  <div class="my-registers-page">
    <header class="page-header">
      <div class="page-header-inner">
        <el-button text @click="router.push('/patient/home')">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回首页</span>
        </el-button>
        <h1 class="page-title">我的挂号记录</h1>
        <el-button type="primary" @click="router.push('/patient/register')">
          去挂号
        </el-button>
      </div>
    </header>

    <div class="content">
      <el-alert
        title="请在预约时间段到医院就诊，医生会按预约顺序为您接诊。"
        type="info"
        show-icon
        :closable="false"
        class="alert-tip"
      />

      <div class="table-card" v-loading="loading">
        <el-empty v-if="list.length === 0 && !loading" description="暂无挂号记录" />

        <el-table v-else :data="list" stripe style="width:100%">
          <el-table-column prop="id" label="编号" width="80" />
          <el-table-column prop="deptName" label="科室" width="100" />
          <el-table-column label="医生" min-width="140">
            <template #default="{ row }">
              <div class="doctor-cell">
                <span>{{ row.doctorName }}</span>
                <el-tag size="small" type="info" effect="plain">{{ row.doctorTitle }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="registerDate" label="就诊日期" width="120" />
          <el-table-column prop="timeSlot" label="就诊时段" width="150" />
          <el-table-column prop="registerFee" label="挂号费" width="90">
            <template #default="{ row }">¥{{ Number(row.registerFee).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.registerStatus).type" size="small">
                {{ getStatusTag(row.registerStatus).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="挂号时间" width="170" />
          <el-table-column label="操作" min-width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" text @click="openTimeline(row)">
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
            </template>
          </el-table-column>
        </el-table>
      </div>
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
  background: var(--h-bg);
  display: flex;
  flex-direction: column;
}

.page-header {
  background: #fff;
  border-bottom: 1px solid var(--h-border);
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
}

.page-header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--h-text);
  margin: 0;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 60px;
}

.alert-tip {
  margin-bottom: 20px;
}

.table-card {
  background: #fff;
  border-radius: var(--h-radius-md);
  border: 1px solid var(--h-border);
  overflow: hidden;
  box-shadow: var(--h-shadow);
}

.table-card .el-table {
  border-radius: var(--h-radius-md);
}

.doctor-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .page-header-inner {
    padding: 0 16px;
  }

  .page-title {
    font-size: 16px;
  }

  .content {
    padding: 16px 16px 40px;
  }
}
</style>