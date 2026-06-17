import request from '../utils/request'
import type { Result, RoleDashboardVO } from '../types'

export const currentDashboardApi = (): Promise<Result<RoleDashboardVO>> =>
  request.get('/dashboard/current')