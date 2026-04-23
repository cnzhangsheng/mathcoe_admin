import request from './request'

export interface Question {
  id: number
  topic_id: number | null
  title: string
  content: { text?: string; format?: string } | null
  question_type: string
  options: { label: string; text?: string; format?: string }[] | null
  answer: string
  explanation: { text?: string; format?: string } | null
  difficulty: string | null
  source_year: number | null
  tags: string[] | null
  created_at: string | null
  updated_at: string | null
}

export interface QuestionCreate {
  title: string
  topic_id?: number
  content?: { text: string; format?: string }
  question_type?: string
  options?: { label: string; text: string; format?: string }[]
  answer: string
  explanation?: { text: string; format?: string }
  difficulty?: string
  source_year?: number
  tags?: string[]
}

export interface QuestionUpdate {
  title?: string
  topic_id?: number
  content?: { text: string; format?: string }
  question_type?: string
  options?: { label: string; text: string; format?: string }[]
  answer?: string
  explanation?: { text: string; format?: string }
  difficulty?: string
  source_year?: number
  tags?: string[]
}

export interface QuestionListParams {
  page?: number
  size?: number
  topic_id?: number
  difficulty?: string
}

export const questionApi = {
  list: (params: QuestionListParams) => request.get<Question[]>('/admin/questions', { params }),
  create: (data: QuestionCreate) => request.post<Question>('/admin/questions', data),
  update: (id: number, data: QuestionUpdate) => request.put<Question>(`/admin/questions/${id}`, data),
  delete: (id: number) => request.delete(`/admin/questions/${id}`),
  batchDelete: (ids: number[]) => request.post<{ message: string; deleted_count: number }>('/admin/questions/batch-delete', ids),
  getCount: (topicId?: number) => request.get<{ total: number }>('/admin/stats/questions', { params: { topic_id: topicId } })
}