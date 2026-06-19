<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { resetPasswordApi } from '../../api/auth'
import type { ResetPasswordForm } from '../../types'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive<ResetPasswordForm>({
  username: '',
  phone: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirm = (_rule: unknown, value: string, callback: (err?: Error) => void) => {
  if (!value) return callback(new Error('请再次输入新密码'))
  if (value !== form.newPassword) return callback(new Error('两次输入不一致'))
  callback()
}

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [{ required: true, validator: validateConfirm, trigger: 'blur' }]
}

const submit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await resetPasswordApi(form)
    if (res.code === 200) {
      ElMessage.success('密码重置成功')
      router.replace('/login')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-bg"></div>
    <div class="auth-bg-decor decor-1"></div>
    <div class="auth-bg-decor decor-2"></div>

    <div class="auth-container">
      <div class="auth-left">
        <div class="brand-mark">
          <div class="brand-icon">
            <el-icon :size="22"><Plus /></el-icon>
          </div>
          <span class="brand-name">云医院</span>
        </div>

        <h1 class="hero-title">
          找回您的<br />
          <span class="hero-accent">账号访问</span>
        </h1>
        <p class="hero-desc">Password Recovery</p>

        <div class="hero-divider"></div>

        <ul class="hero-features">
          <li>
            <span class="feat-dot"></span>
            通过账号 + 预留手机号验证身份
          </li>
          <li>
            <span class="feat-dot"></span>
            设置更安全的新密码
          </li>
          <li>
            <span class="feat-dot"></span>
            如有疑问请联系系统管理员
          </li>
        </ul>

        <div class="hero-footer">
          <span>© 2026 Cloud Hospital. 专业 · 可信赖</span>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">
          <div class="card-head">
            <div class="card-tag">RESET PASSWORD</div>
            <h2 class="card-title">重置密码</h2>
            <p class="card-sub">通过账号 + 手机号验证后设置新密码</p>
          </div>

          <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="auth-form">
            <el-form-item label="登录账号" prop="username">
              <el-input v-model="form.username" size="large" placeholder="请输入您的登录账号" />
            </el-form-item>
            <el-form-item label="预留手机号" prop="phone">
              <el-input v-model="form.phone" size="large" placeholder="请输入注册时预留的手机号" />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="form.newPassword" type="password" show-password size="large" placeholder="至少6位" />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input v-model="form.confirmPassword" type="password" show-password size="large" placeholder="请再次输入新密码" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" size="large" class="auth-btn" :loading="loading" @click="submit">
                确 认 重 置
              </el-button>
            </el-form-item>
          </el-form>

          <div class="auth-footer-link">
            <router-link to="/login">← 返回登录页面</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #f5f8fb;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.auth-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
      ellipse at 15% 20%,
      rgba(64, 158, 255, 0.12) 0%,
      transparent 55%
    ),
    radial-gradient(
      ellipse at 85% 80%,
      rgba(67, 206, 162, 0.1) 0%,
      transparent 55%
    ),
    linear-gradient(135deg, #eef5fb 0%, #f4f8f6 100%);
}

.auth-bg-decor {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.55;
  pointer-events: none;
}
.decor-1 {
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.25), transparent 70%);
  top: -120px;
  left: -120px;
}
.decor-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(67, 206, 162, 0.22), transparent 70%);
  bottom: -160px;
  right: -140px;
}

.auth-container {
  position: relative;
  z-index: 1;
  max-width: 1180px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 40px 48px;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  align-items: center;
  gap: 56px;
}

/* ========== Left: Brand / Hero ========== */
.auth-left {
  color: #1a2a3a;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px 8px 8px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 999px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.08);
}
.brand-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff 0%, #36cfc9 100%);
  color: #fff;
  box-shadow: 0 6px 14px rgba(64, 158, 255, 0.3);
}
.brand-name {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1.2px;
  color: #1f2d3d;
}

.hero-title {
  margin: 40px 0 12px;
  font-size: 44px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 1px;
  color: #1a2a3a;
}
.hero-accent {
  background: linear-gradient(135deg, #409eff 0%, #36cfc9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-desc {
  font-size: 14px;
  color: #8492a6;
  letter-spacing: 2px;
  margin: 0 0 28px;
  text-transform: uppercase;
}

.hero-divider {
  width: 48px;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, #409eff, #36cfc9);
  margin-bottom: 28px;
}

.hero-features {
  list-style: none;
  padding: 0;
  margin: 0 0 48px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.hero-features li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #4a5a6a;
  letter-spacing: 0.3px;
}
.feat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #36cfc9);
  flex-shrink: 0;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.12);
}

.hero-footer {
  font-size: 12px;
  color: #a8b3bf;
  letter-spacing: 0.5px;
}

/* ========== Right: Form Card ========== */
.auth-right {
  display: flex;
  justify-content: flex-end;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 18px;
  padding: 36px 36px 28px;
  box-shadow:
    0 20px 60px rgba(26, 42, 58, 0.12),
    0 2px 6px rgba(26, 42, 58, 0.04);
}

.card-head {
  margin-bottom: 26px;
  text-align: left;
}
.card-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 3px;
  color: #7a86ff;
  margin-bottom: 12px;
  padding: 4px 10px;
  background: rgba(122, 134, 255, 0.1);
  border-radius: 4px;
}
.card-title {
  font-size: 26px;
  font-weight: 600;
  color: #1a2a3a;
  margin: 0 0 6px;
  letter-spacing: 0.5px;
}
.card-sub {
  font-size: 13px;
  color: #8492a6;
  margin: 0;
}

/* override element-plus input look */
.auth-form :deep(.el-form-item__label) {
  font-size: 13px;
  font-weight: 500;
  color: #4a5a6a;
  letter-spacing: 0.3px;
  padding-bottom: 6px;
}
.auth-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 4px 14px;
  box-shadow: 0 0 0 1px #e5eaf1 inset;
  transition: all 0.2s ease;
  background: #fafbfc;
}
.auth-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c9d6e6 inset;
}
.auth-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1.5px #409eff inset;
  background: #fff;
}
.auth-form :deep(.el-input__inner) {
  height: 40px;
  font-size: 14px;
  color: #1f2d3d;
}
.auth-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.auth-btn {
  width: 100%;
  height: 46px;
  margin-top: 8px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 4px;
  border-radius: 10px;
  background: linear-gradient(135deg, #409eff 0%, #36cfc9 100%);
  border: none;
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.25);
  transition: all 0.25s ease;
}
.auth-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(64, 158, 255, 0.35);
}
.auth-btn:active {
  transform: translateY(0);
}

.auth-footer-link {
  text-align: center;
  font-size: 13px;
  margin-top: 4px;
}
.auth-footer-link a {
  color: #409eff;
  text-decoration: none;
  transition: color 0.2s;
}
.auth-footer-link a:hover {
  color: #36cfc9;
}

@media (max-width: 960px) {
  .auth-container {
    grid-template-columns: 1fr;
    padding: 32px 24px;
    gap: 32px;
  }
  .auth-left {
    text-align: center;
  }
  .hero-features {
    align-items: center;
  }
  .hero-divider {
    margin: 0 auto 28px;
  }
  .hero-title {
    font-size: 32px;
  }
  .auth-right {
    justify-content: center;
  }
  .hero-footer {
    display: none;
  }
}
</style>