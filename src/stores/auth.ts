import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminApi, type AdminInfo } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('admin_token'))
  const adminInfo = ref<AdminInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('admin_token', newToken)
  }

  const clearToken = () => {
    token.value = null
    adminInfo.value = null
    localStorage.removeItem('admin_token')
  }

  const login = async (username: string, password: string) => {
    const result = await adminApi.login({ username, password })
    setToken(result.token)
    adminInfo.value = {
      id: result.admin_id,
      username: result.username,
      role: result.role,
      created_at: null
    }
    return result
  }

  const fetchAdminInfo = async () => {
    if (!token.value) return
    try {
      adminInfo.value = await adminApi.getInfo()
    } catch {
      clearToken()
    }
  }

  const logout = () => {
    clearToken()
  }

  return {
    token,
    adminInfo,
    isLoggedIn,
    login,
    logout,
    fetchAdminInfo
  }
})