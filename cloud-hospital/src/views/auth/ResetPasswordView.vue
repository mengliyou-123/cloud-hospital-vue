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
  <div class="page-wrapper">
    <div class="card">
      <div class="brand">
        <el-icon :size="26" color="#409eff"><Key /></el-icon>
        <div class="title">找回密码</div>
      </div>
      <div class="subtitle">通过账号 + 手机号验证后重置密码</div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="form">
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="form.username" size="large" />
        </el-form-item>
        <el-form-item label="预留手机号" prop="phone">
          <el-input v-model="form.phone" size="large" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="form.newPassword" type="password" show-password size="large" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password size="large" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" class="btn" :loading="loading" @click="submit">
            重置密码
          </el-button>
        </el-form-item>
      </el-form>

      <div class="footer">
        <router-link to="/login">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}
.card {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 12px;
  padding: 28px 32px 24px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2d3d;
}
.subtitle {
  color: #8492a6;
  font-size: 13px;
  margin: 6px 0 16px;
}
.btn {
  width: 100%;
}
.footer {
  text-align: center;
  font-size: 13px;
}
.footer a {
  color: #409eff;
}
</style>
