import request from '../utils/request'
import type { FinanceRecord, PageResult, PayOrder, Reimburse, Result } from '../types'

export const payOrderPageApi = (params: {
  patientName?: string
  payStatus?: number
  startTime?: string
  endTime?: string
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<PayOrder>>> => request.get('/finance/pay-orders', { params })

export const payOrderAddApi = (data: Partial<PayOrder>): Promise<Result<null>> =>
  request.post('/finance/pay-orders', data)

export const payOrderUpdateApi = (data: Partial<PayOrder>): Promise<Result<null>> =>
  request.put('/finance/pay-orders', data)

export const payOrderPaidApi = (id: number, payType: number): Promise<Result<null>> =>
  request.patch(`/finance/pay-orders/${id}/paid?payType=${payType}`)

export const payOrderVoidApi = (id: number): Promise<Result<null>> =>
  request.patch(`/finance/pay-orders/${id}/void`)

export const financeRecordPageApi = (params: {
  recordType?: number
  startTime?: string
  endTime?: string
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<FinanceRecord>>> => request.get('/finance/records', { params })

export const financeRecordAddApi = (data: Partial<FinanceRecord>): Promise<Result<null>> =>
  request.post('/finance/records', data)

export const financeRecordUpdateApi = (data: Partial<FinanceRecord>): Promise<Result<null>> =>
  request.put('/finance/records', data)

export const financeRecordDeleteApi = (id: number): Promise<Result<null>> =>
  request.delete(`/finance/records/${id}`)

export const reimbursePageApi = (params: {
  realName?: string
  auditStatus?: number
  startTime?: string
  endTime?: string
  pageNum: number
  pageSize: number
}): Promise<Result<PageResult<Reimburse>>> => request.get('/finance/reimburses', { params })

export const reimburseAddApi = (data: Partial<Reimburse>): Promise<Result<null>> =>
  request.post('/finance/reimburses', data)

export const reimburseUpdateApi = (data: Partial<Reimburse>): Promise<Result<null>> =>
  request.put('/finance/reimburses', data)

export const reimburseStatusApi = (id: number, auditStatus: number): Promise<Result<null>> =>
  request.patch(`/finance/reimburses/${id}/status?auditStatus=${auditStatus}`)

export const reimburseDeleteApi = (id: number): Promise<Result<null>> =>
  request.delete(`/finance/reimburses/${id}`)
