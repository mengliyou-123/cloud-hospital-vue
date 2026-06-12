<script setup lang="ts">
import RoleLayout from '../components/RoleLayout.vue'

const features = [
  { title: '接诊工作台', desc: '查看今日挂号患者，开具诊疗记录。', icon: 'User' },
  { title: '处方开具', desc: '为患者开处方、下达医嘱并提交。', icon: 'Edit' },
  { title: '排班与考勤', desc: '查看个人排班信息及考勤记录。', icon: 'Calendar' }
]
</script>

<template>
  <RoleLayout
    page-title="医生工作台"
    icon-name="UserFilled"
    subtitle="高效接诊，规范诊疗"
    :features="features"
  />
</template>
