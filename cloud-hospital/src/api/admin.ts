import request from '../utils/request'
import type { SysRole, SysUser, PageResult, Result, Department, Doctor } from '../types'

export const roleAllApi = (): Promise<Result<SysRole[]>> =>
  request.get('/admin/roles/all')

export const rolePageApi = (params: {
  roleName?: string
  roleCode?: string
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<SysRole>>> => request.get('/admin/roles', { params })

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
}): Promise<Result<PageResult<SysUser>>> => request.get('/admin/users', { params })

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
}): Promise<Result<PageResult<Department>>> => request.get('/admin/departments', { params })

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
