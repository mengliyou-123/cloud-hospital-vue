import request from '../utils/request'
import type { Result, StatisticsDashboard } from '../types'

export const statisticsDashboardApi = (params?: {
  startTime?: string
  endTime?: string
  months?: number
}): Promise<Result<StatisticsDashboard>> => request.get('/statistics/dashboard', { params })

export const exportFinanceReportApi = (params?: {
  startTime?: string
  endTime?: string
}): Promise<Blob> =>
  request.get('/statistics/export/finance', {
    params,
    responseType: 'blob'
  } as any)
