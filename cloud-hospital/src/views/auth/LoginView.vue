<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { loginApi } from '../../api/auth'
import { saveUser } from '../../utils/request'
import { getHomeByUser } from '../../router'
import type { LoginForm, LoginUser } from '../../types'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive<LoginForm>({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const submit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await loginApi({
      username: form.username.trim(),
      password: form.password
    })
    if (res.code === 200 && res.data) {
      const user: LoginUser = res.data
      saveUser(user)
      router.replace(getHomeByUser(user))
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="brand">
        <el-icon :size="28" color="#409eff"><Hospital /></el-icon>
        <div>
          <div class="title">云医院信息管理系统</div>
          <div class="subtitle">Cloud Hospital Information System</div>
        </div>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="login-form">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入账号" size="large" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
            size="large"
            @keyup.enter="submit"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="btn-login" :loading="loading" @click="submit">
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="links">
        <router-link to="/register">注册新账号</router-link>
        <span class="divider">|</span>
        <router-link to="/reset-password">忘记密码？</router-link>
      </div>

      <div class="tip">
        <el-icon><InfoFilled /></el-icon>
        <span>内部员工账号由系统管理员统一创建，不开放自主注册。</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e88e5 0%, #43cea2 100%);
  padding: 20px;
}
.login-card {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border-radius: 12px;
  padding: 32px 36px 28px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2d3d;
}
.subtitle {
  font-size: 12px;
  color: #8492a6;
  letter-spacing: 0.5px;
}
.btn-login {
  width: 100%;
}
.links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  color: #409eff;
  font-size: 13px;
  margin-bottom: 18px;
}
.divider {
  color: #c0c4cc;
}
.tip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f4f9ff;
  color: #5b8def;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
}
</style>
