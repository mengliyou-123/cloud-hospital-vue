import request from '../utils/request'
import type { Patient, PageResult, Result } from '../types'

export const patientPageApi = (params: {
  realName?: string
  phone?: string
  idCard?: string
  status?: number
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<Patient>>> => request.get('/patients', { params })

export const patientDetailApi = (id: number): Promise<Result<Patient>> =>
  request.get(`/patients/${id}`)

export const patientAddApi = (data: Partial<Patient> & { username?: string; password?: string }): Promise<Result<any>> =>
  request.post('/patients', data)

export const patientUpdateApi = (data: Partial<Patient>): Promise<Result<null>> =>
  request.put('/patients', data)

export const patientUpdateStatusApi = (id: number, status: number): Promise<Result<null>> =>
  request.patch(`/patients/${id}/status?status=${status}`)

export const patientDeleteApi = (id: number): Promise<Result<null>> =>
  request.delete(`/patients/${id}`)
