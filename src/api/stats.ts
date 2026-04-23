import request from './request'

export interface DashboardStats {
  users_total: number
  questions_total: number
  topics_total: number
  records_total: number
}

export const statsApi = {
  getDashboard: () => request.get<DashboardStats>('/admin/stats')
}