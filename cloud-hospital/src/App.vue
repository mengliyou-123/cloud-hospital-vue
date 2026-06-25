﻿﻿<script setup lang="ts">
import { computed } from 'vue'
import RoleLayout from './components/RoleLayout.vue'
import ChatAssistant from './components/ChatAssistant.vue'
import { getUser } from './utils/request'

function cleanTitle(title?: unknown) {
  const t = String(title || '云医院 HIS')
  return t.replace(/\s*-\s*云医院\s*$/, '')
}

const user = computed(() => getUser())
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page-fade" mode="out-in" appear>
      <div :key="route.path">
        <component
          v-if="route.meta?.publicLayout || !route.meta?.roles"
          :is="Component"
        />
        <RoleLayout
          v-else
          :page-title="cleanTitle(route.meta?.title)"
          :icon-name="(route.meta?.icon as string) || 'HomeFilled'"
          :subtitle="route.meta?.subtitle as string"
        >
          <component :is="Component" />
        </RoleLayout>
      </div>
    </transition>
  </router-view>
  <ChatAssistant />
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


