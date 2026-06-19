<script setup lang="ts">
import RoleLayout from '../components/RoleLayout.vue'
import DashboardPanel from '../components/DashboardPanel.vue'
import type { SidebarMenuItem } from '../components/Sidebar.vue'

const features = [
  { title: '接诊工作台', desc: '查看今日挂号患者，开具诊疗记录。', icon: 'UserFilled', path: '/doctor/consultation' },
  { title: '患者档案', desc: '查询与维护患者档案信息', icon: 'User', path: '/doctor/patients' },
  { title: '我的排班', desc: '查看每日/每周/每月个人排班表', icon: 'Calendar', path: '/doctor/schedules' },
  { title: '考勤打卡', desc: '在线考勤打卡，记录出勤时间', icon: 'DataAnalysis', path: '/doctor/attendance' },
  { title: '请假申请', desc: '提交请假申请、查询审核状态', icon: 'EditPen', path: '/doctor/leave' }
]

const sidebarMenu: SidebarMenuItem[] = [
  { label: '工作台', icon: 'HomeFilled', path: '/doctor/home' },
  { label: '接诊工作台', icon: 'UserFilled', path: '/doctor/consultation' },
  { label: '患者档案', icon: 'User', path: '/doctor/patients' },
  { label: '我的排班', icon: 'Calendar', path: '/doctor/schedules' },
  { label: '考勤打卡', icon: 'DataAnalysis', path: '/doctor/attendance' },
  { label: '请假申请', icon: 'EditPen', path: '/doctor/leave' },
  { label: '个人中心', icon: 'User', path: '/doctor/profile' }
]
</script>

<template>
  <RoleLayout
    page-title="医生工作站"
    icon-name="FirstAidKit"
    subtitle="查看排班、接诊患者、维护诊疗记录"
    :features="features"
    :sidebar-menu="sidebarMenu"
  >
    <template #after-welcome>
      <DashboardPanel />
    </template>
  </RoleLayout>
</template>
