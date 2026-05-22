import request from './request'

export interface Feedback {
  id: number
  user_id: number
  content: string
  contact: string | null
  status: string
  admin_reply: string | null
  created_at: string
  updated_at: string
}

export interface FeedbackUpdate {
  status?: string
  admin_reply?: string
}

export const feedbackApi = {
  list: (params?: { page?: number; size?: number; status?: string }) =>
    request.get<Feedback[]>('/admin/feedbacks', { params }),
  get: (id: number) => request.get<Feedback>(`/admin/feedbacks/${id}`),
  update: (id: number, data: FeedbackUpdate) => request.put<Feedback>(`/admin/feedbacks/${id}`, data),
}