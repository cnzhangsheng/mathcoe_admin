import request from './request'

export interface User {
  id: number
  openid: string
  nickname: string | null
  avatar_url: string | null
  streak_days: number
  last_active_date: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface UserListParams {
  page?: number
  size?: number
  keyword?: string
}

export const userApi = {
  list: (params: UserListParams) => request.get<User[]>('/admin/users', { params }),
  getDetail: (id: number) => request.get<User>(`/admin/users/${id}`),
  getCount: () => request.get<{ total: number }>('/admin/stats/users')
}