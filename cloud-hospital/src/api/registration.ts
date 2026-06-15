import request from '../utils/request'
import type { Department, Doctor, Schedule, RegisterRecord, Result } from '../types'

/** 获取所有科室 */
export const getDepartmentsApi = (): Promise<Result<Department[]>> =>
  request.get('/patient/departments')

/** 获取某科室下的医生 */
export const getDoctorsByDeptApi = (deptId: number): Promise<Result<Doctor[]>> =>
  request.get(`/patient/departments/${deptId}/doctors`)

/** 获取某医生某日的排班 */
export const getSchedulesApi = (doctorId: number, date: string): Promise<Result<Schedule[]>> =>
  request.get(`/patient/doctors/${doctorId}/schedules`, { params: { date } })

/** 挂号预约 */
export const registerApi = (data: {
  doctorId: number
  deptId: number
  registerDate: string
  timeSlot: string
}): Promise<Result<{ id: number }>> =>
  request.post('/patient/registers', data)

/** 取消挂号 */
export const cancelRegisterApi = (id: number): Promise<Result<null>> =>
  request.patch(`/patient/registers/${id}/cancel`)

/** 我的挂号记录 */
export const getMyRegistersApi = (): Promise<Result<RegisterRecord[]>> =>
  request.get('/patient/registers')