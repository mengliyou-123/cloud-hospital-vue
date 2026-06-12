import request from '../utils/request'
import type {
  LoginForm,
  RegisterForm,
  ResetPasswordForm,
  ChangePasswordForm,
  LoginUser,
  Result
} from '../types'

export const loginApi = (data: LoginForm): Promise<Result<LoginUser>> =>
  request.post('/auth/login', data)

export const logoutApi = (): Promise<Result<null>> => request.post('/auth/logout')

export const registerApi = (data: RegisterForm): Promise<Result<null>> =>
  request.post('/auth/register', data)

export const resetPasswordApi = (data: ResetPasswordForm): Promise<Result<null>> =>
  request.post('/auth/reset-password', data)

export const changePasswordApi = (data: ChangePasswordForm): Promise<Result<null>> =>
  request.post('/auth/change-password', data)

export const meApi = (): Promise<Result<LoginUser>> => request.get('/auth/me')
