<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPatientTreatmentsApi } from '../../api/patient-query'
import type { TreatmentVO } from '../../types'

const router = useRouter()
const list = ref<TreatmentVO[]>([])
const loading = ref(false)

onMounted(() => {
  loadList()
})

async function loadList() {
  loading.value = true
  try {
    const res = await getPatientTreatmentsApi()
    if (res.code === 200) {
      list.value = res.data || []
    }
  } finally {
    loading.value = false
  }
}

function getStatusTag(registerStatus: number) {
  if (registerStatus === 0) return { text: '待就诊', type: 'warning' as const }
  if (registerStatus === 1) return { text: '已就诊', type: 'success' as const }
  return { text: '已取消', type: 'info' as const }
}
</script>

<template>
  <div class="page-shell treatments-page">
    <div class="page-toolbar">
      <div class="toolbar-left">
        <el-button text @click="router.push('/patient/home')">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回首页</span>
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button text type="primary" @click="loadList">
          <el-icon><Refresh /></el-icon>
          <span>刷新</span>
        </el-button>
      </div>
    </div>

    <div class="page-card timeline-wrapper">
      <div v-loading="loading">
        <el-empty v-if="list.length === 0 && !loading" description="暂无就诊记录" />

        <div v-else>
          <el-timeline>
            <el-timeline-item
              v-for="item in list"
              :key="item.id"
              :timestamp="item.treatmentTime || item.createTime"
              placement="top"
              color="#2563EB"
              size="large"
            >
              <div class="treatment-card">
                <div class="treatment-header">
                  <div class="treatment-doctor">
                    <el-avatar :size="40" class="doctor-avatar">
                      {{ item.doctorName?.charAt(0) }}
                    </el-avatar>
                    <div>
                      <div class="doctor-name">
                        {{ item.doctorName }}
                        <span class="doctor-dept">{{ item.deptName }}</span>
                      </div>
                      <div class="treatment-meta">
                        {{ item.registerDate }} {{ item.timeSlot }}
                      </div>
                    </div>
                  </div>
                  <el-tag :type="getStatusTag(item.registerStatus).type" size="small">
                    {{ getStatusTag(item.registerStatus).text }}
                  </el-tag>
                </div>

                <el-divider />

                <div class="treatment-detail">
                  <div class="detail-row">
                    <span class="detail-label">挂号费</span>
                    <span class="detail-value">¥{{ item.registerFee?.toFixed(2) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">挂号编号</span>
                    <span class="detail-value">{{ item.registerId }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">病情描述</span>
                    <span class="detail-value">{{ item.diseaseDesc || '暂无' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">诊断结果</span>
                    <span class="detail-value">
                      <el-tag v-if="item.diagnosisResult" type="danger" effect="plain">
                        {{ item.diagnosisResult }}
                      </el-tag>
                      <span v-else style="color: #cbd5e1">暂无</span>
                    </span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">医嘱</span>
                    <span class="detail-value">{{ item.doctorAdvice || '暂无' }}</span>
                  </div>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.treatments-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-wrapper {
  padding: 28px;
}

.treatment-card {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.treatment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.treatment-doctor {
  display: flex;
  align-items: center;
  gap: 12px;
}

.doctor-avatar {
  background: linear-gradient(135deg, #2563EB, #3B82F6) !important;
  color: #fff;
  font-weight: 600;
}

.doctor-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--h-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.doctor-dept {
  font-size: 12px;
  color: var(--h-text-tertiary);
  font-weight: 400;
}

.treatment-meta {
  font-size: 12px;
  color: var(--h-text-tertiary);
  margin-top: 2px;
}

.treatment-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  gap: 12px;
  line-height: 1.6;
}

.detail-label {
  font-weight: 600;
  color: var(--h-text-secondary);
  font-size: 13px;
  min-width: 70px;
  flex-shrink: 0;
}

.detail-value {
  font-size: 13px;
  color: var(--h-text);
}

@media (max-width: 768px) {
  .timeline-wrapper {
    padding: 20px 16px;
  }
}
</style>