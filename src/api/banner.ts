import request from './request'

export interface Banner {
  id: number
  image_url: string
  link_type: string
  link_value: string
  title: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BannerCreate {
  image_url: string
  link_type?: string
  link_value?: string
  title?: string
  sort_order?: number
  is_active?: boolean
}

export interface BannerUpdate {
  image_url?: string
  link_type?: string
  link_value?: string
  title?: string
  sort_order?: number
  is_active?: boolean
}

export const bannerApi = {
  list: (params?: { page?: number; size?: number }) =>
    request.get<Banner[]>('/admin/banners', { params }),
  get: (id: number) => request.get<Banner>(`/admin/banners/${id}`),
  create: (data: BannerCreate) => request.post<Banner>('/admin/banners', data),
  update: (id: number, data: BannerUpdate) => request.put<Banner>(`/admin/banners/${id}`, data),
  delete: (id: number) => request.delete(`/admin/banners/${id}`),
}
