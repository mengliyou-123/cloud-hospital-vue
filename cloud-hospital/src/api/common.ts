import request from '../utils/request'
import type { SysDict, SysOperLog, PageResult, Result } from '../types'

export const dictPageApi = (params: {
  dictType?: string
  dictLabel?: string
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<SysDict>>> => request.get('/admin/dicts', { params })

export const dictTypesApi = (): Promise<Result<string[]>> =>
  request.get('/admin/dicts/types')

export const dictListByTypeApi = (dictType: string): Promise<Result<SysDict[]>> =>
  request.get(`/admin/dicts/type/${dictType}`)

export const dictMultiApi = (types: string[]): Promise<Result<Record<string, SysDict[]>>> =>
  request.post('/admin/dicts/multi', types)

export const dictAddApi = (data: Partial<SysDict>): Promise<Result<null>> =>
  request.post('/admin/dicts', data)

export const dictUpdateApi = (data: Partial<SysDict>): Promise<Result<null>> =>
  request.put('/admin/dicts', data)

export const dictDeleteApi = (id: number): Promise<Result<null>> =>
  request.delete(`/admin/dicts/${id}`)

export const operLogPageApi = (params: {
  operModule?: string
  operType?: string
  username?: string
  startTime?: string
  endTime?: string
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<SysOperLog>>> => request.get('/admin/oper-logs', { params })

export const operLogSelfApi = (params: {
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<SysOperLog>>> =>
  request.get('/admin/oper-logs/self', { params })

export const profileApi = (): Promise<Result<Record<string, any>>> =>
  request.get('/profile')

export const profileUpdateApi = (data: {
  realName: string
  phone: string
  idCard?: string
}): Promise<Result<null>> => request.post('/profile/update', data)

export const profilePatientUpdateApi = (data: {
  age?: number
  gender?: number
  address?: string
  pastMedical?: string
}): Promise<Result<null>> => request.post('/profile/patient/update', data)
