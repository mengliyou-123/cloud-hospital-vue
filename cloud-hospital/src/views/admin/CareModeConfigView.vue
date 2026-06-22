<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getCareModeConfigApi, updateCareModeConfigApi } from '../../api/systemConfig'
import type { CareModeConfig } from '../../types'
import { getUser } from '../../utils/request'
import {
  applyCareMode,
  applyCareModeForCurrentUser,
  isCareModeEnabledForUser,
  normalizeCareConfig,
  saveCareModeRuntimeConfig,
  setCareModeEnabledForUser,
  speakCareModeText
} from '../../utils/careMode'
import { normalizeThemeKey, setTheme, themePresets, type ThemeKey } from '../../utils/theme'

const loading = ref(false)
const saving = ref(false)
const previewing = ref(false)
const currentUser = getUser()

const form = reactive<CareModeConfig>({
  enabled: true,
  ageThreshold: 65,
  voiceEnabled: true,
  highContrastEnabled: true,
  simplifyMenuEnabled: true,
  focusEnhancedEnabled: true,
  quickPanelEnabled: true,
  fontScale: 1.18,
  theme: 'mint-care'
})

const activeTheme = computed(() => normalizeThemeKey(form.theme))

const appliedForMe = computed(() =>
  currentUser?.id ? isCareModeEnabledForUser(currentUser.id) : false
)

const previewStyle = computed(() => ({
  fontSize: `${Math.round(16 * form.fontScale)}px`
}))

function syncLocalRuntime(enablePreview = previewing.value) {
  const normalized = normalizeCareConfig(form)
  Object.assign(form, normalized)
  saveCareModeRuntimeConfig(normalized)
  setTheme(normalizeThemeKey(normalized.theme))

  if (enablePreview || appliedForMe.value) {
    applyCareMode(true, normalized)
  }
}

function selectTheme(theme: ThemeKey) {
  form.theme = theme
  syncLocalRuntime(true)
  previewing.value = true
  ElMessage.success(`已切换为：${themePresets.find((item) => item.key === theme)?.name || '主题风格'}`)
}

async function loadConfig() {
  loading.value = true
  try {
    const res = await getCareModeConfigApi()
    if (res.code === 200 && res.data) {
      const normalized = normalizeCareConfig({
        ...res.data,
        theme: normalizeThemeKey(res.data.theme)
      })
      Object.assign(form, normalized)
      saveCareModeRuntimeConfig(normalized)
      if (appliedForMe.value) {
        applyCareMode(true, normalized)
      }
    }
  } finally {
    loading.value = false
  }
}

function validateForm() {
  if (form.ageThreshold < 0 || form.ageThreshold > 150) {
    ElMessage.warning('年龄阈值必须在 0 到 150 之间')
    return false
  }
  if (form.fontScale < 1.12 || form.fontScale > 1.35) {
    ElMessage.warning('字体缩放比例建议在 1.12 到 1.35 之间')
    return false
  }
  return true
}

async function submit(applyAfterSave = false) {
  if (!validateForm()) return

  saving.value = true
  try {
    const normalized = normalizeCareConfig(form)
    const res = await updateCareModeConfigApi({ ...normalized })
    if (res.code === 200) {
      Object.assign(form, normalized)
      saveCareModeRuntimeConfig(normalized)
      setTheme(normalizeThemeKey(normalized.theme))

      if (applyAfterSave) {
        if (currentUser?.id) {
          setCareModeEnabledForUser(true, currentUser.id, normalized)
        } else {
          applyCareMode(true, normalized)
        }
        previewing.value = false
        ElMessage.success('配置已保存，并已为当前账号立即开启关怀模式')
        speakCareModeText('关怀模式配置已保存并生效。', normalized.voiceEnabled)
      } else {
        if (previewing.value || appliedForMe.value) applyCareMode(true, normalized)
        ElMessage.success('关怀模式配置已保存')
      }
    }
  } finally {
    saving.value = false
  }
}

function startPreview() {
  if (!validateForm()) return
  previewing.value = true
  syncLocalRuntime(true)
  ElMessage.success('已开启本页预览，当前配置会临时应用到界面')
}

function stopPreview() {
  previewing.value = false
  applyCareModeForCurrentUser(normalizeCareConfig(form))
  ElMessage.info('已退出预览，恢复当前账号的关怀模式状态')
}

function enableForMe() {
  const normalized = normalizeCareConfig(form)
  setCareModeEnabledForUser(true, currentUser?.id, normalized)
  previewing.value = false
  ElMessage.success('已为当前账号开启关怀模式')
}

function disableForMe() {
  setCareModeEnabledForUser(false, currentUser?.id, normalizeCareConfig(form))
  previewing.value = false
  ElMessage.info('已为当前账号关闭关怀模式')
}

function resetRecommended() {
  Object.assign(form, {
    enabled: true,
    ageThreshold: 65,
    voiceEnabled: true,
    highContrastEnabled: true,
    simplifyMenuEnabled: true,
    focusEnhancedEnabled: true,
    quickPanelEnabled: true,
    fontScale: 1.18,
    theme: 'mint-care'
  })
  syncLocalRuntime(true)
  previewing.value = true
  ElMessage.success('已恢复推荐关怀配置，并开启预览')
}

onMounted(loadConfig)
</script>

<template>
  <div class="care-config-page">
    <el-alert
      type="info"
      show-icon
      :closable="false"
      class="config-note"
      title="本页配置不是摆设：保存后会写入后端配置；预览/立即应用会同步更新当前界面的主题、字号、按钮尺寸和关怀模式状态。"
    />

    <div class="content-grid">
      <el-card v-loading="loading" shadow="never" class="config-card page-card">
        <template #header>
          <div class="card-header">
            <div>
              <strong>关怀模式全局规则</strong>
              <p>面向老年患者和视力较弱用户，统一配置字体、主题、对比度、焦点与快捷入口。</p>
            </div>
            <el-tag :type="form.enabled ? 'success' : 'info'">
              {{ form.enabled ? '已启用' : '已停用' }}
            </el-tag>
          </div>
        </template>

        <el-form label-width="180px" class="config-form">
          <el-form-item label="启用关怀模式">
            <div class="field-line">
              <el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" />
              <span class="tip">停用后患者端不会自动提示开启，但管理员仍可预览配置。</span>
            </div>
          </el-form-item>

          <el-form-item label="默认提示年龄">
            <div class="field-line">
              <el-input-number v-model="form.ageThreshold" :min="0" :max="150" />
              <span class="tip">患者年龄达到该阈值时，系统在患者首页提示是否开启。</span>
            </div>
          </el-form-item>

          <el-form-item label="字体缩放比例">
            <div class="font-scale-field">
              <el-slider
                v-model="form.fontScale"
                :min="1.12"
                :max="1.35"
                :step="0.01"
                show-input
                @change="syncLocalRuntime(true)"
              />
              <div class="scale-preset-row">
                <el-button size="small" plain @click="form.fontScale = 1.16; syncLocalRuntime(true)">
                  舒适
                </el-button>
                <el-button size="small" plain @click="form.fontScale = 1.22; syncLocalRuntime(true)">
                  较大
                </el-button>
                <el-button size="small" plain @click="form.fontScale = 1.28; syncLocalRuntime(true)">
                  大字
                </el-button>
              </div>
              <span class="tip block">推荐 1.16～1.22。当前值会立即影响预览，避免再出现“开了关怀模式反而字体小”。</span>
            </div>
          </el-form-item>

          <el-form-item label="主题风格">
            <div class="theme-grid">
              <button
                v-for="theme in themePresets"
                :key="theme.key"
                type="button"
                class="theme-card"
                :class="{ active: activeTheme === theme.key }"
                @click="selectTheme(theme.key)"
              >
                <span class="theme-preview">
                  <span :style="{ background: theme.primary }"></span>
                  <span :style="{ background: theme.accent }"></span>
                  <span></span>
                </span>
                <strong>{{ theme.name }}</strong>
                <small>{{ theme.desc }}</small>
                <el-icon v-if="activeTheme === theme.key" class="theme-check"><Check /></el-icon>
              </button>
            </div>
          </el-form-item>

          <el-form-item label="增强选项">
            <div class="option-grid">
              <label class="option-card">
                <el-switch v-model="form.highContrastEnabled" @change="syncLocalRuntime(true)" />
                <span>
                  <strong>高对比度</strong>
                  <small>强化文字、边框、表格和状态标签可读性。</small>
                </span>
              </label>

              <label class="option-card">
                <el-switch v-model="form.focusEnhancedEnabled" @change="syncLocalRuntime(true)" />
                <span>
                  <strong>焦点增强</strong>
                  <small>键盘操作时显示更明显的黄色焦点环。</small>
                </span>
              </label>

              <label class="option-card">
                <el-switch v-model="form.quickPanelEnabled" @change="syncLocalRuntime(true)" />
                <span>
                  <strong>快捷服务面板</strong>
                  <small>患者端显示我要挂号、缴费、记录等高频入口。</small>
                </span>
              </label>

              <label class="option-card">
                <el-switch v-model="form.voiceEnabled" @change="syncLocalRuntime(true)" />
                <span>
                  <strong>语音提示</strong>
                  <small>使用浏览器内置语音播报关键提示。</small>
                </span>
              </label>

              <label class="option-card">
                <el-switch v-model="form.simplifyMenuEnabled" @change="syncLocalRuntime(true)" />
                <span>
                  <strong>简化菜单</strong>
                  <small>保留配置接口，后续可对患者端菜单做进一步精简。</small>
                </span>
              </label>
            </div>
          </el-form-item>

          <el-form-item>
            <div class="action-row">
              <el-button type="primary" :loading="saving" @click="submit(false)">
                保存配置
              </el-button>
              <el-button type="success" :loading="saving" @click="submit(true)">
                保存并立即应用
              </el-button>
              <el-button plain @click="startPreview">
                预览当前配置
              </el-button>
              <el-button v-if="previewing" plain @click="stopPreview">
                退出预览
              </el-button>
              <el-button plain @click="resetRecommended">
                恢复推荐配置
              </el-button>
              <el-button @click="loadConfig">
                重新加载
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <div class="side">
        <el-card shadow="never" class="preview-card page-card">
          <template #header>
            <div class="card-header compact">
              <strong>效果预览</strong>
              <el-tag v-if="previewing" type="warning">预览中</el-tag>
            </div>
          </template>

          <div class="preview-box" :style="previewStyle">
            <div class="preview-title">患者服务中心</div>
            <div class="preview-sub">更大字号、清晰按钮、明确下一步</div>
            <div class="preview-actions">
              <button>我要挂号</button>
              <button>处方缴费</button>
            </div>
            <div class="preview-status">
              <span>待缴费</span>
              <span>待取药</span>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="state-card page-card">
          <template #header>当前账号状态</template>
          <div class="state-row">
            <span>关怀模式</span>
            <el-tag :type="appliedForMe ? 'success' : 'info'">
              {{ appliedForMe ? '当前账号已开启' : '当前账号未开启' }}
            </el-tag>
          </div>
          <div class="state-row">
            <span>当前主题</span>
            <strong>{{ themePresets.find((item) => item.key === activeTheme)?.name }}</strong>
          </div>
          <div class="state-actions">
            <el-button type="primary" @click="enableForMe">为当前账号开启</el-button>
            <el-button @click="disableForMe">为当前账号关闭</el-button>
          </div>
        </el-card>

        <el-card shadow="never" class="desc-card page-card">
          <template #header>闭环说明</template>
          <p>顶部主题切换用于当前用户快速切换；本页主题风格用于关怀模式默认配置。二者现在使用同一套主题变量，因此在本页选择主题会立即同步到顶部和全站。</p>
          <p>保存配置会写入后端；预览当前配置只影响当前浏览器；保存并立即应用会同时保存配置、开启当前账号关怀模式并应用全局主题。</p>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.care-config-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-note {
  border-radius: var(--h-radius-md);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  align-items: start;
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.card-header strong {
  color: var(--h-text);
  font-size: 17px;
}

.card-header p {
  margin: 6px 0 0;
  color: var(--h-text-tertiary);
  font-size: 13px;
  line-height: 1.6;
}

.card-header.compact strong {
  font-size: 16px;
}

.config-form {
  max-width: 900px;
}

.field-line {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
}

.tip {
  color: var(--h-text-tertiary);
  font-size: 13px;
  line-height: 1.6;
}

.tip.block {
  display: block;
  margin-top: 8px;
}

.font-scale-field {
  width: min(620px, 100%);
}

.scale-preset-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  width: 100%;
}

.theme-card {
  position: relative;
  min-height: 138px;
  padding: 16px;
  border-radius: var(--h-radius-md);
  border: 1.5px solid var(--h-border);
  background: var(--h-card);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 8px;
  cursor: pointer;
  transition: all var(--h-transition);
}

.theme-card:hover,
.theme-card.active {
  border-color: var(--h-primary);
  background: linear-gradient(135deg, #ffffff, var(--h-primary-bg));
  box-shadow: var(--h-shadow-sm);
}

.theme-preview {
  display: flex;
  align-items: center;
  gap: 6px;
}

.theme-preview span {
  width: 28px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid var(--h-border);
}

.theme-preview span:nth-child(3) {
  background: var(--h-bg-soft);
}

.theme-card strong {
  color: var(--h-text);
  font-size: 15px;
}

.theme-card small {
  color: var(--h-text-tertiary);
  font-size: 12px;
  line-height: 1.5;
}

.theme-check {
  position: absolute;
  top: 12px;
  right: 12px;
  color: var(--h-primary);
  font-size: 20px;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  width: 100%;
}

.option-card {
  min-height: 92px;
  padding: 14px;
  border-radius: var(--h-radius-md);
  border: 1px solid var(--h-border);
  background: var(--h-card);
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.option-card strong {
  display: block;
  color: var(--h-text);
  font-size: 14px;
}

.option-card small {
  display: block;
  margin-top: 5px;
  color: var(--h-text-tertiary);
  font-size: 12px;
  line-height: 1.5;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-box {
  border-radius: var(--h-radius-md);
  padding: 18px;
  background: linear-gradient(180deg, #ffffff, var(--h-primary-bg));
  border: 1.5px solid var(--h-primary-border);
}

.preview-title {
  font-size: 1.22em;
  font-weight: 900;
  color: var(--h-text);
}

.preview-sub {
  margin-top: 6px;
  color: var(--h-text-tertiary);
  font-size: 0.95em;
}

.preview-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.preview-actions button {
  min-height: 46px;
  border: 0;
  border-radius: 13px;
  padding: 10px 16px;
  background: var(--h-primary);
  color: #fff;
  font-weight: 850;
  cursor: pointer;
}

.preview-actions button:nth-child(2) {
  background: var(--h-accent);
}

.preview-status {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.preview-status span {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  color: var(--h-warning);
  background: var(--h-warning-bg);
  font-weight: 850;
  border: 1px solid #fed7aa;
}

.state-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--h-border);
}

.state-row span {
  color: var(--h-text-tertiary);
}

.state-row strong {
  color: var(--h-text);
}

.state-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.desc-card p {
  color: var(--h-text-tertiary);
  line-height: 1.8;
  margin: 0 0 10px;
}

@media (max-width: 1100px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .field-line,
  .action-row,
  .state-actions {
    align-items: stretch;
  }

  .action-row .el-button,
  .state-actions .el-button {
    width: 100%;
  }
}
</style>