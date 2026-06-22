<script setup lang="ts">
import DashboardPanel from '../components/DashboardPanel.vue'
import HomeFeatureGrid from '../components/HomeFeatureGrid.vue'

const features = [
  {
    title: '收费结算',
    desc: '处理患者挂号费、处方费用结算。',
    icon: 'Wallet',
    path: '/finance-admin/pay-orders'
  },
  {
    title: '财务台账',
    desc: '收支明细汇总，生成日报、月报。',
    icon: 'DataBoard',
    path: '/finance-admin/records'
  },
  {
    title: '报销管理',
    desc: '审核员工报销，确认报销状态。',
    icon: 'Document',
    path: '/finance-admin/reimburses'
  },
  {
    title: '统计报表',
    desc: '查看收支趋势、缴费分布并导出报表。',
    icon: 'TrendCharts',
    path: '/finance-admin/reports'
  }
]
</script>

<template>
  <div class="page-shell">
    <DashboardPanel />
    <HomeFeatureGrid :features="features" />
  </div>
</template>