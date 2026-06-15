import request from '../utils/request'
import type { TreatmentVO, PrescriptionVO, PayOrderVO, Result } from '../types'

/** 查看所有历史就诊记录 */
export const getPatientTreatmentsApi = (): Promise<Result<TreatmentVO[]>> =>
  request.get('/patient/query/treatments')

/** 查看本人处方单 */
export const getPatientPrescriptionsApi = (): Promise<Result<PrescriptionVO[]>> =>
  request.get('/patient/query/prescriptions')

/** 查看处方详情 */
export const getPrescriptionDetailApi = (id: number): Promise<Result<PrescriptionVO>> =>
  request.get(`/patient/query/prescriptions/${id}`)

/** 查看缴费记录 */
export const getPatientPayOrdersApi = (): Promise<Result<PayOrderVO[]>> =>
  request.get('/patient/query/pay-orders')

/** 去缴费 */
export const payOrderApi = (orderId: number): Promise<Result<null>> =>
  request.post(`/patient/query/pay/${orderId}`)