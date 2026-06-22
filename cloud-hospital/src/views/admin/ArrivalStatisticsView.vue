<script setup lang="ts">
import { onMounted, ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { arrivalStatisticsApi } from '../../api/visit-flow'
import type { ArrivalStatisticsVO } from '../../types'

const router = useRouter()
const loading = ref(false)
const statDate = ref('')
const data = ref<ArrivalStatisticsVO | null>(null)

// 动画数字状态
const animatedData = reactive({
  appointmentCount: 0,
  treatedCount: 0,
  canceledCount: 0,
  noShowCount: 0
})
const showAnimation = ref(false)

function today() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 数字滚动动画
function animateNumbers(target: Record<string, number>, source: Record<string, number>) {
  const keys = Object.keys(source) as (keyof typeof source)[]
  const duration = 1000
  const startTime = performance.now()
  const startValues: Record<string, number> = {}
  keys.forEach(k => startValues[k] = target[k] || 0)

  function step(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    // easeOutExpo 缓动
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
    keys.forEach(k => {
      target[k] = Math.round(startValues[k] + (source[k] - startValues[k]) * eased)
    })
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// 环形图数据
const donutSegments = computed(() => {
  if (!data.value) return []
  const d = data.value
  const segments = [
    { value: d.treatedCount || 0, label: '已就诊', color: '#409eff' },
    { value: d.canceledCount || 0, label: '已取消', color: '#909399' },
    { value: d.noShowCount || 0, label: '爽约', color: '#f56c6c' }
  ].filter(s => s.value > 0)

  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return []

  let currentAngle = -90
  const cx = 100, cy = 100, r = 80, innerR = 55

  return segments.map(seg => {
    const angle = (seg.value / total) * 360
    const startRad = (currentAngle * Math.PI) / 180
    const endRad = ((currentAngle + angle) * Math.PI) / 180

    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const x3 = cx + innerR * Math.cos(endRad)
    const y3 = cy + innerR * Math.sin(endRad)
    const x4 = cx + innerR * Math.cos(startRad)
    const y4 = cy + innerR * Math.sin(startRad)

    const largeArc = angle > 180 ? 1 : 0
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`

    currentAngle += angle
    return {
      ...seg,
      path,
      percent: ((seg.value / total) * 100).toFixed(1)
    }
  })
})

// 就诊率进度环
const treatedRateNum = computed(() => {
  if (!data.value || !data.value.appointmentCount) return 0
  return ((data.value.treatedCount || 0) / data.value.appointmentCount) * 100
})

const treatedRateCircle = computed(() => {
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (treatedRateNum.value / 100) * circumference
  return { circumference, offset }
})

// 爽约率
const noShowRateNum = computed(() => {
  if (!data.value) return 0
  const match = String(data.value.noShowRate).match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
})

// 柱状图数据
const barData = computed(() => {
  if (!data.value) return []
  const d = data.value
  const items = [
    { label: '预约总数', value: d.appointmentCount || 0, color: '#409eff' },
    { label: '已就诊', value: d.treatedCount || 0, color: '#36d399' },
    { label: '已取消', value: d.canceledCount || 0, color: '#909399' },
    { label: '爽约', value: d.noShowCount || 0, color: '#f56c6c' }
  ]
  const maxVal = Math.max(...items.map(i => i.value), 1)
  return items.map(item => ({ ...item, percent: (item.value / maxVal) * 100 }))
})

async function load() {
  loading.value = true
  showAnimation.value = false
  try {
    const res = await arrivalStatisticsApi(statDate.value)
    if (res.code === 200) {
      data.value = res.data
      if (res.data) {
        animateNumbers(animatedData, {
          appointmentCount: res.data.appointmentCount || 0,
          treatedCount: res.data.treatedCount || 0,
          canceledCount: res.data.canceledCount || 0,
          noShowCount: res.data.noShowCount || 0
        })
      }
      setTimeout(() => { showAnimation.value = true }, 100)
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
      <!-- 筛选区 -->
      <div class="filter-bar">
        <el-date-picker
          v-model="statDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择日期"
          style="width: 180px"
        />
        <el-button type="primary" @click="load">查询</el-button>
      </div>

      <!-- 核心指标卡片 -->
      <div class="metrics-grid">
        <div v-for="(metric, idx) in [
          { label: '预约总数', value: animatedData.appointmentCount, gradient: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', shadow: 'rgba(102,126,234,0.4)' },
          { label: '已就诊', value: animatedData.treatedCount, gradient: 'linear-gradient(135deg,#36d399 0%,#10b981 100%)', shadow: 'rgba(16,185,129,0.4)' },
          { label: '已取消', value: animatedData.canceledCount, gradient: 'linear-gradient(135deg,#a8a8a8 0%,#909399 100%)', shadow: 'rgba(144,147,153,0.4)' },
          { label: '爽约', value: animatedData.noShowCount, gradient: 'linear-gradient(135deg,#ff6b6b 0%,#ee5a24 100%)', shadow: 'rgba(238,90,36,0.4)' }
        ]" :key="idx"
          class="metric-card"
          :style="{
            background: metric.gradient,
            boxShadow: `0 8px 24px ${metric.shadow}`,
            animationDelay: `${idx * 0.08}s`
          }">
          <div class="metric-body">
            <div class="metric-label">{{ metric.label }}</div>
            <div class="metric-value">{{ metric.value }}</div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <el-row :gutter="20" class="chart-row">
        <!-- 环形图 + 图例 -->
        <el-col :span="12">
          <el-card shadow="never" class="chart-card">
            <template #header><span class="chart-title">就诊情况分布</span></template>
            <div class="donut-wrapper">
              <svg viewBox="0 0 200 200" class="donut-svg" :class="{ 'show': showAnimation }">
                <g v-for="(seg, i) in donutSegments" :key="i">
                  <title>{{ seg.label }}: {{ seg.value }} ({{ seg.percent }}%)</title>
                  <path :d="seg.path" :fill="seg.color" class="donut-seg"
                    :style="{ transitionDelay: `${i * 0.12}s` }" />
                </g>
                <!-- 空状态 -->
                <circle v-if="donutSegments.length === 0" cx="100" cy="100" r="65" fill="none" stroke="#ebeef5" stroke-width="30" />
                <circle cx="100" cy="100" r="50" fill="#fff" />
                <text v-if="data" x="100" y="94" text-anchor="middle" class="donut-center-num">{{ data.appointmentCount || 0 }}</text>
                <text x="100" y="112" text-anchor="middle" class="donut-center-label">总预约</text>
              </svg>
              <div class="donut-legend">
                <div v-for="(seg, i) in donutSegments" :key="i" class="legend-row">
                  <span class="legend-marker" :style="{ background: seg.color }"></span>
                  <span class="legend-name">{{ seg.label }}</span>
                  <span class="legend-val">{{ seg.value }}</span>
                  <span class="legend-pct">{{ seg.percent }}%</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 进度环区域 -->
        <el-col :span="12">
          <el-card shadow="never" class="chart-card">
            <template #header><span class="chart-title">核心指标</span></template>
            <div class="rate-circles">
              <div class="rate-item">
                <div class="rate-ring-wrap">
                  <svg viewBox="0 0 100 100" class="rate-ring-svg">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e8f5e9" stroke-width="8" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#409eff" stroke-width="8"
                      stroke-linecap="round"
                      :stroke-dasharray="treatedRateCircle.circumference"
                      :stroke-dashoffset="showAnimation ? treatedRateCircle.offset : treatedRateCircle.circumference"
                      class="ring-progress"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div class="rate-text-overlay">
                    <div class="rate-big-num">{{ treatedRateNum.toFixed(1) }}%</div>
                    <div class="rate-label-sm">就诊率</div>
                  </div>
                </div>
                <div class="rate-desc">已就诊占预约总数比例</div>
              </div>

              <div class="rate-item">
                <div class="rate-ring-wrap">
                  <svg viewBox="0 0 100 100" class="rate-ring-svg">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#fff3e0" stroke-width="8" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e6a23c" stroke-width="8"
                      stroke-linecap="round"
                      :stroke-dasharray="treatedRateCircle.circumference"
                      :stroke-dashoffset="showAnimation ? (treatedRateCircle.circumference - (noShowRateNum / 100) * treatedRateCircle.circumference) : treatedRateCircle.circumference"
                      class="ring-progress ring-warn"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div class="rate-text-overlay">
                    <div class="rate-big-num warn">{{ noShowRateNum.toFixed(1) }}%</div>
                    <div class="rate-label-sm">爽约率</div>
                  </div>
                </div>
                <div class="rate-desc warn-desc">爽约人数占比</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 柱状图 -->
      <el-card shadow="never" class="bar-card">
        <template #header><span class="chart-title">各项数据对比</span></template>
        <div class="bar-list">
          <div v-for="(item, i) in barData" :key="i" class="bar-entry">
            <div class="bar-info">
              <span class="bar-name">{{ item.label }}</span>
              <span class="bar-count" :style="{ color: item.color }"><strong>{{ item.value }}</strong></span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" :style="{
                width: showAnimation ? `${item.percent}%` : '0%',
                background: `linear-gradient(90deg, ${item.color}, ${item.color}99)`,
                transitionDelay: `${i * 0.08 + 0.15}s`
              }"></div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.arrival-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #f0f4ff 0%, #e8ecf1 50%, #f5f0f8 100%);
  padding-bottom: 40px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  background: var(--h-card);
  border-bottom: 1px solid var(--h-border);
  margin-bottom: 24px;
  border-radius: 0 0 16px 16px;
}

.topbar-title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

/* 指标卡片网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  border-radius: 16px;
  padding: 20px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 14px;
  animation: metricIn 0.5s ease-out both;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}
.metric-card::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -20%;
  width: 120px;
  height: 120px;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
}
.metric-card:hover {
  transform: translateY(-5px) scale(1.02);
}

@keyframes metricIn {
  from { opacity: 0; transform: translateY(24px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.metric-body { z-index: 1; }
.metric-label {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 4px;
}
.metric-value {
  font-size: 32px;
  font-weight: 800;
  line-height: 1.1;
}

/* 图表行 */
.chart-row { margin-bottom: 20px; }
.chart-card {
  border-radius: 14px;
  height: 100%;
  overflow: hidden;
}
.chart-card :deep(.el-card__header) {
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafbfc;
}
.chart-title {
  font-weight: 700;
  font-size: 15px;
  color: #303133;
}

/* 环形图 */
.donut-wrapper {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 0;
}
.donut-svg {
  width: 180px;
  height: 180px;
  flex-shrink: 0;
}
.donut-seg {
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: pointer;
  transform-origin: center;
}
.donut-seg:hover { opacity: 0.82; filter: brightness(1.1); }
.show .donut-seg { opacity: 1; }
.donut-center-num {
  font-size: 26px;
  font-weight: 800;
  fill: #303133;
}
.donut-center-label {
  font-size: 11px;
  fill: #909399;
}

.donut-legend { flex: 1; }
.legend-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background 0.2s;
}
.legend-row:hover { background: #f5f7fa; }
.legend-marker {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  flex-shrink: 0;
}
.legend-name {
  flex: 1;
  font-size: 13px;
  color: #606266;
}
.legend-val {
  font-weight: 700;
  font-size: 14px;
  color: #303133;
  min-width: 36px;
  text-align: right;
}
.legend-pct {
  font-size: 12px;
  color: #909399;
  min-width: 44px;
  text-align: right;
}

/* 进度环 */
.rate-circles {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 16px 0;
}
.rate-item { text-align: center; }
.rate-ring-wrap {
  position: relative;
  width: 130px;
  height: 130px;
  margin: 0 auto 12px;
}
.rate-ring-svg {
  width: 100%;
  height: 100%;
}
.ring-progress {
  transition: stroke-dashoffset 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.ring-warn { filter: drop-shadow(0 0 4px rgba(230,162,60,0.4)); }

.rate-text-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.rate-big-num {
  font-size: 24px;
  font-weight: 800;
  color: #67c23a;
  line-height: 1.2;
}
.rate-big-num.warn { color: #e6a23c; }
.rate-label-sm {
  font-size: 12px;
  color: #909399;
}
.rate-desc {
  font-size: 12px;
  color: #909399;
}
.warn-desc { color: #e6a23c; }

/* 柱状图卡片 */
.bar-card { border-radius: 14px; }
.bar-list { padding: 8px 0; }
.bar-entry { margin-bottom: 18px; }
.bar-entry:last-child { margin-bottom: 0; }
.bar-info {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
.bar-name {
  font-size: 13px;
  color: #606266;
  flex: 1;
}
.bar-count {
  font-size: 15px;
  min-width: 40px;
  text-align: right;
}
.bar-track {
  height: 22px;
  background: #f0f2f5;
  border-radius: 11px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 11px;
  transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
}
.bar-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
  animation: barShimmer 2.5s infinite;
}
@keyframes barShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

</style>
