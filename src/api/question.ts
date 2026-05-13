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
  difficulty_level: number | null  // 级别 1-6
  source_year: number | null
  tags: string[] | null
  created_at: string | null
  updated_at: string | null
}

export interface QuestionCreate {
  title: string
  topic_id: number  // 所属专题，必选
  content?: { text: string; format?: string }
  question_type?: string
  options?: { label: string; text: string; format?: string }[]
  answer: string
  explanation?: { text: string; format?: string }
  difficulty_level: number  // 级别 1-6，必选
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
  difficulty_level?: number  // 级别 1-6
  source_year?: number
  tags?: string[]
}

export interface QuestionListParams {
  page?: number
  size?: number
  topic_id?: number
  difficulty_level?: number  // 级别 1-6
  source_year?: number
}

export const questionApi = {
  list: (params: QuestionListParams) => request.get<Question[]>('/admin/questions', { params }),
  create: (data: QuestionCreate) => request.post<Question>('/admin/questions', data),
  update: (id: number, data: QuestionUpdate) => request.put<Question>(`/admin/questions/${id}`, data),
  delete: (id: number) => request.delete(`/admin/questions/${id}`),
  batchDelete: (ids: number[]) => request.post<{ message: string; deleted_count: number }>('/admin/questions/batch-delete', ids),
  getCount: (topicId?: number) => request.get<{ total: number }>('/admin/stats/questions', { params: { topic_id: topicId } })
}