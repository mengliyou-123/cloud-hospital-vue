<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUser } from '../utils/request'
import { getRoleMenu } from '../config/roleMenus'

export interface SidebarMenuItem {
  label: string
  icon: string
  path?: string
  children?: SidebarMenuItem[]
}

const props = defineProps<{
  collapsed?: boolean
  mobile?: boolean
}>()

const router = useRouter()
const route = useRoute()
const user = computed(() => getUser())

const menuList = computed(() => getRoleMenu(user.value?.roleCode))
const activePath = computed(() => route.path)

function handleSelect(index: string) {
  if (index && index !== route.path) router.push(index)
}

function flattenPaths(items: SidebarMenuItem[]): string[] {
  return items.flatMap((item) =>
    item.children?.length ? flattenPaths(item.children) : [item.path || '']
  )
}

const availablePaths = computed(() => flattenPaths(menuList.value).filter(Boolean))
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: props.collapsed, mobile: props.mobile }">
    <div class="sidebar-scroll">
      <el-menu
        :default-active="activePath"
        :collapse="props.collapsed && !props.mobile"
        :unique-opened="false"
        :collapse-transition="false"
        class="role-menu"
        @select="handleSelect"
      >
        <template v-for="item in menuList" :key="item.label">
          <el-sub-menu v-if="item.children?.length" :index="item.label">
            <template #title>
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
              <span>{{ item.label }}</span>
            </template>

            <el-menu-item
              v-for="child in item.children"
              :key="child.path || child.label"
              :index="child.path || child.label"
              :disabled="!child.path || !availablePaths.includes(child.path)"
            >
              <el-icon>
                <component :is="child.icon" />
              </el-icon>
              <span>{{ child.label }}</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item
            v-else
            :index="item.path || item.label"
            :disabled="!item.path || !availablePaths.includes(item.path)"
          >
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.label }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 236px;
  flex: 0 0 236px;
  height: calc(100vh - 72px);
  position: sticky;
  top: 72px;
  background: var(--h-sidebar-bg);
  border-right: 1px solid var(--h-sidebar-border);
  transition: width 0.2s ease, flex-basis 0.2s ease;
  z-index: 20;
}

.sidebar.collapsed {
  width: 76px;
  flex-basis: 76px;
}

.sidebar.mobile {
  display: block !important;
  width: 100%;
  height: 100vh;
  position: static;
  top: 0;
  flex-basis: auto;
}

.sidebar-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 10px;
}

.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background: var(--h-border-strong);
  border-radius: 999px;
}

.role-menu {
  border-right: none;
  background: transparent;
}

:deep(.el-menu) {
  background: transparent;
  border-right: none;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 44px;
  border-radius: 12px;
  margin: 4px 0;
  color: var(--h-sidebar-text);
  font-weight: 700;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  color: var(--h-primary);
  background: var(--h-primary-bg);
}

:deep(.el-menu-item.is-active) {
  color: var(--h-sidebar-active-text);
  background: var(--h-sidebar-active-bg);
  box-shadow: var(--h-shadow-sm);
}

:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu__title .el-icon) {
  font-size: 18px;
}

:deep(.el-sub-menu .el-menu-item) {
  height: 40px;
  margin-left: 6px;
  font-size: 14px;
  color: var(--h-sidebar-muted);
}

:deep(.el-sub-menu .el-menu-item.is-active) {
  color: #fff;
}

:deep(.el-sub-menu__icon-arrow) {
  color: var(--h-sidebar-muted);
}

.collapsed :deep(.el-menu-item),
.collapsed :deep(.el-sub-menu__title) {
  justify-content: center;
}

.collapsed :deep(.el-sub-menu__icon-arrow) {
  display: none;
}

@media (max-width: 860px) {
  .sidebar:not(.mobile) {
    display: none;
  }
}
</style>