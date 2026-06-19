<script setup lang="ts">
import { ref, reactive, onMounted, computed, useSlots } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { logoutApi, changePasswordApi } from '../api/auth'
import { getUser, clearUser } from '../utils/request'
import { applyCareModeForCurrentUser, clearCareModeRuntime } from '../utils/careMode'
import CareModeToggle from './CareModeToggle.vue'
import Sidebar from './Sidebar.vue'
import type { SidebarMenuItem } from './Sidebar.vue'
import type { LoginUser, ChangePasswordForm } from '../types'
import MessageBell from './MessageBell.vue'

const props = defineProps<{
  pageTitle: string
  iconName?: string
  subtitle?: string
  features?: { title: string; desc: string; icon: string; path?: string }[]
  sidebarMenu?: SidebarMenuItem[]
}>()

const router = useRouter()
const slots = useSlots()

const sidebarCollapsed = ref(false)

const hasFeatureCards = computed(() => !!props.features && props.features.length > 0)
const showPlaceholder = computed(() => !hasFeatureCards.value && !slots.default)
const hasSidebar = computed(() => !!props.sidebarMenu && props.sidebarMenu.length > 0)

const user = ref<LoginUser | null>(null)
const dialogVisible = ref(false)
const pwdLoading = ref(false)
const pwdFormRef = ref<FormInstance>()
const pwdForm = reactive<ChangePasswordForm>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    {
      required: true,
      validator: (_r, v, cb) => {
        if (!v) return cb(new Error('请再次输入新密码'))
        if (v !== pwdForm.newPassword) return cb(new Error('两次输入不一致'))
        cb()
      },
      trigger: 'blur'
    }
  ]
}

onMounted(() => {
  user.value = getUser()
  applyCareModeForCurrentUser()
})

function openProfile() {
  if (!user.value) return
  const map: Record<string, string> = {
    patient: '/patient/profile',
    doctor: '/doctor/profile',
    drug_admin: '/drug-admin/profile',
    finance_admin: '/finance-admin/profile',
    super_admin: '/super-admin/profile'
  }
  router.push(map[user.value.roleCode] || '/login')
}

function openLogs() {
  if (!user.value) return
  const map: Record<string, string> = {
    patient: '/patient/logs',
    doctor: '/doctor/logs',
    super_admin: '/super-admin/logs'
  }
  const p = map[user.value.roleCode]
  if (p) router.push(p)
  else ElMessage.info('当前角色暂不支持查询日志入口')
}

function openChangePassword() {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  dialogVisible.value = true
}

async function submitPassword() {
  if (!pwdFormRef.value) return
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return
  pwdLoading.value = true
  try {
    const res = await changePasswordApi(pwdForm)
    if (res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      dialogVisible.value = false
      await doLogout(true)
    }
  } finally {
    pwdLoading.value = false
  }
}

const doLogout = async (silent = false) => {
  if (!silent) {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
  }
  try {
    await logoutApi()
  } catch {
    /* ignore */
  }
  clearUser()
  clearCareModeRuntime()
  router.replace('/login')
  if (!silent) ElMessage.success('已退出登录')
}

function onFeatureClick(f: { path?: string; title: string }) {
  if (f.path) {
    router.push(f.path)
    return
  }
  ElMessage.info(`功能【${f.title}】占位，后续可继续扩展`)
}
</script>

<template>
  <div class="layout" :class="{ 'has-sidebar': hasSidebar }">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-left">
        <div class="brand">
          <div class="brand-icon">
            <el-icon :size="18"><Plus /></el-icon>
          </div>
          <span class="brand-text">云医院</span>
        </div>
        <span class="header-divider">|</span>
        <span class="header-subtitle">信息管理系统</span>
      </div>
      <div class="header-right">
        <div class="header-actions">
          <MessageBell />
          <CareModeToggle />
        </div>
        <el-dropdown trigger="click" placement="bottom-end">
          <div class="user-chip">
            <el-avatar :size="34" class="user-avatar">
              {{ user?.realName?.charAt(0) || 'U' }}
            </el-avatar>
            <div class="user-info">
              <span class="user-name">{{ user?.realName }}</span>
              <span class="user-role">{{ user?.roleName }}</span>
            </div>
            <el-icon class="user-arrow"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="openProfile">
                <el-icon><User /></el-icon>个人中心
              </el-dropdown-item>
              <el-dropdown-item divided @click="openChangePassword">
                <el-icon><Lock /></el-icon>修改密码
              </el-dropdown-item>
              <el-dropdown-item @click="openLogs">
                <el-icon><Document /></el-icon>操作记录
              </el-dropdown-item>
              <el-dropdown-item divided @click="doLogout()">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="layout-body">
      <!-- 侧边导航栏 -->
      <Sidebar
        v-if="hasSidebar"
        v-model:collapsed="sidebarCollapsed"
        :menu-items="sidebarMenu!"
      />

      <!-- 主内容区 -->
      <main class="main" :class="{ 'sidebar-open': hasSidebar && !sidebarCollapsed, 'sidebar-fold': hasSidebar && sidebarCollapsed }">
        <!-- 欢迎区域 -->
        <section class="hero">
          <div class="hero-icon">
            <el-icon :size="24"><component :is="props.iconName || 'HomeFilled'" /></el-icon>
          </div>
          <div class="hero-content">
            <h1 class="hero-title">{{ props.pageTitle }}</h1>
            <p class="hero-sub">{{ props.subtitle || '欢迎使用云医院信息管理系统' }}</p>
          </div>
        </section>

        <!-- 问候卡片 -->
        <section class="welcome">
          <div class="welcome-card">
            <div class="welcome-greeting">
              <div class="welcome-avatar">
                <el-avatar :size="44" class="welcome-avatar-img">
                  {{ user?.realName?.charAt(0) || 'U' }}
                </el-avatar>
                <div>
                  <div class="welcome-text">
                    你好，<span class="welcome-name">{{ user?.realName }}</span>
                  </div>
                  <div class="welcome-role">
                    <el-tag type="primary" size="small" effect="plain">{{ user?.roleName }}</el-tag>
                  </div>
                </div>
              </div>
              <div class="welcome-date">{{ new Date().toLocaleString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' }) }}</div>
            </div>
          </div>
        </section>

        <slot name="after-welcome" />

        <!-- 功能卡片 -->
        <section v-if="hasFeatureCards" class="features">
          <div
            v-for="(f, i) in features"
            :key="i"
            class="feature-card"
            tabindex="0"
            @click="onFeatureClick(f)"
            @keydown.enter="onFeatureClick(f)"
          >
            <div class="feature-icon">
              <el-icon :size="22"><component :is="f.icon" /></el-icon>
            </div>
            <div class="feature-body">
              <h3 class="feature-title">{{ f.title }}</h3>
              <p class="feature-desc">{{ f.desc }}</p>
            </div>
            <div v-if="f.path" class="feature-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </section>

        <section class="placeholder" v-if="showPlaceholder">
          <el-card shadow="never">
            <el-empty description="此处为后续业务功能的占位区域，请根据需求文档继续扩展" />
          </el-card>
        </section>

        <slot />
      </main>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="dialogVisible" title="修改密码" width="420px" :close-on-click-modal="false">
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="96px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdLoading" @click="submitPassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ========== 布局基础 ========== */
.layout {
  min-height: 100vh;
  background: var(--h-bg);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.layout-body {
  display: flex;
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* ========== 顶部导航 ========== */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 28px;
  background: linear-gradient(135deg, #1E40AF 0%, #2563EB 40%, #3B82F6 100%);
  position: relative;
  z-index: 100;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(30, 64, 175, 0.18);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  backdrop-filter: blur(10px);
}

.brand-text {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
}

.header-divider {
  color: rgba(255, 255, 255, 0.3);
  font-size: 18px;
  font-weight: 300;
}

.header-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 400;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 用户卡片 */
.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 14px 6px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all var(--h-transition);
  backdrop-filter: blur(8px);
}

.user-chip:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.25);
}

.user-avatar {
  background: linear-gradient(135deg, #10B981, #059669) !important;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
}

.user-arrow {
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  transition: transform var(--h-transition);
}

/* ========== 主内容区 ========== */
.main {
  flex: 1;
  padding: 24px 28px 48px;
  transition: margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
  height: calc(100vh - 60px);
}

.main.sidebar-open {
  margin-left: 220px;
}

.main.sidebar-fold {
  margin-left: 64px;
}

/* 关怀模式下的主内容区适配 */
body.care-mode .main {
  height: calc(100vh - 70px);
}

/* ========== 欢迎区域 ========== */
.hero {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: var(--h-bg-card);
  border-radius: var(--h-radius-lg);
  border: 1px solid var(--h-border);
  box-shadow: var(--h-shadow);
}

.hero-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--h-radius-md);
  background: var(--h-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--h-primary);
  flex-shrink: 0;
}

.hero-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--h-text);
  margin: 0;
  line-height: 1.3;
}

.hero-sub {
  font-size: 13px;
  color: var(--h-text-tertiary);
  margin: 2px 0 0;
}

/* ========== 问候卡片 ========== */
.welcome {
  margin-bottom: 24px;
}

.welcome-card {
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
  border-radius: var(--h-radius-lg);
  padding: 20px 24px;
  box-shadow: var(--h-shadow-lg);
}

.welcome-greeting {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome-avatar {
  display: flex;
  align-items: center;
  gap: 14px;
}

.welcome-avatar-img {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.welcome-text {
  font-size: 17px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
}

.welcome-name {
  font-weight: 700;
  color: #fff;
}

.welcome-role {
  margin-top: 4px;
}

.welcome-date {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

/* ========== 功能卡片 ========== */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--h-bg-card);
  border: 1px solid var(--h-border);
  border-radius: var(--h-radius-md);
  cursor: pointer;
  transition: all var(--h-transition);
  box-shadow: var(--h-shadow-sm);
}

.feature-card:hover {
  border-color: var(--h-primary-border);
  box-shadow: var(--h-shadow-md);
  transform: translateY(-2px);
}

.feature-card:active {
  transform: translateY(0);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--h-radius-md);
  background: var(--h-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--h-primary);
  flex-shrink: 0;
  transition: all var(--h-transition);
}

.feature-card:hover .feature-icon {
  background: var(--h-primary);
  color: #fff;
}

.feature-body {
  flex: 1;
  min-width: 0;
}

.feature-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--h-text);
  margin: 0 0 4px;
}

.feature-desc {
  font-size: 13px;
  color: var(--h-text-tertiary);
  margin: 0;
  line-height: 1.5;
}

.feature-arrow {
  color: var(--h-text-placeholder);
  transition: all var(--h-transition);
  flex-shrink: 0;
}

.feature-card:hover .feature-arrow {
  color: var(--h-primary);
  transform: translateX(4px);
}

/* ========== 占位区域 ========== */
.placeholder {
  margin-top: 12px;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .header {
    padding: 0 16px;
    height: 56px;
  }

  .header-subtitle {
    display: none;
  }

  .header-divider {
    display: none;
  }

  .user-info {
    display: none;
  }

  .user-chip {
    padding: 4px;
  }

  .main {
    padding: 16px;
    height: calc(100vh - 56px);
  }

  /* 关怀模式下移动端高度调整 */
  body.care-mode .main {
    height: calc(100vh - 62px);
  }

  .main.sidebar-open,
  .main.sidebar-fold {
    margin-left: 0;
  }

  .hero {
    padding: 16px;
  }

  .hero-title {
    font-size: 17px;
  }

  .welcome-card {
    padding: 16px;
  }

  .welcome-date {
    display: none;
  }

  .features {
    grid-template-columns: 1fr;
  }
}
</style>