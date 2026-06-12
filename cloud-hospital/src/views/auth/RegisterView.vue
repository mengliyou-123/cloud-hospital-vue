<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { registerApi } from '../../api/auth'
import type { RegisterForm } from '../../types'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive<RegisterForm>({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  phone: '',
  idCard: '',
  age: null,
  gender: 0
})

const validateConfirm = (_rule: unknown, value: string, callback: (err?: Error) => void) => {
  if (!value) return callback(new Error('请再次输入密码'))
  if (value !== form.password) return callback(new Error('两次密码不一致'))
  callback()
}

const rules: FormRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '账号长度3-20位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度6-32位', trigger: 'blur' }
  ],
  confirmPassword: [{ required: true, validator: validateConfirm, trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  idCard: [
    { pattern: /^(\d{15}|\d{17}[\dXx])?$/, message: '身份证号格式不正确', trigger: 'blur' }
  ]
}

const submit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await registerApi(form)
    if (res.code === 200) {
      ElMessage.success('注册成功，请使用账号密码登录')
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
        <el-icon :size="26" color="#409eff"><UserFilled /></el-icon>
        <div class="title">患者注册</div>
      </div>
      <div class="subtitle">仅开放患者自主注册，内部员工请联系系统管理员</div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="form">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="登录账号" prop="username">
              <el-input v-model="form.username" placeholder="3-20位英文字母/数字" size="large" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="form.realName" placeholder="请输入真实姓名" size="large" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" type="password" show-password size="large" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="form.confirmPassword" type="password" show-password size="large" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入11位手机号" size="large" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号" prop="idCard">
              <el-input v-model="form.idCard" placeholder="选填" size="large" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="性别">
              <el-radio-group v-model="form.gender" size="large">
                <el-radio :value="0">女</el-radio>
                <el-radio :value="1">男</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄">
              <el-input-number v-model="form.age" :min="0" :max="150" size="large" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" size="large" class="btn" :loading="loading" @click="submit">
            确认注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="footer">
        已有账号？<router-link to="/login">返回登录</router-link>
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
  background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%);
  padding: 24px 16px;
}
.card {
  width: 100%;
  max-width: 620px;
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
.form {
  margin-top: 8px;
}
.btn {
  width: 100%;
}
.footer {
  text-align: center;
  font-size: 13px;
  color: #606266;
  margin-top: 8px;
}
.footer a {
  color: #409eff;
}
</style>
