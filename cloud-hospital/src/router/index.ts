import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getUser } from '../utils/request'
import type { LoginUser } from '../types'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { title: '登录 - 云医院' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/RegisterView.vue'),
    meta: { title: '注册 - 云医院' }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/auth/ResetPasswordView.vue'),
    meta: { title: '找回密码 - 云医院' }
  },
  // --- 患者工作台 ---
  {
    path: '/patient/home',
    name: 'PatientHome',
    component: () => import('../views/PatientHome.vue'),
    meta: { title: '患者中心 - 云医院', roles: ['patient'] }
  },
  {
    path: '/patient/register',
    name: 'PatientRegister',
    component: () => import('../views/patient/RegisterView.vue'),
    meta: { title: '在线挂号 - 云医院', roles: ['patient'] }
  },
  {
    path: '/patient/registers',
    name: 'PatientRegisters',
    component: () => import('../views/patient/MyRegisters.vue'),
    meta: { title: '挂号记录 - 云医院', roles: ['patient'] }
  },
  {
    path: '/patient/profile',
    name: 'PatientProfile',
    component: () => import('../views/profile/ProfileView.vue'),
    meta: { title: '个人中心 - 云医院', roles: ['patient'] }
  },
  {
    path: '/patient/logs',
    name: 'PatientLogs',
    component: () => import('../views/operlog/OperLogView.vue'),
    meta: { title: '我的操作记录 - 云医院', roles: ['patient'] }
  },
  {
    path: '/patient/treatments',
    name: 'PatientTreatments',
    component: () => import('../views/patient/MyTreatments.vue'),
    meta: { title: '历史就诊记录 - 云医院', roles: ['patient'] }
  },
  {
    path: '/patient/prescriptions',
    name: 'PatientPrescriptions',
    component: () => import('../views/patient/MyPrescriptions.vue'),
    meta: { title: '处方与缴费 - 云医院', roles: ['patient'] }
  },
  // --- 医生工作台 ---
  {
    path: '/doctor/home',
    name: 'DoctorHome',
    component: () => import('../views/DoctorHome.vue'),
    meta: { title: '医生工作台 - 云医院', roles: ['doctor'] }
  },
  {
    path: '/doctor/schedules',
    name: 'DoctorSchedules',
    component: () => import('../views/doctor/DoctorScheduleView.vue'),
    meta: { title: '我的排班 - 云医院', roles: ['doctor'] }
  },
  {
    path: '/doctor/attendance',
    name: 'DoctorAttendance',
    component: () => import('../views/doctor/DoctorAttendanceView.vue'),
    meta: { title: '考勤打卡 - 云医院', roles: ['doctor'] }
  },
  {
    path: '/doctor/leave',
    name: 'DoctorLeave',
    component: () => import('../views/doctor/DoctorLeaveView.vue'),
    meta: { title: '请假申请 - 云医院', roles: ['doctor'] }
  },
  {
    path: '/doctor/consultation',
    name: 'DoctorConsultation',
    component: () => import('../views/doctor/ConsultationView.vue'),
    meta: { title: '接诊工作台 - 云医院', roles: ['doctor'] }
  },
  {
    path: '/doctor/patients',
    name: 'DoctorPatients',
    component: () => import('../views/PatientAdminView.vue'),
    meta: { title: '患者档案 - 云医院', roles: ['doctor'] }
  },
  {
    path: '/doctor/profile',
    name: 'DoctorProfile',
    component: () => import('../views/profile/ProfileView.vue'),
    meta: { title: '个人中心 - 云医院', roles: ['doctor'] }
  },
  {
    path: '/doctor/logs',
    name: 'DoctorLogs',
    component: () => import('../views/operlog/OperLogView.vue'),
    meta: { title: '我的操作记录 - 云医院', roles: ['doctor'] }
  },
  // --- 药房管理员 ---
  {
    path: '/drug-admin/home',
    name: 'DrugAdminHome',
    component: () => import('../views/DrugAdminHome.vue'),
    meta: { title: '药房管理 - 云医院', roles: ['drug_admin'] }
  },
  {
    path: '/drug-admin/profile',
    name: 'DrugAdminProfile',
    component: () => import('../views/profile/ProfileView.vue'),
    meta: { title: '个人中心 - 云医院', roles: ['drug_admin'] }
  },
  // --- 财务管理员 ---
  {
    path: '/finance-admin/home',
    name: 'FinanceAdminHome',
    component: () => import('../views/FinanceAdminHome.vue'),
    meta: { title: '财务工作台 - 云医院', roles: ['finance_admin'] }
  },
  {
    path: '/finance-admin/profile',
    name: 'FinanceAdminProfile',
    component: () => import('../views/profile/ProfileView.vue'),
    meta: { title: '个人中心 - 云医院', roles: ['finance_admin'] }
  },
  {
    path: '/finance-admin/pay-orders',
    name: 'FinancePayOrders',
    component: () => import('../views/finance/PayOrderView.vue'),
    meta: { title: '收费结算 - 云医院', roles: ['finance_admin'] }
  },
  {
    path: '/finance-admin/records',
    name: 'FinanceRecords',
    component: () => import('../views/finance/FinanceRecordView.vue'),
    meta: { title: '财务台账 - 云医院', roles: ['finance_admin'] }
  },
  {
    path: '/finance-admin/reimburses',
    name: 'FinanceReimburses',
    component: () => import('../views/finance/ReimburseView.vue'),
    meta: { title: '报销管理 - 云医院', roles: ['finance_admin'] }
  },
  {
    path: '/finance-admin/reports',
    name: 'FinanceReports',
    component: () => import('../views/finance/ReportView.vue'),
    meta: { title: '统计报表 - 云医院', roles: ['finance_admin'] }
  },
  // --- 系统管理员 ---
  {
    path: '/super-admin/home',
    name: 'SuperAdminHome',
    component: () => import('../views/SuperAdminHome.vue'),
    meta: { title: '系统管理 - 云医院', roles: ['super_admin'] }
  },
  {
    path: '/super-admin/patients',
    name: 'SuperAdminPatients',
    component: () => import('../views/PatientAdminView.vue'),
    meta: { title: '患者档案管理 - 云医院', roles: ['super_admin'] }
  },
  {
    path: '/super-admin/profile',
    name: 'SuperAdminProfile',
    component: () => import('../views/profile/ProfileView.vue'),
    meta: { title: '个人中心 - 云医院', roles: ['super_admin'] }
  },
  {
    path: '/super-admin/users',
    name: 'SuperAdminUsers',
    component: () => import('../views/admin/UserAdminView.vue'),
    meta: { title: '用户管理 - 云医院', roles: ['super_admin'] }
  },
  {
    path: '/super-admin/roles',
    name: 'SuperAdminRoles',
    component: () => import('../views/admin/RoleAdminView.vue'),
    meta: { title: '角色管理 - 云医院', roles: ['super_admin'] }
  },
  {
    path: '/super-admin/dicts',
    name: 'SuperAdminDicts',
    component: () => import('../views/admin/DictAdminView.vue'),
    meta: { title: '数据字典 - 云医院', roles: ['super_admin'] }
  },
  {
    path: '/super-admin/logs',
    name: 'SuperAdminLogs',
    component: () => import('../views/operlog/OperLogView.vue'),
    meta: { title: '操作日志 - 云医院', roles: ['super_admin'] }
  },
  {
    path: '/super-admin/departments',
    name: 'SuperAdminDepartments',
    component: () => import('../views/admin/DeptAdminView.vue'),
    meta: { title: '科室管理 - 云医院', roles: ['super_admin'] }
  },
  {
    path: '/super-admin/doctors',
    name: 'SuperAdminDoctors',
    component: () => import('../views/admin/DoctorAdminView.vue'),
    meta: { title: '医护人员管理 - 云医院', roles: ['super_admin'] }
  },
  {
    path: '/super-admin/schedules',
    name: 'SuperAdminSchedules',
    component: () => import('../views/admin/ScheduleAdminView.vue'),
    meta: { title: '排班管理 - 云医院', roles: ['super_admin'] }
  },
  {
    path: '/super-admin/leave-audit',
    name: 'SuperAdminLeaveAudit',
    component: () => import('../views/admin/LeaveAdminView.vue'),
    meta: { title: '请假审批 - 云医院', roles: ['super_admin'] }
  },
  {
    path: '/super-admin/attendance',
    name: 'SuperAdminAttendance',
    component: () => import('../views/admin/AttendanceAdminView.vue'),
    meta: { title: '考勤记录 - 云医院', roles: ['super_admin'] }
  },
  {
    path: '/super-admin/reports',
    name: 'SuperAdminReports',
    component: () => import('../views/finance/ReportView.vue'),
    meta: { title: '统计报表 - 云医院', roles: ['super_admin'] }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const roleHomeMap: Record<string, string> = {
  patient: '/patient/home',
  doctor: '/doctor/home',
  drug_admin: '/drug-admin/home',
  finance_admin: '/finance-admin/home',
  super_admin: '/super-admin/home'
}

const roleIdHomeMap: Record<number, string> = {
  1: '/patient/home',
  2: '/doctor/home',
  3: '/drug-admin/home',
  4: '/finance-admin/home',
  5: '/super-admin/home'
}

export function getHomeByRole(roleCode: string): string {
  return roleHomeMap[roleCode] || '/login'
}

export function getHomeByUser(user: LoginUser | null): string {
  if (!user) return '/login'
  if (user.roleCode && roleHomeMap[user.roleCode]) {
    return roleHomeMap[user.roleCode]
  }
  if (user.roleId != null && roleIdHomeMap[Number(user.roleId)]) {
    return roleIdHomeMap[Number(user.roleId)]
  }
  return '/login'
}

router.beforeEach((to, _from, next) => {
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }
  const user = getUser()
  const roles: string[] = (to.meta?.roles as string[]) || []
  const isAuthPage = ['/login', '/register', '/reset-password'].includes(to.path)

  if (roles.length === 0 && !isAuthPage) {
    return next()
  }

  if (isAuthPage) {
    if (user) {
      return next(getHomeByUser(user))
    }
    return next()
  }

  if (!user) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (roles.length > 0 && !roles.includes(user.roleCode)) {
    return next(getHomeByUser(user))
  }

  next()
})

export default router
