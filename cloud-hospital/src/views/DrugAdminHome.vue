<script setup lang="ts">
import RoleLayout from '../components/RoleLayout.vue'

const features = [
  { title: '药品库存', desc: '查看药品库存，管理药品上下限。', icon: 'Box' },
  { title: '采购管理', desc: '发起采购申请，审核入库。', icon: 'Goods' },
  { title: '处方配药', desc: '根据患者处方完成配药发药。', icon: 'TakeawayBox' }
]
</script>

<template>
  <RoleLayout
    page-title="药房管理中心"
    icon-name="Box"
    subtitle="药品全生命周期管理"
    :features="features"
  />
</template>
