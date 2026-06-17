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
    ElMessage.success('已开启关怀模式，页面即将刷新')
    speakCareModeText('已开启关怀模式，页面文字、按钮和提示已优化。', config.value?.voiceEnabled ?? true)
  } else {
    ElMessage.info('已关闭关怀模式，页面即将刷新')
  }

  window.setTimeout(() => {
    window.location.reload()
  }, 10)
}

onMounted(loadConfig)
</script>

<template>
  <div class="care-toggle" v-if="config?.enabled !== false">
    <span class="care-label">关怀模式</span>
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
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 4px 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.care-label {
  color: #fff;
  font-size: 13px;
  white-space: nowrap;
  font-weight: 700;
}

body.care-mode .care-toggle {
  min-height: 42px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.26);
}

body.care-mode .care-label {
  font-size: 16px;
}
</style>