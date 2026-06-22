<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import CareModeQuickPanel from '../components/CareModeQuickPanel.vue'
import DashboardPanel from '../components/DashboardPanel.vue'
import HomeFeatureGrid from '../components/HomeFeatureGrid.vue'
import { checkCareModeApi } from '../api/systemConfig'
import { sendTodayReminderApi } from '../api/visit-flow'
import {
  applyCareModeForCurrentUser,
  isCareModeEnabledForUser,
  markCareModePrompted,
  saveCareModeRuntimeConfig,
  setCareModeEnabledForUser,
  shouldPromptCareMode,
  speakCareModeText
} from '../utils/careMode'

const showQuickPanel = ref(false)

const features = [
  {
    title: '在线挂号预约',
    desc: '选择科室与医生，预约就医时间段。',
    icon: 'Calendar',
    path: '/patient/register'
  },
  {
    title: '挂号记录',
    desc: '查看历史挂号记录、取消预约、查看就医进度。',
    icon: 'Notebook',
    path: '/patient/registers'
  },
  {
    title: '就诊记录',
    desc: '查看历史就诊记录与诊断详情。',
    icon: 'Document',
    path: '/patient/treatments'
  },
  {
    title: '处方与缴费',
    desc: '查看处方详情，完成费用缴纳。',
    icon: 'Wallet',
    path: '/patient/prescriptions'
  }
]

async function checkAndPromptCareMode() {
  try {
    const res = await checkCareModeApi()
    if (res.code !== 200 || !res.data) return

    const check = res.data
    saveCareModeRuntimeConfig(check.config)
    applyCareModeForCurrentUser(check.config)

    showQuickPanel.value =
      !!check.userId &&
      check.config.quickPanelEnabled &&
      isCareModeEnabledForUser(check.userId)

    if (!check.userId) return
    if (!shouldPromptCareMode(check.userId, check.shouldPrompt)) return

    try {
      await ElMessageBox.confirm(
        `系统检测到您的年龄为 ${check.age} 岁。是否开启关怀模式？开启后将提供更大的文字、更清晰的按钮、明显的操作提示和常用服务快捷入口。`,
        '是否开启关怀模式',
        {
          confirmButtonText: '开启关怀模式',
          cancelButtonText: '暂不开启',
          type: 'info',
          closeOnClickModal: false
        }
      )

      setCareModeEnabledForUser(true, check.userId, check.config)
      showQuickPanel.value = check.config.quickPanelEnabled
      markCareModePrompted(check.userId)
      speakCareModeText('已为您开启关怀模式，页面文字、按钮和常用入口已优化。', check.config.voiceEnabled)
      window.setTimeout(() => window.location.reload(), 5)
    } catch {
      markCareModePrompted(check.userId)
    }
  } catch {
    // 不影响患者首页正常使用
  }
}

onMounted(() => {
  checkAndPromptCareMode()
  sendTodayReminderApi().catch(() => {})
})
</script>

<template>
  <div class="page-shell patient-home">
    <CareModeQuickPanel :class="{ 'quick-panel-hidden': !showQuickPanel }" />
    <DashboardPanel />
    <HomeFeatureGrid :features="features" />
  </div>
</template>

<style scoped>
.patient-home :deep(.care-quick-panel) {
  margin-bottom: 18px;
  transition:
    opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    margin 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.patient-home :deep(.care-quick-panel.quick-panel-hidden) {
  opacity: 0;
  transform: translateY(-12px);
  max-height: 0;
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
  pointer-events: none;
}
</style>