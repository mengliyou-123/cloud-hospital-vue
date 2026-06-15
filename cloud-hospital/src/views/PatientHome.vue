<script setup lang="ts">
import RoleLayout from '../components/RoleLayout.vue'

const features = [
  { title: '在线挂号预约', desc: '选择科室与医生，预约就医时间段。', icon: 'Calendar', path: '/patient/register' },
  { title: '挂号记录', desc: '查看历史挂号记录，取消预约。', icon: 'Notebook', path: '/patient/registers' },
  { title: '就诊记录', desc: '查看所有历史就诊记录与诊断详情。', icon: 'Document', path: '/patient/treatments' },
  { title: '处方与缴费', desc: '查看处方详情，完成费用缴纳。', icon: 'Wallet', path: '/patient/prescriptions' }
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
