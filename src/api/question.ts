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
  status: string  // published | unpublished
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
  status?: string  // published | unpublished
}

export const questionApi = {
  list: (params: QuestionListParams) => request.get<Question[]>('/admin/questions', { params }),
  create: (data: QuestionCreate) => request.post<Question>('/admin/questions', data),
  update: (id: number, data: QuestionUpdate) => request.put<Question>(`/admin/questions/${id}`, data),
  delete: (id: number) => request.delete(`/admin/questions/${id}`),
  batchDelete: (ids: number[]) => request.post<{ message: string; deleted_count: number }>('/admin/questions/batch-delete', ids),
  getCount: (topicId?: number) => request.get<{ total: number }>('/admin/stats/questions', { params: { topic_id: topicId } }),
  publish: (id: number) => request.post(`/admin/questions/${id}/publish`),
  unpublish: (id: number) => request.post(`/admin/questions/${id}/unpublish`),
  batchPublish: (ids: number[]) => request.post<{ message: string; updated_count: number }>('/admin/questions/batch-publish', ids),
  batchUnpublish: (ids: number[]) => request.post<{ message: string; updated_count: number }>('/admin/questions/batch-unpublish', ids),
  batchImport: (excel: File, zip?: File) => {
    const formData = new FormData()
    formData.append('excel', excel)
    if (zip) formData.append('zip', zip)
    return request.post<{ success: boolean; data: { total: number; imported: number; failed: number; errors: { row: number; message: string }[] } }>('/admin/questions/batch-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  downloadTemplate: () => request.get('/admin/questions/batch-import-template', { responseType: 'blob' })
}