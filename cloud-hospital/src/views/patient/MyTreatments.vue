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
  <div class="treatments-page">
    <div class="topbar">
      <el-button @click="router.push('/patient/home')" :icon="'ArrowLeft'">返回首页</el-button>
      <span class="topbar-title">历史就诊记录</span>
      <el-button type="primary" @click="loadList">刷新</el-button>
    </div>

    <div class="content">
      <el-card v-loading="loading">
        <el-empty v-if="list.length === 0 && !loading" description="暂无就诊记录" />

        <div v-else>
          <el-timeline>
            <el-timeline-item
              v-for="item in list"
              :key="item.id"
              :timestamp="item.treatmentTime || item.createTime"
              placement="top"
              color="#409eff"
            >
              <el-card shadow="hover">
                <template #header>
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span>
                      接诊医生：
                      <el-tag type="primary" size="small">{{ item.doctorName }}</el-tag>
                      <span style="margin-left:8px;color:#909399">{{ item.deptName }}</span>
                    </span>
                    <el-tag :type="getStatusTag(item.registerStatus).type" size="small">
                      {{ getStatusTag(item.registerStatus).text }}
                    </el-tag>
                  </div>
                </template>

                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="就诊日期">{{ item.registerDate }}</el-descriptions-item>
                  <el-descriptions-item label="就诊时段">{{ item.timeSlot }}</el-descriptions-item>
                  <el-descriptions-item label="挂号费">¥{{ item.registerFee?.toFixed(2) }}</el-descriptions-item>
                  <el-descriptions-item label="挂号编号">{{ item.registerId }}</el-descriptions-item>
                </el-descriptions>

                <el-divider />

                <div class="treatment-detail">
                  <div class="detail-item">
                    <span class="label">病情描述：</span>
                    <span>{{ item.diseaseDesc || '暂无' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">诊断结果：</span>
                    <el-tag type="danger" v-if="item.diagnosisResult">{{ item.diagnosisResult }}</el-tag>
                    <span v-else style="color:#c0c4cc">暂无</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">医嘱：</span>
                    <span>{{ item.doctorAdvice || '暂无' }}</span>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.treatments-page {
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
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}
.treatment-detail {
  padding: 8px 0;
}
.detail-item {
  margin-bottom: 8px;
  line-height: 1.8;
}
.detail-item .label {
  font-weight: 600;
  color: #606266;
  margin-right: 4px;
}
</style>