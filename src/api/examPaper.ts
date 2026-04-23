import request from './request'

export interface ExamPaper {
  id: number
  title: string
  level: string
  total_questions: number
  description: string | null
  paper_type: string
  created_at: string | null
  updated_at: string | null
}

export interface ExamPaperCreate {
  title: string
  level: string
  total_questions?: number
  description?: string
  paper_type?: string
}

export interface ExamPaperUpdate {
  title?: string
  level?: string
  total_questions?: number
  description?: string
  paper_type?: string
}

export interface ExamPaperWithQuestions extends ExamPaper {
  questions: ExamPaperQuestion[]
}

export interface ExamPaperQuestion {
  id: number
  exam_paper_id: number
  question_id: number
  sort: number
  question: QuestionBasic | null
}

export interface ExamPaperQuestionCreate {
  question_id: number
  sort?: number
}

export interface QuestionBasic {
  id: number
  title: string
  level: number | null
  question_type: string
}

export interface ExamPaperListParams {
  page?: number
  size?: number
  level?: string
  paper_type?: string
}

export const examPaperApi = {
  list: (params: ExamPaperListParams) => request.get<ExamPaper[]>('/admin/exam-papers', { params }),
  get: (id: number) => request.get<ExamPaperWithQuestions>(`/admin/exam-papers/${id}`),
  create: (data: ExamPaperCreate) => request.post<ExamPaper>('/admin/exam-papers', data),
  update: (id: number, data: ExamPaperUpdate) => request.put<ExamPaper>(`/admin/exam-papers/${id}`, data),
  delete: (id: number) => request.delete(`/admin/exam-papers/${id}`),

  // 考卷题目管理
  listQuestions: (examPaperId: number) => request.get<ExamPaperQuestion[]>(`/admin/exam-papers/${examPaperId}/questions`),
  addQuestion: (examPaperId: number, data: ExamPaperQuestionCreate) => request.post<ExamPaperQuestion>(`/admin/exam-papers/${examPaperId}/questions`, data),
  removeQuestion: (examPaperId: number, questionId: number) => request.delete(`/admin/exam-papers/${examPaperId}/questions/${questionId}`),
  updateSort: (examPaperId: number, sorts: { id: number; sort: number }[]) => request.post(`/admin/exam-papers/${examPaperId}/questions/sort`, sorts)
}