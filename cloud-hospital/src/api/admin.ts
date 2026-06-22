import request from '../utils/request'
import type { SysRole, SysUser, PageResult, Result, Department, Doctor } from '../types'

export const roleAllApi = (): Promise<Result<SysRole[]>> =>
  request.get('/admin/roles/all')

export const rolePageApi = (params: {
  roleName?: string
  roleCode?: string
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<SysRole>>> =>
  request.get('/admin/roles', { params })

export const roleDetailApi = (id: number): Promise<Result<SysRole>> =>
  request.get(`/admin/roles/${id}`)

export const roleAddApi = (data: SysRole): Promise<Result<null>> =>
  request.post('/admin/roles', data)

export const roleUpdateApi = (data: SysRole): Promise<Result<null>> =>
  request.put('/admin/roles', data)

export const roleDeleteApi = (id: number): Promise<Result<null>> =>
  request.delete(`/admin/roles/${id}`)

export const userPageApi = (params: {
  username?: string
  realName?: string
  roleId?: number
  status?: number
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<SysUser>>> =>
  request.get('/admin/users', { params })

export const userDetailApi = (id: number): Promise<Result<SysUser>> =>
  request.get(`/admin/users/${id}`)

export const userAddApi = (data: Partial<SysUser>): Promise<Result<null>> =>
  request.post('/admin/users', data)

export const userUpdateApi = (data: Partial<SysUser>): Promise<Result<null>> =>
  request.put('/admin/users', data)

export const userUpdateStatusApi = (id: number, status: number): Promise<Result<null>> =>
  request.patch(`/admin/users/${id}/status?status=${status}`)

export const userBindRoleApi = (id: number, roleId: number): Promise<Result<null>> =>
  request.patch(`/admin/users/${id}/role?roleId=${roleId}`)

export const userDeleteApi = (id: number): Promise<Result<null>> =>
  request.delete(`/admin/users/${id}`)

export const userResetPasswordApi = (id: number, newPassword: string): Promise<Result<null>> =>
  request.post(`/admin/users/${id}/reset-password`, { newPassword })

// ========== 科室管理 API ==========

export const deptPageApi = (params: {
  deptName?: string
  status?: number
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<Department>>> =>
  request.get('/admin/departments', { params })

export const deptAllApi = (): Promise<Result<Department[]>> =>
  request.get('/admin/departments/all')

export const deptDetailApi = (id: number): Promise<Result<Department>> =>
  request.get(`/admin/departments/${id}`)

export const deptAddApi = (data: Partial<Department>): Promise<Result<Department>> =>
  request.post('/admin/departments', data)

export const deptUpdateApi = (data: Partial<Department>): Promise<Result<Department>> =>
  request.put('/admin/departments', data)

export const deptUpdateStatusApi = (id: number, status: number): Promise<Result<null>> =>
  request.patch(`/admin/departments/${id}/status?status=${status}`)

export const deptDeleteApi = (id: number): Promise<Result<null>> =>
  request.delete(`/admin/departments/${id}`)

export const deptDoctorsApi = (deptId: number): Promise<Result<Doctor[]>> =>
  request.get(`/admin/departments/${deptId}/doctors`)

// ========== 医生分配到科室 API ==========

export const doctorAllApi = (): Promise<Result<Doctor[]>> =>
  request.get('/admin/departments/doctors/all')

export const assignDoctorDeptApi = (doctorId: number, deptId: number): Promise<Result<null>> =>
  request.patch(`/admin/departments/doctors/${doctorId}/dept?deptId=${deptId}`)

// ========== 医护人员管理 API ==========

export interface DoctorAdminVO {
  id: number
  userId: number
  deptId: number
  deptName: string
  realName: string
  title: string
  skill: string
  workStatus: number
  phone: string
  idCard?: string
  status: number
  username: string
}

export const doctorAdminPageApi = (params: {
  realName?: string
  deptId?: number
  workStatus?: number
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<DoctorAdminVO>>> =>
  request.get('/admin/doctors', { params })

export const doctorAdminDetailApi = (id: number): Promise<Result<DoctorAdminVO>> =>
  request.get(`/admin/doctors/${id}`)

export const doctorAdminAddApi = (
  data: Partial<DoctorAdminVO> & {
    username: string
    password?: string
    phone: string
    realName: string
  }
): Promise<Result<null>> =>
  request.post('/admin/doctors', data)

export const doctorAdminUpdateApi = (
  data: Partial<DoctorAdminVO> & {
    id: number
    phone?: string
    realName?: string
  }
): Promise<Result<null>> =>
  request.put('/admin/doctors', data)

export const doctorAdminUpdateStatusApi = (id: number, workStatus: number): Promise<Result<null>> =>
  request.patch(`/admin/doctors/${id}/status?workStatus=${workStatus}`)

export const doctorAdminDeleteApi = (id: number): Promise<Result<null>> =>
  request.delete(`/admin/doctors/${id}`)

export const doctorAdminAllApi = (): Promise<Result<DoctorAdminVO[]>> =>
  request.get('/admin/doctors/all')

// ========== 排班管理 API ==========

export interface DoctorSchedule {
  id: number
  doctorId: number
  doctorName: string
  deptId: number
  deptName: string
  scheduleDate: string
  timeSlot: string
  status: number
  remark?: string
  createTime?: string
}

export const schedulePageApi = (params: {
  doctorId?: number
  deptId?: number
  startDate?: string
  endDate?: string
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<DoctorSchedule>>> =>
  request.get('/admin/schedules', { params })

export const scheduleListApi = (params: {
  doctorId?: number
  deptId?: number
  startDate?: string
  endDate?: string
}): Promise<Result<DoctorSchedule[]>> =>
  request.get('/admin/schedules/list', { params })

export const scheduleDetailApi = (id: number): Promise<Result<DoctorSchedule>> =>
  request.get(`/admin/schedules/${id}`)

export const scheduleAddApi = (data: Partial<DoctorSchedule>): Promise<Result<null>> =>
  request.post('/admin/schedules', data)

export const scheduleBatchAddApi = (data: {
  doctorIds: number[]
  scheduleDates: string[]
  timeSlots: string[]
  deptId?: number
  remark?: string
}): Promise<Result<null>> =>
  request.post('/admin/schedules/batch', data)

export const scheduleUpdateApi = (data: Partial<DoctorSchedule>): Promise<Result<null>> =>
  request.put('/admin/schedules', data)

export const scheduleDeleteApi = (id: number): Promise<Result<null>> =>
  request.delete(`/admin/schedules/${id}`)

// 医生端排班查询
export const doctorScheduleListApi = (params: {
  startDate?: string
  endDate?: string
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<DoctorSchedule>>> =>
  request.get('/doctor/schedules', { params })

// ========== 考勤管理 API ==========

export interface DoctorAttendance {
  id: number
  doctorId: number
  doctorName: string
  attendanceDate: string
  checkInTime: string
  checkOutTime?: string
  status: number
  location?: string
  remark?: string
}

export interface DoctorLeave {
  id: number
  doctorId: number
  doctorName: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  auditStatus: number
  auditUser?: string
  auditTime?: string
  auditRemark?: string
  createTime?: string
}

// 医生端 - 考勤打卡
export const doctorCheckInApi = (data: {
  location?: string
  remark?: string
}): Promise<Result<DoctorAttendance>> =>
  request.post('/doctor/attendance/check-in', data)

export const doctorCheckOutApi = (data: {
  location?: string
  remark?: string
}): Promise<Result<DoctorAttendance>> =>
  request.post('/doctor/attendance/check-out', data)

export const doctorAttendanceListApi = (params: {
  startDate?: string
  endDate?: string
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<DoctorAttendance>>> =>
  request.get('/doctor/attendance', { params })

// 医生端 - 请假申请
export const leaveApplyApi = (data: {
  leaveType: string
  startDate: string
  endDate: string
  reason: string
}): Promise<Result<null>> =>
  request.post('/doctor/leave', data)

export const leaveListApi = (params: {
  auditStatus?: number
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<DoctorLeave>>> =>
  request.get('/doctor/leave', { params })

// 管理员端 - 请假审批
export const leaveAdminListApi = (params: {
  doctorId?: number
  auditStatus?: number
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<DoctorLeave>>> =>
  request.get('/admin/leave', { params })

export const leaveAuditApi = (
  id: number,
  data: {
    auditStatus: number
    auditRemark?: string
  }
): Promise<Result<null>> =>
  request.post(`/admin/leave/${id}/audit`, data)

// 管理员端 - 考勤记录
export const attendanceAdminListApi = (params: {
  doctorId?: number
  startDate?: string
  endDate?: string
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<DoctorAttendance>>> =>
  request.get('/admin/attendance', { params })

// 管理员端 - 考勤统计
export const attendanceStatsApi = (params: {
  startDate?: string
  endDate?: string
}): Promise<Result<any>> =>
  request.get('/admin/attendance/stats', { params })