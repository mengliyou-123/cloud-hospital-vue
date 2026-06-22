<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getTheme, setTheme, themePresets, type ThemeKey, normalizeThemeKey } from '../utils/theme'

const current = ref<ThemeKey>(getTheme())

const currentPreset = computed(() => {
  return themePresets.find((item) => item.key === current.value) || themePresets[0]
})

function chooseTheme(theme: ThemeKey) {
  current.value = theme
  setTheme(theme)
  ElMessage.success(`已切换为：${currentPreset.value.name}`)
}

function handleThemeChange(event: Event) {
  const detail = (event as CustomEvent).detail
  current.value = normalizeThemeKey(detail)
}

onMounted(() => {
  window.addEventListener('cloud-hospital-theme-change', handleThemeChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('cloud-hospital-theme-change', handleThemeChange)
})
</script>

<template>
  <el-dropdown trigger="click" popper-class="theme-switch-popper">
    <button class="theme-switch-trigger" type="button" title="切换主题风格">
      <span class="theme-dot" :style="{ background: currentPreset.primary }"></span>
      <span class="theme-text">{{ currentPreset.name }}</span>
      <el-icon><ArrowDown /></el-icon>
    </button>

    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="theme in themePresets"
          :key="theme.key"
          @click="chooseTheme(theme.key)"
        >
          <div class="theme-option">
            <span class="theme-option-dot" :style="{ background: theme.primary }"></span>
            <span>
              <strong>{{ theme.name }}</strong>
              <small>{{ theme.desc }}</small>
            </span>
            <el-icon v-if="theme.key === current" class="checked"><Check /></el-icon>
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.theme-switch-trigger {
  height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--h-border);
  background: var(--h-card);
  color: var(--h-text-secondary);
  cursor: pointer;
  font-weight: 800;
  transition: all var(--h-transition);
}

.theme-switch-trigger:hover {
  border-color: var(--h-primary-border);
  background: var(--h-primary-bg);
  color: var(--h-primary);
}

.theme-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  box-shadow: 0 0 0 3px var(--h-primary-bg);
}

.theme-text {
  white-space: nowrap;
  font-size: 13px;
}

.theme-option {
  min-width: 260px;
  display: grid;
  grid-template-columns: 14px 1fr 18px;
  gap: 10px;
  align-items: center;
  padding: 4px 0;
}

.theme-option-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
}

.theme-option strong {
  display: block;
  color: var(--h-text);
  font-size: 13px;
}

.theme-option small {
  display: block;
  margin-top: 2px;
  color: var(--h-text-tertiary);
  font-size: 12px;
  line-height: 1.35;
}

.checked {
  color: var(--h-primary);
}

@media (max-width: 1180px) {
  .theme-text {
    display: none;
  }

  .theme-switch-trigger {
    width: 38px;
    justify-content: center;
    padding: 0;
  }
}
</style>