<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { exportFinanceReportApi, statisticsDashboardApi } from '../../api/statistics'
import { getUser } from '../../utils/request'
import type { StatisticsDashboard } from '../../types'

const router = useRouter()
const loading = ref(false)
const data = ref<StatisticsDashboard>({
  financeSummary: {},
  monthlyFinance: [],
  payStatus: [],
  reimburseStatus: [],
  visitDept: [],
  stockWarnings: []
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

async function load() {
  loading.value = true
  try {
    const res = await statisticsDashboardApi({
      startTime: params.startTime || undefined,
      endTime: params.endTime || undefined,
      months: params.months
    })
    if (res.code === 200) data.value = res.data
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

      <el-card shadow="never" class="card filter-card">
        <el-form :inline="true">
          <el-form-item label="开始日期"><el-date-picker v-model="params.startTime" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item label="结束日期"><el-date-picker v-model="params.endTime" type="date" value-format="YYYY-MM-DD" /></el-form-item>
          <el-form-item label="月度范围"><el-input-number v-model="params.months" :min="1" :max="24" /></el-form-item>
          <el-form-item><el-button type="primary" @click="load">刷新统计</el-button></el-form-item>
        </el-form>
      </el-card>

      <div v-loading="loading">
        <section class="summary-grid">
          <el-card shadow="hover" class="metric income"><div class="label">收入合计</div><div class="value">{{ money(summary.income) }}</div></el-card>
          <el-card shadow="hover" class="metric outcome"><div class="label">支出合计</div><div class="value">{{ money(summary.outcome) }}</div></el-card>
          <el-card shadow="hover" class="metric balance"><div class="label">结余</div><div class="value">{{ money(summary.balance) }}</div></el-card>
          <el-card shadow="hover" class="metric"><div class="label">流水数</div><div class="value">{{ summary.recordCount || 0 }}</div></el-card>
        </section>

        <section class="panel-grid">
          <el-card shadow="never" class="card">
            <template #header><strong>月度收支趋势</strong></template>
            <div v-if="!data.monthlyFinance.length" class="empty">暂无数据</div>
            <div v-for="item in data.monthlyFinance" :key="item.month" class="bar-row">
              <div class="bar-label">{{ item.month }}</div>
              <div class="bar-track"><span class="bar income-bar" :style="{ width: `${(Number(item.income || 0) / monthlyMax) * 100}%` }"></span></div>
              <div class="bar-money">{{ money(item.income) }}</div>
              <div class="bar-track"><span class="bar outcome-bar" :style="{ width: `${(Number(item.outcome || 0) / monthlyMax) * 100}%` }"></span></div>
              <div class="bar-money">{{ money(item.outcome) }}</div>
            </div>
          </el-card>

          <el-card shadow="never" class="card">
            <template #header><strong>就诊科室排行</strong></template>
            <div v-if="!data.visitDept.length" class="empty">暂无挂号数据</div>
            <div v-for="item in data.visitDept" :key="item.deptName" class="rank-row">
              <span>{{ item.deptName }}</span>
              <div class="rank-track"><span :style="{ width: `${(Number(item.visitCount || 0) / deptMax) * 100}%` }"></span></div>
              <b>{{ item.visitCount }}</b>
            </div>
          </el-card>
        </section>

        <section class="panel-grid">
          <el-card shadow="never" class="card">
            <template #header><strong>缴费状态分布</strong></template>
            <el-table :data="data.payStatus" size="small" border>
              <el-table-column label="状态"><template #default="{ row }">{{ payStatusName(row.status) }}</template></el-table-column>
              <el-table-column prop="count" label="单数" />
              <el-table-column label="金额"><template #default="{ row }">{{ money(row.totalFee) }}</template></el-table-column>
            </el-table>
          </el-card>
          <el-card shadow="never" class="card">
            <template #header><strong>报销状态分布</strong></template>
            <el-table :data="data.reimburseStatus" size="small" border>
              <el-table-column label="状态"><template #default="{ row }">{{ reimburseStatusName(row.status) }}</template></el-table-column>
              <el-table-column prop="count" label="单数" />
              <el-table-column label="金额"><template #default="{ row }">{{ money(row.totalMoney) }}</template></el-table-column>
            </el-table>
          </el-card>
        </section>

        <el-card shadow="never" class="card">
          <template #header><strong>异常提醒：低库存药品</strong></template>
          <el-table :data="data.stockWarnings" size="small" border>
            <el-table-column prop="drugName" label="药品" />
            <el-table-column prop="stockNum" label="当前库存" />
            <el-table-column prop="lowStock" label="预警阈值" />
          </el-table>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f4f6fb; padding: 24px 12px; box-sizing: border-box; }
.container { max-width: 1280px; margin: 0 auto; }
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.topbar h2 { margin: 0; font-size: 20px; color: #1f2d3d; }
.card { border-radius: 8px; margin-bottom: 16px; }
.filter-card { margin-bottom: 18px; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
.metric { border-top: 4px solid #409eff; }
.metric.income { border-top-color: #67c23a; }
.metric.outcome { border-top-color: #f56c6c; }
.metric.balance { border-top-color: #e6a23c; }
.label { color: #909399; font-size: 13px; }
.value { margin-top: 8px; font-size: 26px; font-weight: 700; color: #1f2d3d; }
.panel-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 16px; }
.empty { color: #909399; text-align: center; padding: 24px; }
.bar-row { display: grid; grid-template-columns: 72px 1fr 88px 1fr 88px; gap: 8px; align-items: center; margin-bottom: 12px; font-size: 12px; }
.bar-track { height: 10px; background: #edf2f7; border-radius: 999px; overflow: hidden; }
.bar { display: block; height: 100%; min-width: 2px; }
.income-bar { background: #67c23a; }
.outcome-bar { background: #f56c6c; }
.bar-money { color: #606266; }
.rank-row { display: grid; grid-template-columns: 100px 1fr 40px; align-items: center; gap: 10px; margin-bottom: 12px; }
.rank-track { height: 10px; background: #edf2f7; border-radius: 999px; overflow: hidden; }
.rank-track span { display: block; height: 100%; background: linear-gradient(90deg, #409eff, #43cea2); }
</style>
