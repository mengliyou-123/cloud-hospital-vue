export interface LoginUser {
  id: number
  username: string
  realName: string
  phone: string
  roleId: number
  roleCode: string
  roleName: string
}

export interface Result<T> {
  code: number
  message: string
  data: T
}

export interface LoginForm {
  username: string
  password: string
}

export interface RegisterForm {
  username: string
  password: string
  confirmPassword: string
  realName: string
  phone: string
  idCard: string
  age: number | null
  gender: number
}

export interface ResetPasswordForm {
  username: string
  phone: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export interface PageResult<T> {
  total: number
  list: T[]
  pageNum: number
  pageSize: number
}

export interface SysRole {
  id: number
  roleName: string
  roleCode: string
  roleDesc: string
  createTime?: string
  updateTime?: string
}

export interface SysUser {
  id: number
  username: string
  realName: string
  phone: string
  idCard?: string
  roleId: number
  roleCode?: string
  roleName?: string
  status: number
  password?: string
  createTime?: string
}

export interface SysDict {
  id: number
  dictType: string
  dictLabel: string
  dictValue: string
  sort?: number
  createTime?: string
}

export interface SysOperLog {
  id: number
  userId?: number
  operModule: string
  operType: string
  operContent: string
  ipAddress: string
  operTime: string
  username?: string
  realName?: string
}

export interface PayOrder {
  id: number
  patientId: number
  prescriptionId?: number | null
  registerId?: number | null
  totalFee: number
  payType: number
  payStatus: number
  payTime?: string
  createTime?: string
  patientName?: string
  patientPhone?: string
}

export interface FinanceRecord {
  id: number
  orderId?: number | null
  recordType: number
  money: number
  recordDesc: string
  recordTime?: string
}

export interface Reimburse {
  id: number
  userId: number
  reimburseType: string
  totalMoney: number
  reimburseDesc: string
  auditStatus: number
  createTime?: string
  username?: string
  realName?: string
}

export interface StatisticsDashboard {
  financeSummary: Record<string, any>
  monthlyFinance: Record<string, any>[]
  payStatus: Record<string, any>[]
  reimburseStatus: Record<string, any>[]
  visitDept: Record<string, any>[]
  stockWarnings: Record<string, any>[]
}
