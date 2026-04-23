import request from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  admin_id: number
  username: string
  role: string
}

export interface AdminInfo {
  id: number
  username: string
  role: string
  created_at: string | null
}

export const adminApi = {
  login: (params: LoginParams) => request.post<LoginResult>('/admin/login', params),
  getInfo: () => request.get<AdminInfo>('/admin/me')
}