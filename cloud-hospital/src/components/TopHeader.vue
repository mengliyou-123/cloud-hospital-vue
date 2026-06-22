<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { clearUser, getUser } from '../utils/request'
import MessageBell from './MessageBell.vue'
import CareModeToggle from './CareModeToggle.vue'
import HospitalLogo from './HospitalLogo.vue'
import GlobalSearch from './GlobalSearch.vue'
import HelpDrawer from './HelpDrawer.vue'
import DigitalClock from './DigitalClock.vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import { getHomePath, getRoleTitle } from '../config/roleMenus'

const props = defineProps<{
  collapsed?: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
}>()

const router = useRouter()
const helpDrawerRef = ref<InstanceType<typeof HelpDrawer> | null>(null)

const user = computed(() => getUser())
const roleCode = computed(() => user.value?.roleCode || '')
const roleTitle = computed(() => getRoleTitle(roleCode.value))

function goHome() {
  router.push(getHomePath(roleCode.value))
}

function goProfile() {
  const role = roleCode.value
  const pathMap: Record<string, string> = {
    patient: '/patient/profile',
    doctor: '/doctor/profile',
    drug_admin: '/drug-admin/profile',
    finance_admin: '/finance-admin/profile',
    super_admin: '/super-admin/profile'
  }
  router.push(pathMap[role] || '/login')
}

function openHelp() {
  helpDrawerRef.value?.open()
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确认退出当前账号吗？', '退出登录', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消'
    })
    clearUser()
    router.push('/login')
  } catch {}
}
</script>

<template>
  <header class="top-header">
    <div class="left-area">
      <button class="menu-trigger" type="button" @click="emit('toggleSidebar')" aria-label="展开或收起菜单">
        <el-icon>
          <Fold v-if="!props.collapsed" />
          <Expand v-else />
        </el-icon>
      </button>

      <button class="logo-button" type="button" @click="goHome">
        <HospitalLogo :collapsed="false" :subtitle="roleTitle" />
      </button>
    </div>

    <div class="center-area">
      <GlobalSearch :role-code="roleCode" />
    </div>

    <div class="right-area">
      <ThemeSwitcher />

      <el-tooltip content="使用说明" placement="bottom">
        <el-button class="header-icon-btn" circle @click="openHelp">
          <el-icon><QuestionFilled /></el-icon>
        </el-button>
      </el-tooltip>

      <MessageBell />

      <CareModeToggle />

      <DigitalClock />

      <el-dropdown trigger="click">
        <button class="user-entry" type="button">
          <el-avatar :size="34" class="user-avatar">
            {{ user?.realName?.slice(0, 1) || 'U' }}
          </el-avatar>
          <span class="user-meta">
            <b>{{ user?.realName || user?.username || '系统用户' }}</b>
            <em>{{ roleTitle }}</em>
          </span>
          <el-icon><ArrowDown /></el-icon>
        </button>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goProfile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item @click="goHome">
              <el-icon><HomeFilled /></el-icon>
              返回首页
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <HelpDrawer ref="helpDrawerRef" :role-code="roleCode" />
  </header>
</template>

<style scoped>
.top-header {
  height: 72px;
  padding: 0 22px;
  display: grid;
  grid-template-columns: minmax(280px, auto) 1fr auto;
  align-items: center;
  gap: 18px;
  background: var(--h-header-bg);
  border-bottom: 1px solid var(--h-header-border);
  backdrop-filter: blur(14px);
  position: sticky;
  top: 0;
  z-index: 30;
}

.left-area,
.right-area,
.center-area {
  display: flex;
  align-items: center;
  min-width: 0;
}

.left-area {
  gap: 12px;
}

.center-area {
  justify-content: center;
}

.right-area {
  justify-content: flex-end;
  gap: 9px;
}

.menu-trigger,
.logo-button,
.user-entry {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.menu-trigger {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: var(--h-primary);
  border: 1px solid var(--h-border);
  background: var(--h-card);
  transition: all var(--h-transition);
}

.menu-trigger:hover {
  background: var(--h-primary-bg);
  border-color: var(--h-primary-border);
}

.logo-button {
  text-align: left;
  border-radius: 12px;
}

.logo-button:focus-visible {
  outline: 3px solid #f59e0b;
  outline-offset: 3px;
}

.header-icon-btn {
  width: 38px;
  height: 38px;
  color: var(--h-primary);
  border-color: var(--h-border);
  background: var(--h-card);
}

.header-icon-btn:hover {
  background: var(--h-primary-bg);
  border-color: var(--h-primary-border);
}

.user-entry {
  min-width: 168px;
  height: 42px;
  display: grid;
  grid-template-columns: 34px 1fr 14px;
  gap: 10px;
  align-items: center;
  padding: 4px 10px 4px 4px;
  border-radius: 999px;
  border: 1px solid var(--h-border);
  background: var(--h-card);
  color: var(--h-text);
  transition: all var(--h-transition);
}

.user-entry:hover {
  border-color: var(--h-primary-border);
  box-shadow: var(--h-shadow-sm);
}

.user-avatar {
  background: linear-gradient(135deg, var(--h-primary), var(--h-accent));
  font-weight: 900;
}

.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  line-height: 1.1;
}

.user-meta b,
.user-meta em {
  max-width: 92px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-meta b {
  font-size: 13px;
  color: var(--h-text);
}

.user-meta em {
  margin-top: 4px;
  font-style: normal;
  font-size: 11px;
  color: var(--h-text-tertiary);
}

@media (max-width: 1280px) {
  .top-header {
    grid-template-columns: minmax(230px, auto) 1fr auto;
    padding: 0 16px;
    gap: 12px;
  }
}

@media (max-width: 1180px) {
  .user-entry {
    min-width: auto;
    grid-template-columns: 34px 14px;
  }

  .user-meta {
    display: none;
  }
}

@media (max-width: 980px) {
  .center-area {
    justify-content: flex-end;
  }
}

@media (max-width: 860px) {
  .top-header {
    height: 64px;
    grid-template-columns: auto 1fr auto;
  }

  .header-icon-btn {
    display: none;
  }
}

@media (max-width: 640px) {
  .top-header {
    padding: 0 12px;
  }

  .logo-button {
    max-width: 48px;
    overflow: hidden;
  }
}
</style>