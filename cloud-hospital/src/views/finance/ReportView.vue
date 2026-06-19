<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { exportFinanceReportApi, statisticsDashboardApi } from '../../api/statistics'
import { getUser } from '../../utils/request'
import type { StatisticsDashboard } from '../../types'

const router = useRouter()
const loading = ref(false)
const showAnimation = ref(false)

const data = ref<StatisticsDashboard>({
  financeSummary: {},
  monthlyFinance: [],
  payStatus: [],
  reimburseStatus: [],
  visitDept: [],
  stockWarnings: []
})

// 动画数字
const animatedSummary = reactive({
  income: 0,
  outcome: 0,
  balance: 0,
  recordCount: 0
})

const params = reactive({
  startTime: '',
  endTime: '',
  months: 6
})

const summary = computed(() => data.value.financeSummary || {})
const monthlyMax = computed(() => {
  const values = data.value.monthlyFinance.flatMap((x) => [Number(x.income || 0), Number(x.outcome || 0)])
  return Math.max(1, ...values)
})
const deptMax = computed(() => Math.max(1, ...data.value.visitDept.map((x) => Number(x.visitCount || 0))))

function money(v: any) {
  return `￥${Number(v || 0).toFixed(2)}`
}
function payStatusName(status: any) {
  const n = Number(status)
  return n === 1 ? '已缴费' : n === 2 ? '已作废' : '待缴费'
}
function reimburseStatusName(status: any) {
  const n = Number(status)
  return n === 1 ? '已通过' : n === 2 ? '已驳回' : '待审核'
}

// 数字滚动动画
function animateValue(target: Record<string, number>, source: Record<string, number>) {
  const keys = Object.keys(source) as (keyof typeof source)[]
  const duration = 800
  const startTime = performance.now()
  const startValues: Record<string, number> = {}
  keys.forEach(k => startValues[k] = target[k] || 0)

  function step(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
    keys.forEach(k => {
      target[k] = startValues[k] + (source[k] - startValues[k]) * eased
    })
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

async function load() {
  loading.value = true
  showAnimation.value = false
  try {
    const res = await statisticsDashboardApi({
      startTime: params.startTime || undefined,
      endTime: params.endTime || undefined,
      months: params.months
    })
    if (res.code === 200) {
      data.value = res.data
      const s = res.data?.financeSummary || {}
      animateValue(animatedSummary, {
        income: Number(s.income || 0),
        outcome: Number(s.outcome || 0),
        balance: Number(s.balance || 0),
        recordCount: Number(s.recordCount || 0)
      })
      setTimeout(() => { showAnimation.value = true }, 100)
    }
  } finally {
    loading.value = false
  }
}

async function exportCsv() {
  const blob = await exportFinanceReportApi({
    startTime: params.startTime || undefined,
    endTime: params.endTime || undefined
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '财务收支报表.csv'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('报表已导出，可用 Excel 打开')
}

function goBack() {
  const u = getUser()
  router.push(u?.roleCode === 'super_admin' ? '/super-admin/home' : '/finance-admin/home')
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="topbar">
        <el-button link @click="goBack">返回首页</el-button>
        <h2>统计分析与报表</h2>
        <el-button type="primary" @click="exportCsv">导出财务报表</el-button>
      </div>

      <!-- 筛选区 -->
      <el-card shadow="never" class="filter-card">
        <el-form :inline="true" style="flex-wrap:wrap">
          <el-form-item label="开始日期"><el-date-picker v-model="params.startTime" type="date" value-format="YYYY-MM-DD" placeholder="开始" style="width:150px" /></el-form-item>
          <el-form-item label="结束日期"><el-date-picker v-model="params.endTime" type="date" value-format="YYYY-MM-DD" placeholder="结束" style="width:150px" /></el-form-item>
          <el-form-item label="月度范围"><el-input-number v-model="params.months" :min="1" :max="24" controls-position="right" style="width:110px" /></el-form-item>
          <el-form-item><el-button type="primary" @click="load">刷新统计</el-button></el-form-item>
        </el-form>
      </el-card>

      <!-- 核心指标卡片 -->
      <div v-loading="loading" class="summary-grid">
        <div v-for="(card, idx) in [
          { label: '收入合计', value: animatedSummary.income, isMoney: true, gradient: 'linear-gradient(135deg,#11998e 0%,#38ef7d 100%)', shadow: 'rgba(56,239,125,0.35)' },
          { label: '支出合计', value: animatedSummary.outcome, isMoney: true, gradient: 'linear-gradient(135deg,#eb3349 0%,#f45c43 100%)', shadow: 'rgba(235,51,73,0.35)' },
          { label: '结余', value: animatedSummary.balance, isMoney: true, gradient: 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)', shadow: 'rgba(79,172,254,0.35)' },
          { label: '流水数', value: Math.round(animatedSummary.recordCount), isMoney: false, gradient: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', shadow: 'rgba(102,126,234,0.35)' }
        ]" :key="idx"
          class="metric-card"
          :style="{ background: card.gradient, boxShadow: `0 8px 24px ${card.shadow}`, animationDelay: `${idx * 0.08}s` }">
          <div class="metric-label">{{ card.label }}</div>
          <div class="metric-value">{{ card.isMoney ? money(card.value) : card.value }}</div>
        </div>
      </div>

      <div v-loading="loading">
        <!-- 月度趋势 + 科室排行 -->
        <section class="panel-grid">
          <el-card shadow="never" class="chart-card">
            <template #header><span class="panel-title">月度收支趋势</span></template>
            <div v-if="!data.monthlyFinance.length" class="empty">暂无数据</div>
            <div v-for="(item, i) in data.monthlyFinance" :key="item.month" class="bar-row">
              <span class="bar-month">{{ item.month }}</span>
              <div class="bar-group">
                <div class="bar-info">
                  <span class="bar-tag income-tag">收入</span>
                  <span class="bar-amt income-color">{{ money(item.income) }}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill income-bar" :style="{
                    width: showAnimation ? `${(Number(item.income || 0) / monthlyMax) * 100}%` : '0%',
                    transitionDelay: `${i * 0.06}s`
                  }"></div>
                </div>
              </div>
              <div class="bar-group">
                <div class="bar-info">
                  <span class="bar-tag outcome-tag">支出</span>
                  <span class="bar-amt outcome-color">{{ money(item.outcome) }}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill outcome-bar" :style="{
                    width: showAnimation ? `${(Number(item.outcome || 0) / monthlyMax) * 100}%` : '0%',
                    transitionDelay: `${i * 0.06 + 0.15}s`
                  }"></div>
                </div>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="chart-card">
            <template #header><span class="panel-title">就诊科室排行</span></template>
            <div v-if="!data.visitDept.length" class="empty">暂无挂号数据</div>
            <div v-for="(item, i) in data.visitDept" :key="item.deptName" class="rank-row">
              <span class="rank-name">{{ item.deptName }}</span>
              <div class="rank-track">
                <div class="rank-fill" :style="{
                  width: showAnimation ? `${(Number(item.visitCount || 0) / deptMax) * 100}%` : '0%',
                  transitionDelay: `${i * 0.08}s`
                }"></div>
              </div>
              <span class="rank-count"><strong>{{ item.visitCount }}</strong></span>
            </div>
          </el-card>
        </section>

        <!-- 缴费/报销状态 -->
        <section class="panel-grid">
          <el-card shadow="never" class="chart-card">
            <template #header><span class="panel-title">缴费状态分布</span></template>
            <div v-if="data.payStatus.length" class="status-bars">
              <div v-for="(row, i) in data.payStatus" :key="i" class="status-bar-item">
                <div class="sb-head">
                  <span class="sb-label">{{ payStatusName(row.status) }}</span>
                  <span class="sb-detail">{{ row.count }}单 / {{ money(row.totalFee) }}</span>
                </div>
                <div class="sb-track">
                  <div class="sb-fill" :class="{
                    'sb-paid': Number(row.status) === 1,
                    'sb-void': Number(row.status) === 2,
                    'sb-pending': Number(row.status) !== 1 && Number(row.status) !== 2
                  }" :style="{ width: showAnimation ? `${(Number(row.count || 0) / Math.max(...data.payStatus.map((p:any) => p.count), 1)) * 100}%` : '0%', transitionDelay: `${i * 0.1}s` }"></div>
                </div>
              </div>
            </div>
            <div v-else class="empty">暂无数据</div>
          </el-card>

          <el-card shadow="never" class="chart-card">
            <template #header><span class="panel-title">报销状态分布</span></template>
            <div v-if="data.reimburseStatus.length" class="status-bars">
              <div v-for="(row, i) in data.reimburseStatus" :key="i" class="status-bar-item">
                <div class="sb-head">
                  <span class="sb-label">{{ reimburseStatusName(row.status) }}</span>
                  <span class="sb-detail">{{ row.count }}单 / {{ money(row.totalMoney) }}</span>
                </div>
                <div class="sb-track">
                  <div class="sb-fill" :class="{
                    'sb-approved': Number(row.status) === 1,
                    'sb-rejected': Number(row.status) === 2,
                    'sb-pending-r': Number(row.status) !== 1 && Number(row.status) !== 2
                  }" :style="{ width: showAnimation ? `${(Number(row.count || 0) / Math.max(...data.reimburseStatus.map((p:any) => p.count), 1)) * 100}%` : '0%', transitionDelay: `${i * 0.1}s` }"></div>
                </div>
              </div>
            </div>
            <div v-else class="empty">暂无数据</div>
          </el-card>
        </section>

        <!-- 低库存预警 -->
        <el-card shadow="never" class="warn-card">
          <template #header><span class="panel-title warn-title">低库存药品预警</span></template>
          <el-table :data="data.stockWarnings" size="default" border stripe>
            <el-table-column prop="drugName" label="药品名称" />
            <el-table-column prop="stockNum" label="当前库存" width="120" align="center">
              <template #default="{ row }">
                <span :class="{ 'warn-text': Number(row.stockNum) <= Number(row.lowStock) }"><strong>{{ row.stockNum }}</strong></span>
              </template>
            </el-table-column>
            <el-table-column prop="lowStock" label="预警阈值" width="120" align="center" />
            <el-table-column label="库存状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="Number(row.stockNum) <= Number(row.lowStock) ? 'danger' : 'success'" size="small" effect="dark">
                  {{ Number(row.stockNum) <= Number(row.lowStock) ? '库存不足' : '正常' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="!data.stockWarnings.length" class="empty">暂无预警信息，库存状况良好</div>
        </el-card>
      </div>
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
.container { max-width: 1280px; margin: 0 auto; }
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.topbar h2 { margin: 0; font-size: 22px; color: #1f2d3d; }

/* 筛选 */
.filter-card {
  border-radius: 12px;
  margin-bottom: 20px;
}
.filter-card :deep(.el-card__body) { padding: 12px 20px; }

/* 指标卡片 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.metric-card {
  border-radius: 14px;
  padding: 22px 20px;
  color: #fff;
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
  transform: translateY(-4px);
}
@keyframes metricIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.metric-label { font-size: 13px; opacity: 0.9; }
.metric-value {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.2;
}

/* 面板网格 */
.panel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}
.chart-card { border-radius: 12px; }
.chart-card :deep(.el-card__header) {
  padding: 13px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafbfc;
}
.panel-title { font-weight: 700; font-size: 15px; color: #303133; }

.empty { color: #909399; text-align: center; padding: 28px; font-size: 14px; }

/* 月度趋势柱状图 */
.bar-row {
  margin-bottom: 18px;
}
.bar-row:last-child { margin-bottom: 0; }
.bar-month {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}
.bar-group { margin-bottom: 6px; }
.bar-group:last-child { margin-bottom: 0; }
.bar-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.bar-tag {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 4px;
  font-weight: 600;
}
.income-tag { background: #e8f5e9; color: #67c23a; }
.outcome-tag { background: #fef0f0; color: #f56c6c; }
.bar-amt { font-size: 12px; font-weight: 700; }
.income-color { color: #67c23a; }
.outcome-color { color: #f56c6c; }
.bar-track {
  height: 16px;
  background: #f0f2f5;
  border-radius: 8px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
}
.bar-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2.5s infinite;
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.income-bar { background: linear-gradient(90deg, #67c23a, #85ce61); }
.outcome-bar { background: linear-gradient(90deg, #f56c6c, #f89898); }

/* 科室排行 */
.rank-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.rank-row:last-child { margin-bottom: 0; }
.rank-name {
  width: 90px;
  font-size: 13px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}
.rank-track {
  flex: 1;
  height: 20px;
  background: #f0f2f5;
  border-radius: 10px;
  overflow: hidden;
}
.rank-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #43cea2);
  border-radius: 10px;
  transition: width 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
}
.rank-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2.5s infinite;
}
.rank-count {
  min-width: 36px;
  text-align: right;
  font-size: 14px;
  color: #409eff;
  flex-shrink: 0;
}

/* 状态条 */
.status-bars { padding: 4px 0; }
.status-bar-item { margin-bottom: 16px; }
.status-bar-item:last-child { margin-bottom: 0; }
.sb-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.sb-label { font-size: 13px; font-weight: 600; color: #303133; }
.sb-detail { font-size: 12px; color: #909399; }
.sb-track {
  height: 22px;
  background: #f0f2f5;
  border-radius: 11px;
  overflow: hidden;
}
.sb-fill {
  height: 100%;
  border-radius: 11px;
  transition: width 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.sb-paid { background: linear-gradient(90deg, #67c23a, #85ce61); }
.sb-void { background: linear-gradient(90deg, #909399, #b1b3b8); }
.sb-pending { background: linear-gradient(90deg, #e6a23c, #ebb563); }
.sb-approved { background: linear-gradient(90deg, #409eff, #66b1ff); }
.sb-rejected { background: linear-gradient(90deg, #f56c6c, #f89898); }
.sb-pending-r { background: linear-gradient(90deg, #e6a23c, #ebb563); }

/* 预警卡片 */
.warn-card { border-radius: 12px; margin-bottom: 20px; }
.warn-card :deep(.el-card__header) { background: #fdf6ec; }
.warn-title { color: #e6a23c !important; }
.warn-text { color: #f56c6c; }

/* 响应式 */
@media (max-width: 1024px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .panel-grid { grid-template-columns: 1fr; }
}
</style>
