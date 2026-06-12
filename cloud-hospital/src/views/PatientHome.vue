<script setup lang="ts">
import RoleLayout from '../components/RoleLayout.vue'

const features = [
  { title: '在线挂号预约', desc: '选择科室与医生，预约就医时间段。', icon: 'Calendar' },
  { title: '就诊记录', desc: '查看历史就诊单、诊断结果与医嘱。', icon: 'Notebook' },
  { title: '处方与缴费', desc: '查看处方详情，完成费用缴纳。', icon: 'Wallet' }
]
</script>

<template>
  <RoleLayout
    page-title="患者服务中心"
    icon-name="UserFilled"
    subtitle="便捷预约、查询就医信息"
    :features="features"
  />
</template>
