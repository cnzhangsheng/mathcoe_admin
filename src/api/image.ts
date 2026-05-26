import request from './request'

export interface ImageItem {
  path: string
  filename: string
  directory: string
  size: number
  modified: string
  url: string
}

export interface ImageListResponse {
  items: ImageItem[]
  total: number
  page: number
  size: number
  subdirs: string[]
  current_directory: string
}

export const imageApi = {
  list: (params: { directory?: string; page?: number; size?: number }) =>
    request.get<ImageListResponse>('/admin/images', { params }),

  delete: (path: string) =>
    request.delete<{ message: string }>('/admin/images', { params: { path } }),

  batchDelete: (paths: string[]) =>
    request.post<{ message: string; deleted: number; errors: { path: string; message: string }[] }>('/admin/images/batch-delete', paths),

  sharpen: (paths: string[]) =>
    request.post<{ message: string; results: { path: string; success: boolean; message: string; url?: string }[] }>('/admin/images/sharpen', paths),

  batchDownload: (paths: string[]) =>
    request.post('/admin/images/batch-download', paths, { responseType: 'blob' }),

  upload: (file: File, directory?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<{ url: string; filename: string; path: string }>(
      '/admin/images/upload',
      formData,
      {
        params: directory ? { directory } : undefined,
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
  }
}
