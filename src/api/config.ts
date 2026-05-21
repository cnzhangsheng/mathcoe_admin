import request from './request'

export interface AdminConfig {
  server_host: string
}

export const configApi = {
  get: () => request.get<AdminConfig>('/admin/config'),
}