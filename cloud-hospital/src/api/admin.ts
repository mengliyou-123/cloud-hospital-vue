import request from '../utils/request'
import type { SysRole, SysUser, PageResult, Result } from '../types'

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
