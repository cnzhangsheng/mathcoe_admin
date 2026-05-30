import request from './request'

export interface UserDownloadRecord {
  id: number
  user_id: number
  exam_paper_id: number
  exam_paper_title: string
  downloaded_at: string
  created_at: string
}

export interface UserDownloadListResponse {
  total: number
  items: UserDownloadRecord[]
}

export interface UserDownloadListParams {
  page?: number
  size?: number
  user_id?: number
  exam_paper_id?: number
  keyword?: string
}

export const userDownloadApi = {
  list: (params: UserDownloadListParams) => request.get<UserDownloadListResponse>('/admin/pdf-downloads', { params }),
}