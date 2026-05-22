<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { House, User, Document, Collection, Setting, SwitchButton, Notebook, DataAnalysis, Edit, ChatDotSquare } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
  window.location.href = '/login'
}

const handleSelect = (index: string) => {
  router.push(index)
}
</script>

<template>
  <div class="main-layout">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-text">Mathcoe Admin</span>
      </div>
      <el-menu
        :default-active="$route.path"
        @select="handleSelect"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/">
          <el-icon><House /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/topics">
          <el-icon><Collection /></el-icon>
          <span>专题管理</span>
        </el-menu-item>
        <el-menu-item index="/exam-papers">
          <el-icon><Notebook /></el-icon>
          <span>考卷管理</span>
        </el-menu-item>
        <el-menu-item index="/questions">
          <el-icon><Document /></el-icon>
          <span>题目管理</span>
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><DataAnalysis /></el-icon>
          <span>运营报表</span>
        </el-menu-item>
        <el-sub-menu index="content-mgmt">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/contents">
            <span>内容列表</span>
          </el-menu-item>
          <el-menu-item index="/banners">
            <span>Banner 管理</span>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/feedbacks">
          <el-icon><ChatDotSquare /></el-icon>
          <span>意见反馈</span>
        </el-menu-item>
      </el-menu>
    </aside>
    <div class="main-wrapper">
      <header class="header">
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-icon><Setting /></el-icon>
              {{ authStore.adminInfo?.username || 'Admin' }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 220px;
  background-color: #304156;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 20px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #606266;
}

.main-content {
  flex: 1;
  background-color: #f0f2f5;
  padding: 20px;
  overflow: auto;
}
</style>