<script setup lang="ts">
import RoleLayout from '../components/RoleLayout.vue'
import DashboardPanel from '../components/DashboardPanel.vue'

const features = [
  { title: '药品库存', desc: '管理药品信息、库存、预警、盘点。', icon: 'Box', path: '/drug-admin/drug-stock' },
  { title: '采购管理', desc: '发起采购申请、审核入库、记录溯源。', icon: 'Goods', path: '/drug-admin/purchase' },
  { title: '处方配药', desc: '接收医生电子处方、拣选、配药、发药。', icon: 'TakeawayBox', path: '/drug-admin/dispense' }
]
</script>

<template>
  <RoleLayout
    page-title="药房管理中心"
    icon-name="Box"
    subtitle="管理药品、库存、采购和配药业务"
    :features="features"
  >
    <template #after-welcome>
      <DashboardPanel />
    </template>
  </RoleLayout>
</template>
