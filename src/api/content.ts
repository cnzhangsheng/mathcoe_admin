import request from './request'

export interface Content {
  id: number
  title: string
  content: string
  slug: string
  status: string
  created_at: string
  updated_at: string
}

export interface ContentCreate {
  title: string
  content?: string
  slug?: string
  status?: string
}

export interface ContentUpdate {
  title?: string
  content?: string
  slug?: string
  status?: string
}

export const contentApi = {
  list: (params?: { page?: number; size?: number; status?: string }) =>
    request.get<Content[]>('/admin/contents', { params }),
  get: (id: number) => request.get<Content>(`/admin/contents/${id}`),
  create: (data: ContentCreate) => request.post<Content>('/admin/contents', data),
  update: (id: number, data: ContentUpdate) => request.put<Content>(`/admin/contents/${id}`, data),
  delete: (id: number) => request.delete(`/admin/contents/${id}`),
}
