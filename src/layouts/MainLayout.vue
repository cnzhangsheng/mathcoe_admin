<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { House, User, Document, Collection, Setting, SwitchButton, Notebook, DataAnalysis, ChatDotSquare, Tools, FolderAdd, Download, TrendCharts, List, Picture, PictureFilled, Expand, Fold } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const sidebarOpen = ref(false)

const handleLogout = () => {
  authStore.logout()
  window.location.href = '/login'
}

const handleSelect = (index: string) => {
  router.push(index)
  sidebarOpen.value = false
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="main-layout">
    <!-- 移动端遮罩 -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
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
        <el-sub-menu index="user-mgmt">
          <template #title>
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <span>用户列表</span>
          </el-menu-item>
          <el-menu-item index="/pdf-downloads">
            <el-icon><Download /></el-icon>
            <span>下载记录</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="question-mgmt">
          <template #title>
            <el-icon><Notebook /></el-icon>
            <span>题库管理</span>
          </template>
          <el-menu-item index="/topics">
            <el-icon><Collection /></el-icon>
            <span>专题管理</span>
          </el-menu-item>
          <el-menu-item index="/questions">
            <el-icon><Document /></el-icon>
            <span>题目管理</span>
          </el-menu-item>
          <el-menu-item index="/exam-papers">
            <el-icon><Notebook /></el-icon>
            <span>考卷管理</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="content-mgmt">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/contents">
            <el-icon><List /></el-icon>
            <span>内容列表</span>
          </el-menu-item>
          <el-menu-item index="/banners">
            <el-icon><Picture /></el-icon>
            <span>Banner 管理</span>
          </el-menu-item>
          <el-menu-item index="/images">
            <el-icon><PictureFilled /></el-icon>
            <span>图片管理</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="ops-mgmt">
          <template #title>
            <el-icon><TrendCharts /></el-icon>
            <span>运营管理</span>
          </template>
          <el-menu-item index="/reports">
            <el-icon><DataAnalysis /></el-icon>
            <span>运营报表</span>
          </el-menu-item>
          <el-menu-item index="/feedbacks">
            <el-icon><ChatDotSquare /></el-icon>
            <span>意见反馈</span>
          </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="system-settings">
          <template #title>
            <el-icon><Tools /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/system/data-backup">
            <el-icon><FolderAdd /></el-icon>
            <span>数据备份</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </aside>
    <div class="main-wrapper">
      <header class="header">
        <div class="header-left">
          <button class="menu-toggle" @click="toggleSidebar">
            <el-icon :size="22"><Expand v-if="!sidebarOpen" /><Fold v-else /></el-icon>
          </button>
        </div>
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

.sidebar-overlay {
  display: none;
}

.sidebar {
  width: 220px;
  background-color: #304156;
  flex-shrink: 0;
  overflow-y: auto;
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
  min-width: 0;
}

.header {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: #606266;
  padding: 4px;
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

/* 移动端适配 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
    background: rgba(0, 0, 0, 0.4);
  }

  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .main-content {
    padding: 12px;
  }
}
</style>