<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCareModeConfigApi, updateCareModeConfigApi } from '../../api/systemConfig'
import type { CareModeConfig } from '../../types'

const router = useRouter()
const loading = ref(false)
const saving = ref(false)

const form = reactive<CareModeConfig>({
  enabled: true,
  ageThreshold: 65,
  voiceEnabled: true,
  highContrastEnabled: true,
  simplifyMenuEnabled: true,
  focusEnhancedEnabled: true,
  quickPanelEnabled: true,
  fontScale: 1.12,
  theme: 'warm'
})

async function loadConfig() {
  loading.value = true
  try {
    const res = await getCareModeConfigApi()
    if (res.code === 200 && res.data) {
      Object.assign(form, res.data)
    }
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (form.ageThreshold < 0 || form.ageThreshold > 150) {
    ElMessage.warning('年龄阈值必须在 0 到 150 之间')
    return
  }
  if (form.fontScale < 1 || form.fontScale > 1.35) {
    ElMessage.warning('字体缩放比例必须在 1.00 到 1.35 之间')
    return
  }

  saving.value = true
  try {
    const res = await updateCareModeConfigApi({ ...form })
    if (res.code === 200) {
      ElMessage.success('关怀模式配置已保存')
      await loadConfig()
    }
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push('/super-admin/home')
}

onMounted(loadConfig)
</script>

<template>
  <div class="care-config-page">
    <div class="page-inner">
      <div class="page-header">
        <div>
          <div class="breadcrumb">系统管理 / 服务体验增强</div>
          <h2>关怀模式配置</h2>
          <p>
            面向老年患者和视力较弱用户，提供更清晰的阅读体验、更大的操作目标、更明显的状态提示和常用服务快捷入口。
          </p>
        </div>
        <el-button @click="goBack">
          <el-icon><Back /></el-icon>
          返回管理中心
        </el-button>
      </div>

      <div class="content-grid">
        <el-card v-loading="loading" shadow="never" class="config-card">
          <template #header>
            <div class="card-header">
              <span>长者友好服务规则</span>
              <el-tag type="success">可配置</el-tag>
            </div>
          </template>

          <el-form label-width="190px" class="config-form">
            <el-form-item label="启用关怀模式">
              <el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" />
              <div class="tip">停用后患者端不会自动提示开启关怀模式。</div>
            </el-form-item>

            <el-form-item label="默认提示年龄阈值">
              <el-input-number v-model="form.ageThreshold" :min="0" :max="150" />
              <div class="tip">患者年龄达到该阈值时，系统将在患者首页提示是否开启。</div>
            </el-form-item>

            <el-form-item label="字体缩放比例">
              <el-slider
                v-model="form.fontScale"
                :min="1"
                :max="1.35"
                :step="0.01"
                show-input
                style="max-width: 420px"
              />
              <div class="tip">建议设置在 1.08～1.20，避免页面过度放大导致布局拥挤。</div>
            </el-form-item>

            <el-form-item label="启用高对比度">
              <el-switch v-model="form.highContrastEnabled" active-text="启用" inactive-text="停用" />
              <div class="tip">提高文字、按钮、表格、状态标签的可读性。</div>
            </el-form-item>

            <el-form-item label="启用焦点增强">
              <el-switch v-model="form.focusEnhancedEnabled" active-text="启用" inactive-text="停用" />
              <div class="tip">让键盘操作和输入框聚焦时更容易被看到。</div>
            </el-form-item>

            <el-form-item label="启用快捷服务面板">
              <el-switch v-model="form.quickPanelEnabled" active-text="启用" inactive-text="停用" />
              <div class="tip">患者端显示“我要挂号、处方缴费、就诊记录”等高频入口。</div>
            </el-form-item>

            <el-form-item label="启用语音提示">
              <el-switch v-model="form.voiceEnabled" active-text="启用" inactive-text="停用" />
              <div class="tip">使用浏览器内置语音能力播报关键提示，不接入第三方服务。</div>
            </el-form-item>

            <el-form-item label="主题风格">
              <el-select v-model="form.theme" style="width: 220px">
                <el-option label="温和医疗蓝绿" value="warm" />
              </el-select>
              <div class="tip">保留接口，后续可扩展深色高对比、黑白高对比等主题。</div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="saving" @click="submit">保存配置</el-button>
              <el-button @click="loadConfig">重新加载</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <div class="side">
          <el-card shadow="never" class="preview-card">
            <template #header>效果预览</template>
            <div class="preview-box">
              <div class="preview-title">患者服务中心</div>
              <div class="preview-sub">大字号、清晰按钮、重点入口</div>
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

          <el-card shadow="never" class="desc-card">
            <template #header>设计说明</template>
            <p>
              本功能采用“系统统一配置 + 用户自主开启”的方式。系统管理员设置默认规则，患者可以手动开启或关闭；
              开启状态按用户账号保存，不会影响其他账号。
            </p>
            <p>
              当前版本不改变原有业务流程，只优化患者端可读性、操作便捷性和常用入口展示。
            </p>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.care-config-page {
  min-height: 100vh;
  background: #f4f6fb;
  padding: 28px;
}

.page-inner {
  max-width: 1180px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 18px;
}

.breadcrumb {
  color: #8492a6;
  font-size: 13px;
  margin-bottom: 6px;
}

.page-header h2 {
  margin: 0;
  color: #1f2d3d;
  font-size: 26px;
}

.page-header p {
  margin: 8px 0 0;
  color: #606266;
  line-height: 1.8;
  max-width: 760px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 18px;
}

.config-card,
.preview-card,
.desc-card {
  border-radius: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-form {
  max-width: 780px;
}

.tip {
  margin-left: 12px;
  color: #8492a6;
  font-size: 13px;
  line-height: 1.6;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.preview-box {
  border-radius: 16px;
  padding: 18px;
  background: linear-gradient(180deg, #ffffff, #eef7ff);
  border: 1px solid #b9d6f2;
}

.preview-title {
  font-size: calc(22px * v-bind('form.fontScale'));
  font-weight: 800;
  color: #102a43;
}

.preview-sub {
  margin-top: 6px;
  color: #334e68;
  font-size: calc(15px * v-bind('form.fontScale'));
}

.preview-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

.preview-actions button {
  min-height: 44px;
  border: 0;
  border-radius: 12px;
  padding: 10px 16px;
  background: #1677ff;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.preview-status {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.preview-status span {
  display: inline-flex;
  align-items: center;
  border-radius: 12px;
  padding: 6px 10px;
  color: #ad5f00;
  background: #fff6e6;
  font-weight: 700;
}

.desc-card p {
  color: #606266;
  line-height: 1.8;
}

@media (max-width: 980px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>