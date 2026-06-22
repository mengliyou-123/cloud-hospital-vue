<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { searchActions } from '../config/roleMenus'

const props = defineProps<{
  roleCode?: string
}>()

const router = useRouter()
const keyword = ref('')
const panelVisible = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

const filteredActions = computed(() => {
  const role = props.roleCode || ''
  const kw = keyword.value.trim().toLowerCase()

  return searchActions
    .filter((item) => !role || item.roles.includes(role))
    .filter((item) => {
      if (!kw) return true
      return (
        item.label.toLowerCase().includes(kw) ||
        item.desc.toLowerCase().includes(kw) ||
        item.keywords.some((k) => k.toLowerCase().includes(kw)) ||
        item.path.toLowerCase().includes(kw)
      )
    })
    .sort((a, b) => {
      if (!kw) return 0
      const aMatch = a.label.toLowerCase().startsWith(kw) ? 0 : 1
      const bMatch = b.label.toLowerCase().startsWith(kw) ? 0 : 1
      return aMatch - bMatch
    })
    .slice(0, 20)
})

function updatePanelPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  panelStyle.value = {
    position: 'fixed',
    top: rect.bottom + 8 + 'px',
    left: rect.left + 'px',
    width: Math.max(rect.width, 340) + 'px'
  }
}

function openPanel() {
  updatePanelPosition()
  panelVisible.value = true
}

function closePanel() {
  panelVisible.value = false
}

function togglePanel() {
  if (!panelVisible.value) {
    updatePanelPosition()
  }
  panelVisible.value = !panelVisible.value
}

function go(path: string) {
  closePanel()
  keyword.value = ''
  router.push(path)
}

function handleClickOutside(e: MouseEvent) {
  if (panelVisible.value && triggerRef.value && !triggerRef.value.contains(e.target as Node)) {
    const panelEl = document.querySelector('.global-search-dropdown-panel')
    if (panelEl && !panelEl.contains(e.target as Node)) {
      closePanel()
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
  window.addEventListener('resize', updatePanelPosition)
  window.addEventListener('scroll', updatePanelPosition, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside, true)
  window.removeEventListener('resize', updatePanelPosition)
  window.removeEventListener('scroll', updatePanelPosition, true)
})
</script>

<template>
  <div class="global-search-wrapper">
    <div ref="triggerRef" class="global-search" @click.stop="togglePanel">
      <el-icon><Search /></el-icon>
      <input
        v-model="keyword"
        type="text"
        placeholder="搜索功能，如：挂号、缴费、排班、药品"
        @focus="openPanel"
        @keydown.enter.prevent="filteredActions[0] && go(filteredActions[0].path)"
        @click.stop
      />
      <kbd>Enter</kbd>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="search-dropdown">
      <div
        v-if="panelVisible"
        class="global-search-dropdown-panel"
        :style="panelStyle"
      >
        <div class="search-panel">
          <div class="panel-title">
            <span>功能搜索</span>
            <small>当前角色可访问</small>
          </div>

          <div v-if="filteredActions.length" class="search-list">
            <button
              v-for="item in filteredActions"
              :key="item.path"
              type="button"
              class="search-item"
              @click="go(item.path)"
            >
              <span class="item-icon">
                <el-icon>
                  <component :is="item.icon" />
                </el-icon>
              </span>
              <span class="item-text">
                <b>{{ item.label }}</b>
                <em>{{ item.desc }}</em>
              </span>
              <el-icon class="arrow"><ArrowRight /></el-icon>
            </button>
          </div>

          <el-empty v-else description="没有匹配到功能" :image-size="80" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.global-search-wrapper {
  position: relative;
}

.global-search {
  width: min(420px, 34vw);
  height: 40px;
  border-radius: 999px;
  border: 1px solid var(--h-border);
  background: var(--h-card);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  color: var(--h-text-tertiary);
  transition: all var(--h-transition);
  cursor: text;
}

.global-search:hover,
.global-search:focus-within {
  border-color: var(--h-primary-border);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--h-primary) 10%, transparent);
  background: var(--h-card);
}

.global-search input {
  border: none;
  outline: none;
  flex: 1;
  height: 34px;
  font-size: 14px;
  background: transparent;
  color: var(--h-text);
  min-width: 0;
}

.global-search kbd {
  font-size: 11px;
  color: var(--h-text-tertiary);
  background: var(--h-bg-soft);
  border: 1px solid var(--h-border);
  border-radius: 6px;
  padding: 2px 6px;
}

/* 下拉动画 - scoped 内直接写在过渡组件的子元素上 */
.search-dropdown-enter-active,
.search-dropdown-leave-active {
  transition: all 0.2s ease;
}

.search-dropdown-enter-from,
.search-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 980px) {
  .global-search {
    width: 240px;
  }

  .global-search input::placeholder {
    color: transparent;
  }
}

@media (max-width: 720px) {
  .global-search {
    width: 40px;
    padding: 0;
    justify-content: center;
  }

  .global-search input,
  .global-search kbd {
    display: none;
  }
}
</style>

<style>
/* Teleport 到 body 的下拉面板 - 全局样式确保生效 */
.global-search-dropdown-panel {
  position: fixed;
  z-index: 9999;
  min-width: 340px;
  max-width: 460px;
}

.global-search-dropdown-panel .search-panel {
  max-height: 520px;
  overflow-y: auto;
  padding: 8px 4px 4px;
  background: var(--h-card);
  border-radius: 16px;
  border: 1px solid var(--h-border, #e4e7eb);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.global-search-dropdown-panel .panel-title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
  padding: 4px 12px;
  color: var(--h-text, #1f2d3d);
  font-weight: 700;
  font-size: 13px;
}

.global-search-dropdown-panel .panel-title small {
  color: var(--h-text-tertiary, #8492a6);
  font-weight: 400;
  font-size: 12px;
}

.global-search-dropdown-panel .search-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 4px 8px;
}

.global-search-dropdown-panel .search-item {
  width: 100%;
  border: 1px solid transparent;
  background: var(--h-card);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.global-search-dropdown-panel .search-item:hover {
  background: var(--h-primary-bg, #e8f3ff);
  border-color: var(--h-primary-border, #3a8ee6);
}

.global-search-dropdown-panel .search-item .item-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--h-primary-bg, #e8f3ff), var(--h-accent-bg, #fff3e0));
  color: var(--h-primary, #409eff);
  flex-shrink: 0;
}

.global-search-dropdown-panel .search-item .item-text {
  flex: 1;
  min-width: 0;
}

.global-search-dropdown-panel .search-item .item-text b {
  display: block;
  color: var(--h-text, #1f2d3d);
  font-size: 14px;
  font-weight: 600;
}

.global-search-dropdown-panel .search-item .item-text em {
  display: block;
  color: var(--h-text-tertiary, #8492a6);
  font-size: 12px;
  font-style: normal;
  margin-top: 2px;
}

.global-search-dropdown-panel .search-item .arrow {
  color: var(--h-text-placeholder, #c0c4cc);
  flex-shrink: 0;
}
</style>
