export type ThemeKey =
  | 'medical-blue'
  | 'mint-care'
  | 'warm-amber'
  | 'violet-power'
  | 'sky-teal'
  | 'graphite-slate'
  | 'midnight-dark'

export const DARK_THEME_KEYS: ThemeKey[] = ['midnight-dark']

export function isDarkTheme(theme: ThemeKey | string): boolean {
  return DARK_THEME_KEYS.includes(normalizeThemeKey(theme))
}

export interface ThemePreset {
  key: ThemeKey
  name: string
  desc: string
  primary: string
  accent: string
}

const THEME_STORAGE_KEY = 'cloud_hospital_ui_theme'

export const themePresets: ThemePreset[] = [
  {
    key: 'medical-blue',
    name: '温和医疗蓝',
    desc: '默认主题，稳重清晰，适合医院 HIS 主体界面。',
    primary: '#2563eb',
    accent: '#0f766e'
  },
  {
    key: 'mint-care',
    name: '清润关怀绿',
    desc: '更柔和亲近，适合患者端与关怀模式。',
    primary: '#0f766e',
    accent: '#2563eb'
  },
  {
    key: 'warm-amber',
    name: '暖阳金',
    desc: '温暖亲和，适合门诊导诊和前台界面。',
    primary: '#d97706',
    accent: '#0891b2'
  },
  {
    key: 'violet-power',
    name: '活力紫',
    desc: '现代科技感，适合统计分析和创新医疗。',
    primary: '#7c3aed',
    accent: '#db2777'
  },
  {
    key: 'sky-teal',
    name: '清爽松石',
    desc: '干净清爽，适合所有业务场景都可用。',
    primary: '#0284c7',
    accent: '#10b981'
  },
  {
    key: 'graphite-slate',
    name: '石墨灰',
    desc: '中性专业，适合数据密集型的管理工作台。',
    primary: '#475569',
    accent: '#0ea5e9'
  },
  {
    key: 'midnight-dark',
    name: '午夜黑夜',
    desc: '护眼深色模式，适合夜间使用和深色偏好。',
    primary: '#60a5fa',
    accent: '#22d3ee'
  }
]

export function normalizeThemeKey(value?: string | null): ThemeKey {
  if (value === 'medical-blue' || value === 'warm' || value === 'blue-green' || value === 'classic-blue' || value === 'blue' || value === 'admin-blue') return 'medical-blue'
  if (value === 'mint-care' || value === 'green' || value === 'care-green') return 'mint-care'
  if (value === 'warm-amber' || value === 'amber' || value === 'orange' || value === 'gold') return 'warm-amber'
  if (value === 'violet-power' || value === 'violet' || value === 'purple' || value === 'magenta') return 'violet-power'
  if (value === 'sky-teal' || value === 'teal' || value === 'sky-blue' || value === 'sky') return 'sky-teal'
  if (value === 'graphite-slate' || value === 'slate' || value === 'gray' || value === 'graphite') return 'graphite-slate'
  if (value === 'midnight-dark' || value === 'dark' || value === 'night' || value === 'black') return 'midnight-dark'
  return 'medical-blue'
}

export function getTheme(): ThemeKey {
  return normalizeThemeKey(localStorage.getItem(THEME_STORAGE_KEY))
}

export function applyTheme(theme: ThemeKey | string) {
  const nextTheme = normalizeThemeKey(theme)
  document.documentElement.dataset.theme = nextTheme
  document.documentElement.style.colorScheme = isDarkTheme(nextTheme) ? 'dark' : 'light'
}

export function setTheme(theme: ThemeKey | string) {
  const nextTheme = normalizeThemeKey(theme)
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  applyTheme(nextTheme)
  window.dispatchEvent(new CustomEvent('cloud-hospital-theme-change', { detail: nextTheme }))
}

export function initTheme() {
  applyTheme(getTheme())
}

export function getThemePreset(theme: ThemeKey | string = getTheme()): ThemePreset {
  const normalized = normalizeThemeKey(theme)
  return themePresets.find((item) => item.key === normalized) || themePresets[0]
}
