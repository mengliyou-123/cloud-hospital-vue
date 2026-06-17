<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { arrivalStatisticsApi } from '../../api/visit-flow'
import type { ArrivalStatisticsVO } from '../../types'

const router = useRouter()
const loading = ref(false)
const statDate = ref('')
const data = ref<ArrivalStatisticsVO | null>(null)

function today() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function load() {
  loading.value = true
  try {
    const res = await arrivalStatisticsApi(statDate.value)
    if (res.code === 200) {
      data.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  statDate.value = today()
  load()
})
</script>

<template>
  <div class="arrival-page">
    <div class="topbar">
      <el-button @click="router.push('/super-admin/home')" :icon="'ArrowLeft'">返回首页</el-button>
      <span class="topbar-title">到诊与爽约统计</span>
      <el-button type="primary" @click="load">刷新</el-button>
    </div>

    <div class="content">
      <el-card shadow="never" class="filter-card">
        <el-date-picker
          v-model="statDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择日期"
          style="width: 180px"
        />
        <el-button type="primary" @click="load">查询</el-button>
      </el-card>

      <el-card v-loading="loading" shadow="never" class="stat-card">
        <template #header>
          <strong>{{ data?.statDate || statDate }} 门诊到诊情况</strong>
        </template>

        <div v-if="data" class="stat-grid">
          <div class="stat-item">
            <div class="num primary">{{ data.appointmentCount }}</div>
            <div class="label">预约总数</div>
          </div>
          <div class="stat-item">
            <div class="num success">{{ data.arrivedCount }}</div>
            <div class="label">已到院</div>
          </div>
          <div class="stat-item">
            <div class="num warning">{{ data.notArrivedCount }}</div>
            <div class="label">未到院</div>
          </div>
          <div class="stat-item">
            <div class="num success">{{ data.treatedCount }}</div>
            <div class="label">已就诊</div>
          </div>
          <div class="stat-item">
            <div class="num info">{{ data.canceledCount }}</div>
            <div class="label">已取消</div>
          </div>
          <div class="stat-item">
            <div class="num danger">{{ data.noShowCount }}</div>
            <div class="label">爽约</div>
          </div>
        </div>

        <el-divider />

        <div v-if="data" class="rate-row">
          <el-alert
            :title="`到诊率：${data.arrivalRate}`"
            type="success"
            show-icon
            :closable="false"
          />
          <el-alert
            :title="`爽约率：${data.noShowRate}`"
            type="warning"
            show-icon
            :closable="false"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.arrival-page {
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
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-card {
  border-radius: 12px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
}

.stat-item {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 18px;
  text-align: center;
}

.num {
  font-size: 30px;
  font-weight: 800;
}

.primary { color: #409eff; }
.success { color: #67c23a; }
.warning { color: #e6a23c; }
.danger { color: #f56c6c; }
.info { color: #909399; }

.label {
  margin-top: 6px;
  color: #606266;
}

.rate-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>