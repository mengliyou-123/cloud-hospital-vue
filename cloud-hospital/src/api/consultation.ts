import request from '../utils/request'
import type { Drug, PrescriptionVO, TreatmentVO, Result } from '../types'

/** 获取今日待接诊患者列表 */
export const getTodayPendingApi = (): Promise<Result<TreatmentVO[]>> =>
  request.get('/doctor/consultation/today-pending')

/** 启动接诊 */
export const startConsultationApi = (data: { registerId: number }): Promise<Result<TreatmentVO>> =>
  request.post('/doctor/consultation/start', data)

/** 完成诊疗：填写诊断结果、病情描述、医嘱 */
export const completeConsultationApi = (data: {
  id: number
  diseaseDesc: string
  diagnosisResult: string
  doctorAdvice: string
}): Promise<Result<null>> =>
  request.post('/doctor/consultation/complete', data)

/** 获取所有药品列表 */
export const getDrugsApi = (): Promise<Result<Drug[]>> =>
  request.get('/doctor/consultation/drugs')

/** 开具电子处方 */
export const createPrescriptionApi = (data: {
  treatmentId: number
  items: { drugId: number; drugNum: number; drugPrice: number }[]
}): Promise<Result<PrescriptionVO>> =>
  request.post('/doctor/consultation/prescription', data)

/** 医生查看历史诊疗记录 */
export const getDoctorHistoryApi = (): Promise<Result<TreatmentVO[]>> =>
  request.get('/doctor/consultation/history')