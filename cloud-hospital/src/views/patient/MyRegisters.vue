<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyRegistersApi, cancelRegisterApi } from '../../api/registration'
import { getVisitTimelineApi } from '../../api/visit-flow'
import VisitTimeline from '../../components/VisitTimeline.vue'
import type { RegisterRecord, VisitTimelineVO } from '../../types'

const router = useRouter()

const list = ref<RegisterRecord[]>([])
const loading = ref(false)

const timelineDrawer = ref(false)
const timelineLoading = ref(false)
const currentTimeline = ref<VisitTimelineVO | null>(null)
const activeRecord = ref<RegisterRecord | null>(null)

const query = reactive({
  keyword: '',
  status: undefined as number | undefined
})

const filteredList = computed(() => {
  return list.value.filter((row) => {
    const matchStatus = query.status === undefined || row.registerStatus === query.status
    const kw = query.keyword.trim()
    const text = `${row.deptName}${row.doctorName}${row.doctorTitle}${row.registerDate}${row.timeSlot}`
    const matchKeyword = !kw || text.includes(kw)
    return matchStatus && matchKeyword
  })
})

onMounted(loadList)

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
      `确定取消【${row.deptName}】${row.doctorName}（${row.doctorTitle}）的挂号吗？\n日期：${row.registerDate}  时段：${row.timeSlot}`,
      '取消挂号',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '再想想',
        type: 'warning'
      }
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
  activeRecord.value = row
  timelineDrawer.value = true
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

function resetQuery() {
  query.keyword = ''
  query.status = undefined
}

function getStatusTag(status: number) {
  if (status === 0) return { text: '待就诊', type: 'warning' as const }
  if (status === 1) return { text: '已就诊', type: 'success' as const }
  return { text: '已取消', type: 'info' as const }
}
</script>

<template>
  <div class="page-shell my-registers-page">
    <el-alert
      title="请在预约时间段到医院就诊；如无法到诊，请尽早取消预约，避免浪费号源。"
      type="info"
      show-icon
      :closable="false"
      class="alert-tip"
    />

    <div class="page-card">
      <div class="page-toolbar registers-toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="query.keyword"
            clearable
            placeholder="搜索科室、医生、日期或时段"
            class="keyword-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-select
            v-model="query.status"
            clearable
            placeholder="挂号状态"
            class="status-select"
          >
            <el-option label="待就诊" :value="0" />
            <el-option label="已就诊" :value="1" />
            <el-option label="已取消" :value="2" />
          </el-select>

          <el-button @click="resetQuery">重置</el-button>
        </div>

        <div class="toolbar-right">
          <el-button type="primary" @click="router.push('/patient/register')">
            <el-icon><Calendar /></el-icon>
            去挂号
          </el-button>
        </div>
      </div>

      <div class="page-table-wrap" v-loading="loading">
        <el-empty v-if="filteredList.length === 0 && !loading" description="暂无挂号记录" />

        <el-table v-else :data="filteredList" stripe style="width: 100%">
          <el-table-column prop="id" label="编号" width="80" />

          <el-table-column prop="deptName" label="科室" width="110" />

          <el-table-column label="医生" min-width="150">
            <template #default="{ row }">
              <div class="doctor-cell">
                <span>{{ row.doctorName }}</span>
                <el-tag size="small" type="info" effect="plain">
                  {{ row.doctorTitle }}
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="registerDate" label="就诊日期" width="120" />

          <el-table-column prop="timeSlot" label="就诊时段" width="150" />

          <el-table-column prop="registerFee" label="挂号费" width="100">
            <template #default="{ row }">
              ¥{{ Number(row.registerFee).toFixed(2) }}
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.registerStatus).type" size="small">
                {{ getStatusTag(row.registerStatus).text }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="挂号时间" width="170" />

          <el-table-column label="操作" min-width="190" fixed="right">
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

    <el-drawer
      v-model="timelineDrawer"
      title="就医进度"
      direction="rtl"
      size="560px"
      class="timeline-drawer"
    >
      <div v-if="activeRecord" class="timeline-summary">
        <div class="summary-icon">
          <el-icon><Guide /></el-icon>
        </div>

        <div>
          <div class="summary-title">
            {{ activeRecord.deptName }} · {{ activeRecord.doctorName }}
          </div>
          <div class="summary-sub">
            {{ activeRecord.registerDate }} {{ activeRecord.timeSlot }} · 挂号编号 {{ activeRecord.id }}
          </div>
        </div>
      </div>

      <div v-loading="timelineLoading">
        <VisitTimeline :timeline="currentTimeline" />
      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="timelineDrawer = false">关闭</el-button>
          <el-button type="primary" @click="router.push('/patient/prescriptions')">
            查看处方缴费
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.my-registers-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alert-tip {
  border-radius: var(--h-radius-md);
}

.registers-toolbar {
  align-items: center;
}

.keyword-input {
  width: 300px;
}

.status-select {
  width: 140px;
}

.page-table-wrap {
  min-height: 260px;
  overflow-x: auto;
}

.doctor-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  margin-bottom: 16px;
  border: 1px solid var(--h-border);
  border-radius: var(--h-radius-md);
  background: linear-gradient(135deg, #f8fafc, #fff);
}

.summary-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: var(--h-primary-bg);
  color: var(--h-primary);
  font-size: 20px;
}

.summary-title {
  font-weight: 900;
  color: var(--h-text);
}

.summary-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--h-text-tertiary);
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .registers-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right,
  .keyword-input,
  .status-select {
    width: 100%;
  }

  :global(.timeline-drawer) {
    width: 100% !important;
  }
}
</style>