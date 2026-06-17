import request from '../utils/request'
import type { ArrivalStatisticsVO, Result, VisitTimelineVO } from '../types'

export const getVisitTimelineApi = (registerId: number): Promise<Result<VisitTimelineVO>> =>
  request.get(`/visit-flow/registers/${registerId}/timeline`)

export const confirmArrivalApi = (registerId: number): Promise<Result<null>> =>
  request.post(`/visit-flow/registers/${registerId}/arrival`)

export const sendTodayReminderApi = (): Promise<Result<null>> =>
  request.post('/visit-flow/reminders/today')

export const arrivalStatisticsApi = (date?: string): Promise<Result<ArrivalStatisticsVO>> =>
  request.get('/visit-flow/admin/arrival-statistics', { params: { date } })