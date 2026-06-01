import request from './request'

export interface Topic {
  id: number
  title: string
  description: string | null
  difficulty: number | null
  icon: string | null
  color: string | null
  is_high_freq: boolean
}

export interface TopicCreate {
  title: string
  description?: string
  difficulty?: number
  icon?: string
  color?: string
  is_high_freq?: boolean
}

export interface TopicUpdate {
  title?: string
  description?: string
  difficulty?: number
  icon?: string
  color?: string
  is_high_freq?: boolean
}

export const topicApi = {
  list: () => request.get<Topic[]>('/admin/topics'),
  create: (data: TopicCreate) => request.post<Topic>('/admin/topics', data),
  update: (id: number, data: TopicUpdate) => request.put<Topic>(`/admin/topics/${id}`, data),
  delete: (id: number) => request.delete(`/admin/topics/${id}`)
}