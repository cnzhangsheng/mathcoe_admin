import request from './request'

export interface User {
  id: number
  openid: string
  nickname: string | null
  avatar_url: string | null
  streak_days: number
  grade: string
  difficulty_level: number
  daily_goal: number
  user_tier: string
  tier_expires_at: string | null
  last_active_date: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface UserListParams {
  page?: number
  size?: number
  keyword?: string
  grade?: string
  difficulty_level?: number
  daily_goal?: number
  user_tier?: string
}

export interface UserTierUpdate {
  user_tier: string
  tier_expires_at: string | null
}

export const userApi = {
  list: (params: UserListParams) => request.get<User[]>('/admin/users', { params }),
  getDetail: (id: number) => request.get<User>(`/admin/users/${id}`),
  getCount: () => request.get<{ total: number }>('/admin/stats/users'),
  updateTier: (id: number, data: UserTierUpdate) => request.put<User>(`/admin/users/${id}/tier`, data)
}