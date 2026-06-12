<script setup lang="ts">
import RoleLayout from '../components/RoleLayout.vue'

const features = [
  { title: '用户管理', desc: '管理系统用户账号、分配角色权限', icon: 'User', path: '/super-admin/users' },
  { title: '角色管理', desc: '维护角色列表，支持新增/编辑/删除角色', icon: 'Avatar', path: '/super-admin/roles' },
  { title: '数据字典', desc: '统一维护科室/病症/收费项目等基础数据', icon: 'Collection', path: '/super-admin/dicts' },
  { title: '操作日志', desc: '审计系统关键操作，追踪异常行为', icon: 'Document', path: '/super-admin/logs' },
  { title: '统计报表', desc: '汇总财务、就诊、药品库存等运营数据', icon: 'TrendCharts', path: '/super-admin/reports' }
]
</script>

<template>
  <RoleLayout
    page-title="系统管理中心"
    icon-name="Setting"
    subtitle="全院级管理与运营决策支持"
    :features="features"
  />
</template>
