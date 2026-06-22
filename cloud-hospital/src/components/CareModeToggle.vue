<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getCareModeConfigApi } from '../api/systemConfig'
import { getUser } from '../utils/request'
import {
  applyCareModeForCurrentUser,
  isCareModeEnabledForUser,
  saveCareModeRuntimeConfig,
  setCareModeEnabledForUser,
  speakCareModeText
} from '../utils/careMode'
import type { CareModeConfig } from '../types'

const enabled = ref(false)
const config = ref<CareModeConfig | null>(null)
const loading = ref(false)
const user = getUser()

async function loadConfig() {
  loading.value = true
  try {
    const res = await getCareModeConfigApi()
    if (res.code === 200 && res.data) {
      config.value = res.data
      saveCareModeRuntimeConfig(res.data)
      applyCareModeForCurrentUser(res.data)
      enabled.value = user ? isCareModeEnabledForUser(user.id) : false
    }
  } finally {
    loading.value = false
  }
}

function onChange(value: boolean | string | number) {
  const next = Boolean(value)
  enabled.value = next
  setCareModeEnabledForUser(next, user?.id, config.value)

  if (next) {
    ElMessage.success('已开启关怀模式')
    speakCareModeText('已开启关怀模式，页面文字、按钮和提示已优化。', config.value?.voiceEnabled ?? true)
  } else {
    ElMessage.info('已关闭关怀模式')
  }
}

onMounted(loadConfig)
</script>

<template>
  <div class="care-toggle" v-if="config?.enabled !== false">
    <el-icon class="care-icon"><HelpFilled /></el-icon>
    <span class="care-label">关怀</span>
    <el-switch
      v-model="enabled"
      :loading="loading"
      inline-prompt
      active-text="开"
      inactive-text="关"
      @change="onChange"
    />
  </div>
</template>

<style scoped>
.care-toggle {
  min-height: 38px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--h-card);
  border: 1px solid var(--h-border);
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--h-text-secondary);
  white-space: nowrap;
}

.care-icon {
  color: var(--h-primary);
}

.care-label {
  color: var(--h-text-secondary);
  font-size: 13px;
  font-weight: 800;
}

@media (max-width: 980px) {
  .care-label {
    display: none;
  }

  .care-toggle {
    padding: 0 8px;
  }
}
</style>