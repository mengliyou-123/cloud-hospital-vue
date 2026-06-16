<script setup lang="ts">
import RoleLayout from '../components/RoleLayout.vue'

const features = [
  { title: '接诊工作台', desc: '查看今日挂号患者，开具诊疗记录。', icon: 'UserFilled', path: '/doctor/consultation' },
  { title: '患者档案', desc: '查询与维护患者档案信息', icon: 'User', path: '/doctor/patients' },
  { title: '我的排班', desc: '查看每日/每周/每月个人排班表', icon: 'Calendar', path: '/doctor/schedules' },
  { title: '考勤打卡', desc: '在线考勤打卡，记录出勤时间', icon: 'DataAnalysis', path: '/doctor/attendance' },
  { title: '请假申请', desc: '提交请假申请、查询审核状态', icon: 'EditPen', path: '/doctor/leave' }
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
