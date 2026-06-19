<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { attendanceAdminListApi, attendanceStatsApi, doctorAdminAllApi } from '../../api/admin'

const router = useRouter()

const list = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const doctorList = ref<any[]>([])
const stats = ref<any>({ total: 0, normal: 0, late: 0, leave: 0, absent: 0 })

const searchParams = reactive({
  doctorId: undefined as number | undefined,
  startDate: '',
  endDate: '',
  pageNum: 1,
  pageSize: 15
})

// 动画数字
const animatedStats = reactive({ total: 0, normal: 0, late: 0, leave: 0, absent: 0 })
const showChart = ref(false)

// 计算饼图数据
const pieData = computed(() => {
  const s = stats.value
  const items = [
    { value: s.normal || 0, label: '正常', color: '#67c23a' },
    { value: s.late || 0, label: '迟到', color: '#e6a23c' },
    { value: s.leave || 0, label: '请假', color: '#909399' },
    { value: s.absent || 0, label: '未出勤', color: '#f56c6c' }
  ]
  const sum = items.reduce((a, b) => a + b.value, 0)
  return items.map(item => ({
    ...item,
    percent: sum > 0 ? ((item.value / sum) * 100).toFixed(1) : 0
  }))
})

// 计算柱状图最大值用于比例
const barMax = computed(() => {
  const s = stats.value
  return Math.max(s.normal || 0, s.late || 0, s.leave || 0, s.absent || 0, 1)
})

// 数字动画
function animateNumber(target: Record<string, number>, source: Record<string, number>) {
  const keys = Object.keys(source) as (keyof typeof source)[]
  const duration = 800
  const startTime = performance.now()
  const startValues: Record<string, number> = {}
  keys.forEach(k => startValues[k] = target[k] || 0)

  function step(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    // easeOutExpo
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
    keys.forEach(k => {
      target[k] = Math.round(startValues[k] + (source[k] - startValues[k]) * eased)
    })
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

async function loadDoctors() {
  const res = await doctorAdminAllApi()
  if (res.code === 200) doctorList.value = res.data || []
}

async function loadList() {
  loading.value = true
  try {
    const params: any = { pageNum: searchParams.pageNum, pageSize: searchParams.pageSize }
    if (searchParams.doctorId) params.doctorId = searchParams.doctorId
    if (searchParams.startDate) params.startDate = searchParams.startDate
    if (searchParams.endDate) params.endDate = searchParams.endDate
    const res = await attendanceAdminListApi(params)
    if (res.code === 200) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
    const statsRes = await attendanceStatsApi({ startDate: searchParams.startDate, endDate: searchParams.endDate })
    if (statsRes.code === 200) {
      stats.value = statsRes.data || { total: 0, normal: 0, late: 0, leave: 0, absent: 0 }
      animateNumber(animatedStats, stats.value)
      // 延迟显示图表以触发动画
      setTimeout(() => { showChart.value = true }, 100)
    }
  } finally {
    loading.value = false
  }
}

function onSearch() { searchParams.pageNum = 1; loadList() }

function statusText(v: number) {
  if (v === 1) return '正常'
  if (v === 2) return '迟到'
  if (v === 3) return '请假'
  if (v === 0) return '未出勤'
  return '未知'
}
function statusType(v: number) {
  if (v === 1) return 'success'
  if (v === 2) return 'warning'
  if (v === 3) return 'info'
  return 'danger'
}

// 生成环形图SVG路径
function getPiePaths() {
  const data = pieData.value
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return []

  let currentAngle = -90 // 从12点钟方向开始
  const cx = 80, cy = 80, r = 60, innerR = 38

  return data.filter(d => d.value > 0).map(item => {
    const angle = (item.value / total) * 360
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
    return { path, color: item.color, label: item.label, value: item.value, percent: item.percent }
  })
}

onMounted(() => { loadDoctors(); loadList() })
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <el-button link @click="router.push('/super-admin/home')">返回首页</el-button>
        <h2>考勤记录 & 统计</h2>
        <div></div>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="16" class="stat-row">
        <el-col :span="6" v-for="(card, idx) in [
          { title: '出勤总数', value: animatedStats.total, icon: '📋', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
          { title: '正常', value: animatedStats.normal, icon: '✅', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
          { title: '迟到', value: animatedStats.late, icon: '⏰', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
          { title: '请假/未出勤', value: animatedStats.leave + animatedStats.absent, icon: '📝', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }
        ]" :key="idx">
          <div class="stat-card-enhanced" :style="{ background: card.gradient, animationDelay: `${idx * 0.1}s` }">
            <div class="card-icon">{{ card.icon }}</div>
            <div class="card-info">
              <div class="card-title">{{ card.title }}</div>
              <div class="card-value">{{ card.value }}</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="16" class="chart-row">
        <el-col :span="10">
          <el-card shadow="never" class="chart-card">
            <template #header><span class="chart-title">📊 考勤状态分布</span></template>
            <div class="pie-chart-wrapper">
              <svg viewBox="0 0 160 160" class="pie-svg" :class="{ 'animate-in': showChart }">
                <g v-for="(seg, i) in getPiePaths()" :key="i">
                  <title>{{ seg.label }}: {{ seg.value }} ({{ seg.percent }}%)</title>
                  <path :d="seg.path" :fill="seg.color" class="pie-segment"
                    :style="{ transitionDelay: `${i * 0.15}s` }" />
                </g>
                <circle cx="80" cy="80" r="35" fill="#fff" />
                <text x="80" y="76" text-anchor="middle" class="pie-center-value">{{ stats.total }}</text>
                <text x="80" y="92" text-anchor="middle" class="pie-center-label">总计</text>
              </svg>
              <div class="pie-legend">
                <div v-for="(item, i) in pieData" :key="i" class="legend-item">
                  <span class="legend-dot" :style="{ background: item.color }"></span>
                  <span class="legend-label">{{ item.label }}</span>
                  <span class="legend-value">{{ item.value }}</span>
                  <span class="legend-percent">{{ item.percent }}%</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="14">
          <el-card shadow="never" class="chart-card">
            <template #header><span class="chart-title">📈 各状态数量对比</span></template>
            <div class="bar-chart">
              <div v-for="(item, i) in pieData" :key="i" class="bar-item">
                <div class="bar-label-row">
                  <span class="bar-dot" :style="{ background: item.color }"></span>
                  <span class="bar-label">{{ item.label }}</span>
                  <span class="bar-num">{{ item.value }}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" :style="{
                    width: showChart ? `${(item.value / barMax) * 100}%` : '0%',
                    background: `linear-gradient(90deg, ${item.color}, ${item.color}88)`,
                    transitionDelay: `${i * 0.15 + 0.2}s`
                  }"></div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 表格区域 -->
      <el-card shadow="never" class="table-card">
        <template #header>
          <div class="table-header">
            <span>📋 考勤明细</span>
            <el-form :inline="true" style="display:flex;align-items:center;">
              <el-form-item label="医生" style="margin-bottom:0">
                <el-select v-model="searchParams.doctorId" placeholder="全部医生" clearable filterable style="width:180px">
                  <el-option v-for="doc in doctorList" :key="doc.id" :label="doc.realName" :value="doc.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="日期范围" style="margin-bottom:0">
                <el-date-picker v-model="searchParams.startDate" type="date" value-format="YYYY-MM-DD" placeholder="开始" style="width:140px" />
                <span style="margin:0 6px;color:#c0c4cc">-</span>
                <el-date-picker v-model="searchParams.endDate" type="date" value-format="YYYY-MM-DD" placeholder="结束" style="width:140px" />
              </el-form-item>
              <el-form-item style="margin-bottom:0">
                <el-button type="primary" @click="onSearch">查询</el-button>
              </el-form-item>
            </el-form>
          </div>
        </template>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="doctorName" label="医生" width="110" />
          <el-table-column prop="attendanceDate" label="日期" width="140" />
          <el-table-column prop="checkInTime" label="上班时间" width="140" />
          <el-table-column prop="checkOutTime" label="下班时间" width="140" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small" effect="dark">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" />
        </el-table>

        <div v-if="total > 0" class="pagination-wrap">
          <el-pagination
            v-model:current-page="searchParams.pageNum"
            v-model:page-size="searchParams.pageSize"
            :total="total"
            layout="total, prev, pager, next"
            @change="loadList"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 24px 12px;
  box-sizing: border-box;
}
.container { max-width: 1300px; margin: 0 auto; }
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.topbar h2 { margin: 0; font-size: 22px; color: #1f2d3d; }

/* 增强统计卡片 */
.stat-row { margin-bottom: 20px; }
.stat-card-enhanced {
  border-radius: 16px;
  padding: 20px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  animation: cardSlideIn 0.5s ease-out both;
  transition: transform 0.3s, box-shadow 0.3s;
}
.stat-card-enhanced:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.18);
}
@keyframes cardSlideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.card-icon { font-size: 36px; line-height: 1; }
.card-info { flex: 1; }
.card-title { font-size: 14px; opacity: 0.9; margin-bottom: 4px; }
.card-value { font-size: 32px; font-weight: 800; line-height: 1.2; }

/* 图表区域 */
.chart-row { margin-bottom: 20px; }
.chart-card { border-radius: 12px; height: 100%; }
.chart-card :deep(.el-card__header) { padding: 14px 20px; border-bottom: 1px solid #f0f0f0; }
.chart-title { font-weight: 700; font-size: 15px; color: #303133; }

/* 环形图 */
.pie-chart-wrapper {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 10px 0;
}
.pie-svg {
  width: 160px;
  height: 160px;
  flex-shrink: 0;
}
.pie-segment {
  opacity: 0;
  transition: all 0.5s ease-out;
  cursor: pointer;
}
.pie-segment:hover { opacity: 0.8; transform-origin: center; }
.animate-in .pie-segment { opacity: 1; }
.pie-center-value { font-size: 24px; font-weight: 800; fill: #303133; }
.pie-center-label { font-size: 11px; fill: #909399; }

.pie-legend { flex: 1; }
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-radius: 6px;
  transition: background 0.2s;
}
.legend-item:hover { background: #f5f7fa; }
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.legend-label { flex: 1; font-size: 13px; color: #606266; }
.legend-value { font-weight: 700; font-size: 14px; color: #303133; min-width: 30px; text-align: right; }
.legend-percent { font-size: 12px; color: #909399; min-width: 40px; text-align: right; }

/* 柱状图 */
.bar-chart { padding: 8px 0; }
.bar-item { margin-bottom: 16px; }
.bar-item:last-child { margin-bottom: 0; }
.bar-label-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
.bar-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.bar-label { font-size: 13px; color: #606266; margin-left: 8px; flex: 1; }
.bar-num { font-weight: 700; font-size: 15px; color: #303133; min-width: 30px; text-align: right; }
.bar-track {
  height: 20px;
  background: #f0f2f5;
  border-radius: 10px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
}
.bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* 表格 */
.table-card { border-radius: 12px; }
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: 16px;
}
</style>
