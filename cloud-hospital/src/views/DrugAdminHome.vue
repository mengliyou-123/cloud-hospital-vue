<script setup lang="ts">
import DashboardPanel from '../components/DashboardPanel.vue'
import HomeFeatureGrid from '../components/HomeFeatureGrid.vue'

const features = [
  {
    title: '药品库存',
    desc: '管理药品信息、库存、预警、盘点。',
    icon: 'Box',
    path: '/drug-admin/drug-stock'
  },
  {
    title: '采购管理',
    desc: '发起采购申请、审核入库、记录溯源。',
    icon: 'Goods',
    path: '/drug-admin/purchase'
  },
  {
    title: '处方配药',
    desc: '接收医生电子处方，拣选、配药、发药。',
    icon: 'TakeawayBox',
    path: '/drug-admin/dispense'
  }
]
</script>

<template>
  <div class="page-shell">
    <DashboardPanel />
    <HomeFeatureGrid :features="features" />
  </div>
</template>