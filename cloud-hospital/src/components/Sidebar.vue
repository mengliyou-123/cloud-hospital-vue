<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export interface SidebarMenuItem {
  label: string
  icon: string
  path: string
}

const props = withDefaults(defineProps<{
  menuItems: SidebarMenuItem[]
  collapsed?: boolean
}>(), {
  collapsed: false
})

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void
}>()

const router = useRouter()
const route = useRoute()

function toggleCollapse() {
  emit('update:collapsed', !props.collapsed)
}

function navigate(path: string) {
  if (route.path !== path) {
    router.push(path)
  }
}

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <!-- 折叠按钮 -->
    <div class="sidebar-toggle" @click="toggleCollapse">
      <el-icon :size="18">
        <Fold v-if="!collapsed" />
        <Expand v-else />
      </el-icon>
    </div>

    <!-- 菜单列表 -->
    <nav class="sidebar-nav">
      <div
        v-for="item in menuItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
        @click="navigate(item.path)"
      >
        <div class="nav-icon">
          <el-icon :size="20"><component :is="item.icon" /></el-icon>
        </div>
        <span class="nav-label" v-show="!collapsed">{{ item.label }}</span>
        <div v-if="isActive(item.path) && !collapsed" class="nav-indicator"></div>
      </div>
    </nav>

    <!-- 底部用户区 -->
    <div class="sidebar-footer" v-show="!collapsed">
      <slot name="footer">
        <div class="footer-text">云医院 HIS</div>
      </slot>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 60px;
  bottom: 0;
  width: 220px;
  background: linear-gradient(180deg, #1E3A5F 0%, #15294A 100%);
  display: flex;
  flex-direction: column;
  z-index: 90;
  transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 2px 0 16px rgba(0, 0, 0, 0.08);
  user-select: none;
}

/* 关怀模式下的侧边栏高度适配 */
body.care-mode .sidebar {
  top: 70px;
}

.sidebar.collapsed {
  width: 64px;
}

/* 折叠按钮 */
.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  margin: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.45);
  transition: all var(--h-transition);
  flex-shrink: 0;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.75);
}

/* 导航菜单 */
.sidebar-nav {
  flex: 1;
  padding: 4px 10px;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 12px;
  margin-bottom: 2px;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.18s ease;
  position: relative;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.9);
}

.nav-item.active {
  background: rgba(37, 99, 235, 0.35);
  color: #fff;
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-label {
  margin-left: 12px;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.nav-indicator {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 2px 0 0 2px;
  background: #60A5FA;
}

/* 底部 */
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.footer-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  text-align: center;
  letter-spacing: 1px;
}

/* 响应式 */
@media (max-width: 768px) {
  .sidebar {
    width: 0;
    box-shadow: none;
  }

  .sidebar.collapsed {
    width: 0;
  }
}
</style>