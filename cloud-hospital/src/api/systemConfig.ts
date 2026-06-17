import request from '../utils/request'
import type {
  CareModeCheckVO,
  CareModeConfig,
  CareModeConfigUpdateDTO,
  Result
} from '../types'

export const getCareModeConfigApi = (): Promise<Result<CareModeConfig>> =>
  request.get('/system/config/care-mode')

export const checkCareModeApi = (): Promise<Result<CareModeCheckVO>> =>
  request.get('/system/config/care-mode/check')

export const updateCareModeConfigApi = (
  data: CareModeConfigUpdateDTO
): Promise<Result<null>> => request.put('/system/config/care-mode', data)