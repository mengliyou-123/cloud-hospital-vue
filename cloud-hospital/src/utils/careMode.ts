import type { CareModeConfig, LoginUser } from '../types'

const CARE_MODE_ENABLED_PREFIX = 'cloud_hospital_care_mode_enabled_user_'
const CARE_MODE_PROMPT_PREFIX = 'cloud_hospital_care_mode_prompted_user_'
const CARE_MODE_CONFIG_KEY = 'cloud_hospital_care_mode_runtime_config'

const DEFAULT_CONFIG: CareModeConfig = {
  enabled: true,
  ageThreshold: 65,
  voiceEnabled: true,
  highContrastEnabled: true,
  simplifyMenuEnabled: true,
  focusEnhancedEnabled: true,
  quickPanelEnabled: true,
  fontScale: 1.12,
  theme: 'warm'
}

function getStoredUser(): LoginUser | null {
  const raw = localStorage.getItem('loginUser')
  if (!raw) return null
  try {
    return JSON.parse(raw) as LoginUser
  } catch {
    return null
  }
}

function userKey(prefix: string, userId?: number | string | null): string {
  const id = userId ?? getStoredUser()?.id ?? 'anonymous'
  return `${prefix}${id}`
}

export function normalizeCareConfig(config?: Partial<CareModeConfig> | null): CareModeConfig {
  return {
    ...DEFAULT_CONFIG,
    ...(config || {}),
    fontScale:
      typeof config?.fontScale === 'number' && config.fontScale >= 1
        ? config.fontScale
        : DEFAULT_CONFIG.fontScale,
    theme: config?.theme || DEFAULT_CONFIG.theme
  }
}

export function saveCareModeRuntimeConfig(config: CareModeConfig) {
  localStorage.setItem(CARE_MODE_CONFIG_KEY, JSON.stringify(normalizeCareConfig(config)))
}

export function getCareModeRuntimeConfig(): CareModeConfig {
  const raw = localStorage.getItem(CARE_MODE_CONFIG_KEY)
  if (!raw) return DEFAULT_CONFIG
  try {
    return normalizeCareConfig(JSON.parse(raw))
  } catch {
    return DEFAULT_CONFIG
  }
}

export function isCareModeEnabledForUser(userId?: number | string | null): boolean {
  return localStorage.getItem(userKey(CARE_MODE_ENABLED_PREFIX, userId)) === '1'
}

export function setCareModeEnabledForUser(
  enabled: boolean,
  userId?: number | string | null,
  config?: CareModeConfig | null
) {
  localStorage.setItem(userKey(CARE_MODE_ENABLED_PREFIX, userId), enabled ? '1' : '0')
  if (config) saveCareModeRuntimeConfig(config)
  applyCareMode(enabled, config || getCareModeRuntimeConfig())
}

export function hasPromptedCareMode(userId?: number | string | null): boolean {
  return localStorage.getItem(userKey(CARE_MODE_PROMPT_PREFIX, userId)) === '1'
}

export function markCareModePrompted(userId?: number | string | null) {
  localStorage.setItem(userKey(CARE_MODE_PROMPT_PREFIX, userId), '1')
}

export function applyCareMode(enabled: boolean, config?: CareModeConfig | null) {
  const finalConfig = normalizeCareConfig(config || getCareModeRuntimeConfig())
  const body = document.body
  const html = document.documentElement

  /* 添加过渡标记，让所有属性平滑变化 */
  html.classList.add('care-mode-transitioning')

  body.classList.toggle('care-mode', enabled)
  body.dataset.careMode = enabled ? 'true' : 'false'
  body.dataset.careTheme = finalConfig.theme
  body.dataset.careHighContrast = String(finalConfig.highContrastEnabled)
  body.dataset.careSimplify = String(finalConfig.simplifyMenuEnabled)
  body.dataset.careFocus = String(finalConfig.focusEnhancedEnabled)
  body.style.setProperty('--care-font-scale', String(finalConfig.fontScale))

  /* 过渡完成后移除标记（400ms > 350ms transition duration） */
  window.setTimeout(() => {
    html.classList.remove('care-mode-transitioning')
  }, 400)
}

export function applyCareModeForCurrentUser(config?: CareModeConfig | null) {
  const user = getStoredUser()
  if (!user) {
    clearCareModeRuntime()
    return
  }
  applyCareMode(isCareModeEnabledForUser(user.id), config || getCareModeRuntimeConfig())
}

export function clearCareModeRuntime() {
  document.body.classList.remove('care-mode')
  document.body.dataset.careMode = 'false'
  document.body.removeAttribute('data-care-theme')
  document.body.removeAttribute('data-care-high-contrast')
  document.body.removeAttribute('data-care-simplify')
  document.body.removeAttribute('data-care-focus')
  document.body.style.removeProperty('--care-font-scale')
}

export function shouldPromptCareMode(
  userId: number | string,
  shouldPromptFromServer: boolean
): boolean {
  if (!shouldPromptFromServer) return false
  if (isCareModeEnabledForUser(userId)) return false
  return !hasPromptedCareMode(userId)
}

export function speakCareModeText(text: string, enabled: boolean) {
  if (!enabled) return
  if (!('speechSynthesis' in window)) return

  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.92
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  } catch {
    // 不支持语音时静默降级
  }
}