<script setup lang="ts">
import RoleLayout from '../components/RoleLayout.vue'
import DashboardPanel from '../components/DashboardPanel.vue'
import type { SidebarMenuItem } from '../components/Sidebar.vue'

const features = [
  { title: '收费结算', desc: '处理患者挂号费、处方费用结算。', icon: 'Wallet', path: '/finance-admin/pay-orders' },
  { title: '财务台账', desc: '收支明细汇总，生成日报/月报。', icon: 'DataBoard', path: '/finance-admin/records' },
  { title: '报销管理', desc: '审核员工报销，确认报销状态。', icon: 'Document', path: '/finance-admin/reimburses' },
  { title: '统计报表', desc: '查看收支趋势、缴费分布并导出报表。', icon: 'TrendCharts', path: '/finance-admin/reports' }
]

const sidebarMenu: SidebarMenuItem[] = [
  { label: '财务工作台', icon: 'HomeFilled', path: '/finance-admin/home' },
  { label: '收费结算', icon: 'Wallet', path: '/finance-admin/pay-orders' },
  { label: '财务台账', icon: 'DataBoard', path: '/finance-admin/records' },
  { label: '报销管理', icon: 'Document', path: '/finance-admin/reimburses' },
  { label: '统计报表', icon: 'TrendCharts', path: '/finance-admin/reports' },
  { label: '个人中心', icon: 'User', path: '/finance-admin/profile' }
]
</script>

<template>
  <RoleLayout
    page-title="财务管理中心"
    icon-name="Wallet"
    subtitle="处理缴费、收支、报销和财务报表"
    :features="features"
    :sidebar-menu="sidebarMenu"
  >
    <template #after-welcome>
      <DashboardPanel />
    </template>
  </RoleLayout>
</template>
