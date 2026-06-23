<script setup lang="ts">
import { computed } from 'vue'
import RoleLayout from './components/RoleLayout.vue'
import { getUser } from './utils/request'
import { getRoleIdentity } from './config/roleMenus'

function cleanTitle(title?: unknown) {
  const t = String(title || '云医院 HIS')
  return t.replace(/\s*-\s*云医院\s*$/, '')
}

const roleSubtitle = computed(() => {
  const u = getUser()
  return `当前登录角色：${getRoleIdentity(u?.roleCode)}`
})

const user = computed(() => getUser())
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page-fade" mode="out-in" appear>
      <component
        v-if="route.meta?.publicLayout || !route.meta?.roles"
        :is="Component"
        :key="route.path"
      />
      <RoleLayout
        v-else
        :key="route.path"
        :page-title="cleanTitle(route.meta?.title)"
        :icon-name="(route.meta?.icon as string) || 'HomeFilled'"
        :subtitle="(route.meta?.subtitle as string) || roleSubtitle"
      >
        <component :is="Component" />
      </RoleLayout>
    </transition>
  </router-view>
</template>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

#app {
  display: flex;
  flex-direction: column;
}

.page-fade-enter-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.page-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>


