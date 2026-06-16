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

export interface Patient {
  id: number
  userId: number
  username?: string
  realName: string
  phone: string
  idCard?: string
  age?: number
  gender?: number
  address?: string
  pastMedical?: string
  status?: number
  createTime?: string
  updateTime?: string
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

// ========== 挂号相关类型 ==========

export interface Department {
  id: number
  deptName: string
  deptDesc: string
  status: number
}

export interface Doctor {
  id: number
  userId: number
  deptId: number
  deptName: string
  realName: string
  title: string
  skill: string
  workStatus: number
}

export interface Schedule {
  id: number
  doctorId: number
  deptId: number
  scheduleDate: string
  timeSlot: string
  status: number
}

export interface RegisterRecord {
  id: number
  patientId: number
  doctorId: number
  deptId: number
  registerDate: string
  timeSlot: string
  registerStatus: number
  registerFee: number
  createTime: string
  deptName: string
  doctorName: string
  doctorTitle: string
  patientName: string
}

// ========== 诊疗相关类型 ==========

export interface TreatmentVO {
  id: number
  registerId: number
  patientId: number
  doctorId: number
  diseaseDesc: string
  diagnosisResult: string
  doctorAdvice: string
  treatmentTime: string
  createTime: string
  patientName: string
  patientPhone: string
  doctorName: string
  deptName: string
  registerDate: string
  timeSlot: string
  registerStatus: number
  registerFee: number
}

export interface Drug {
  id: number
  drugName: string
  drugSpec: string
  drugType: string
  price: number
  manufacturer: string
  validTime: string
  usage: string
  status: number
}

export interface PrescriptionItemVO {
  id: number
  prescriptionId: number
  drugId: number
  drugNum: number
  drugPrice: number
  drugName: string
  drugSpec: string
  manufacturer: string
}

export interface PrescriptionVO {
  id: number
  treatmentId: number
  doctorId: number
  prescriptionTime: string
  totalMoney: number
  prescriptionStatus: number
  createTime: string
  doctorName: string
  patientName: string
  diagnosisResult: string
  items: PrescriptionItemVO[]
}

export interface PayOrderVO {
  id: number
  patientId: number
  prescriptionId: number
  registerId: number
  totalFee: number
  payType: number
  payStatus: number
  payTime: string
  createTime: string
  patientName: string
  doctorName: string
  deptName: string
  diagnosisResult: string
  registerDate: string
  timeSlot: string
  registerFee: number
}

export interface PrescriptionItemDTO {
  drugId: number
  drugNum: number
  drugPrice: number
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
