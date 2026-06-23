<script setup lang="ts">
import { computed, ref } from 'vue'
import Sidebar from './Sidebar.vue'
import TopHeader from './TopHeader.vue'

const props = defineProps<{
  pageTitle?: string
  subtitle?: string
  iconName?: string
}>()

const collapsed = ref(false)
const mobileMenuVisible = ref(false)

function toggleSidebar() {
  if (window.innerWidth <= 860) {
    mobileMenuVisible.value = true
    return
  }
  collapsed.value = !collapsed.value
}

const fallbackSubtitle = computed(() => props.subtitle)
</script>

<template>
  <div class="role-layout">
    <TopHeader :collapsed="collapsed" @toggle-sidebar="toggleSidebar" />

    <div class="layout-body">
      <Sidebar :collapsed="collapsed" />

      <el-drawer
        v-model="mobileMenuVisible"
        direction="ltr"
        size="280px"
        append-to-body
        :with-header="false"
        class="mobile-menu-drawer"
      >
        <Sidebar mobile />
      </el-drawer>

      <main class="layout-main">
        <section class="page-shell role-page-shell">
          <div class="page-header role-page-header">
            <div class="title-wrap">
              <div class="page-icon" v-if="props.iconName">
                <el-icon>
                  <component :is="props.iconName" />
                </el-icon>
              </div>
              <div>
                <h1>{{ props.pageTitle || '云医院 HIS' }}</h1>
                <p v-if="fallbackSubtitle">{{ fallbackSubtitle }}</p>
              </div>
            </div>
          </div>

          <slot />
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.role-layout {
  min-height: 100vh;
  background:
    radial-gradient(circle at 20% 0%, color-mix(in srgb, var(--h-primary) 8%, transparent), transparent 28%),
    radial-gradient(circle at 85% 12%, color-mix(in srgb, var(--h-accent) 7%, transparent), transparent 30%),
    var(--h-bg);
}

.layout-body {
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: stretch;
}

.layout-main {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.role-page-shell {
  min-height: calc(100vh - 72px);
}

.role-page-shell :deep(> .page-shell) {
  padding: 0;
}

.role-page-header {
  margin-bottom: 18px;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.page-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--h-primary-bg), var(--h-accent-bg));
  color: var(--h-primary);
  font-size: 22px;
  flex: 0 0 auto;
  border: 1px solid var(--h-border);
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: var(--h-text);
  font-weight: 900;
  letter-spacing: -0.02em;
}

.page-header p {
  margin: 6px 0 0;
  color: var(--h-text-tertiary);
  font-size: 14px;
}

:deep(.mobile-menu-drawer .el-drawer__body) {
  padding: 0;
  background: var(--h-sidebar-bg);
}

@media (max-width: 860px) {
  .layout-body {
    display: block;
  }

  .role-page-shell {
    min-height: calc(100vh - 64px);
  }
}

@media (max-width: 640px) {
  .page-header h1 {
    font-size: 20px;
  }

  .page-header p {
    font-size: 13px;
  }

  .page-icon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
  }
}
</style>