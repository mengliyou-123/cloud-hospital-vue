<script setup lang="ts">
import RoleLayout from '../components/RoleLayout.vue'
import DashboardPanel from '../components/DashboardPanel.vue'

const features = [
  { title: '用户管理', desc: '管理系统用户账号、分配角色权限', icon: 'Avatar', path: '/super-admin/users' },
  { title: '角色管理', desc: '维护角色列表，支持新增/编辑/删除角色', icon: 'Collection', path: '/super-admin/roles' },
  { title: '科室管理', desc: '管理科室信息，分配医生到相应科室', icon: 'OfficeBuilding', path: '/super-admin/departments' },
  { title: '医护人员管理', desc: '医生档案、职称、所属科室维护', icon: 'UserFilled', path: '/super-admin/doctors' },
  { title: '排班管理', desc: '统一排班：按日期+科室+时段分配医生出诊', icon: 'Calendar', path: '/super-admin/schedules' },
  { title: '请假审批', desc: '医生请假申请审批，审核记录', icon: 'EditPen', path: '/super-admin/leave-audit' },
  { title: '考勤记录', desc: '医生出勤打卡记录查询、考勤统计', icon: 'DataAnalysis', path: '/super-admin/attendance' },
  { title: '患者档案管理', desc: '新增/编辑/禁用/查询患者档案', icon: 'User', path: '/super-admin/patients' },
  { title: '数据字典', desc: '统一维护科室/病症/收费项目等基础数据', icon: 'Reading', path: '/super-admin/dicts' },
  { title: '关怀模式配置', desc: '设置长者友好模式、默认提示年龄和语音提示规则', icon: 'HelpFilled', path: '/super-admin/care-mode' },
  { title: '操作日志', desc: '审计系统关键操作，追踪异常行为', icon: 'Document', path: '/super-admin/logs' },
  { title: '到诊与爽约统计', desc: '查看每日预约、到院、未到院和爽约情况', icon: 'DataAnalysis', path: '/super-admin/arrival-statistics' },
  { title: '统计报表', desc: '汇总财务、就诊、药品库存等运营数据', icon: 'TrendCharts', path: '/super-admin/reports' }
]
</script>

<template>
  <RoleLayout
    page-title="系统管理中心"
    icon-name="Setting"
    subtitle="统一管理用户、角色、科室、排班和运营数据"
    :features="features"
  >
    <template #after-welcome>
      <DashboardPanel />
    </template>
  </RoleLayout>
</template>
