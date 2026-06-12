<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { profileApi, profileUpdateApi, profilePatientUpdateApi } from '../../api/common'
import { changePasswordApi } from '../../api/auth'
import { getUser, saveUser } from '../../utils/request'
import type { LoginUser, ChangePasswordForm } from '../../types'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref<LoginUser | null>(null)
const activeTab = ref('base')
const loading = ref(false)
const profile = ref<Record<string, any>>({})

const baseForm = reactive({
  realName: '',
  phone: '',
  idCard: ''
})

const baseRules: FormRules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

const patientForm = reactive({
  age: undefined as number | undefined,
  gender: 1,
  address: '',
  pastMedical: ''
})

const pwdFormRef = ref<FormInstance>()
const pwdVisible = ref(false)
const pwdLoading = ref(false)
const pwdForm = reactive<ChangePasswordForm>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    {
      required: true,
      validator: (_r, v, cb) => {
        if (!v) return cb(new Error('请再次输入新密码'))
        if (v !== pwdForm.newPassword) return cb(new Error('两次输入不一致'))
        cb()
      },
      trigger: 'blur'
    }
  ]
}

async function loadProfile() {
  loading.value = true
  try {
    const res = await profileApi()
    if (res.code === 200) {
      profile.value = res.data || {}
      baseForm.realName = res.data.realName || ''
      baseForm.phone = res.data.phone || ''
      baseForm.idCard = res.data.idCard || ''
      if (res.data.roleCode === 'patient') {
        patientForm.age = res.data.age
        patientForm.gender = res.data.gender ?? 1
        patientForm.address = res.data.address || ''
        patientForm.pastMedical = res.data.pastMedical || ''
      }
    }
  } finally {
    loading.value = false
  }
}

async function submitBase() {
  const res = await profileUpdateApi({
    realName: baseForm.realName,
    phone: baseForm.phone,
    idCard: baseForm.idCard
  })
  if (res.code === 200) {
    ElMessage.success('基础资料已更新')
    const local = getUser()
    if (local) {
      local.realName = baseForm.realName
      saveUser(local)
    }
    loadProfile()
  }
}

async function submitPatient() {
  const res = await profilePatientUpdateApi({
    age: patientForm.age,
    gender: patientForm.gender,
    address: patientForm.address,
    pastMedical: patientForm.pastMedical
  })
  if (res.code === 200) {
    ElMessage.success('患者档案已更新')
    loadProfile()
  }
}

function openPwd() {
  pwdVisible.value = true
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
}

async function submitPwd() {
  if (!pwdFormRef.value) return
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return
  pwdLoading.value = true
  try {
    const res = await changePasswordApi(pwdForm)
    if (res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      pwdVisible.value = false
      localStorage.removeItem('loginUser')
      router.replace('/login')
    }
  } finally {
    pwdLoading.value = false
  }
}

onMounted(() => {
  user.value = getUser()
  loadProfile()
})

function goBack() {
  const u = getUser()
  if (u && u.roleCode) {
    const map: Record<string, string> = {
      patient: '/patient/home',
      doctor: '/doctor/home',
      drug_admin: '/drug-admin/home',
      finance_admin: '/finance-admin/home',
      super_admin: '/super-admin/home'
    }
    router.push(map[u.roleCode] || '/login')
  } else {
    router.back()
  }
}
</script>

<template>
  <div class="profile-page">
    <div class="container">
      <div class="topbar">
        <el-button link @click="goBack">返回首页</el-button>
        <h2>个人中心</h2>
        <div></div>
      </div>

      <el-card v-loading="loading" shadow="never" class="card">
        <template #header>
          <div class="card-head">
            <el-avatar :size="48" style="background:#409eff">{{
              profile.realName?.charAt(0) || user?.realName?.charAt(0) || 'U'
            }}</el-avatar>
            <div>
              <div class="name">{{ profile.realName || user?.realName || '---' }}</div>
              <div class="sub">
                账号：{{ profile.username || user?.username }}
                <el-tag size="small" type="success" style="margin-left:8px">{{
                  profile.roleName || user?.roleName
                }}</el-tag>
              </div>
            </div>
          </div>
        </template>

        <el-tabs v-model="activeTab">
          <el-tab-pane label="基础资料" name="base">
            <el-form
              :model="baseForm"
              :rules="baseRules"
              label-width="96px"
              class="profile-form"
            >
              <el-form-item label="真实姓名" prop="realName">
                <el-input v-model="baseForm.realName" placeholder="请输入真实姓名" />
              </el-form-item>
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="baseForm.phone" placeholder="请输入手机号" />
              </el-form-item>
              <el-form-item label="身份证号">
                <el-input v-model="baseForm.idCard" placeholder="选填" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitBase">保存修改</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane v-if="profile.roleCode === 'patient'" label="患者档案" name="patient">
            <el-form label-width="96px" class="profile-form">
              <el-form-item label="年龄">
                <el-input-number
                  v-model="patientForm.age"
                  :min="0"
                  :max="150"
                  placeholder="请输入年龄"
                />
              </el-form-item>
              <el-form-item label="性别">
                <el-radio-group v-model="patientForm.gender">
                  <el-radio :value="1">男</el-radio>
                  <el-radio :value="2">女</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="住址">
                <el-input v-model="patientForm.address" placeholder="请输入住址" />
              </el-form-item>
              <el-form-item label="既往病史">
                <el-input
                  v-model="patientForm.pastMedical"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入既往病史（选填）"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="submitPatient">保存档案</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="修改密码" name="pwd">
            <el-form
              ref="pwdFormRef"
              :model="pwdForm"
              :rules="pwdRules"
              label-width="96px"
              class="profile-form"
            >
              <el-form-item label="原密码" prop="oldPassword">
                <el-input v-model="pwdForm.oldPassword" type="password" show-password />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="pwdForm.newPassword" type="password" show-password />
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="pwdLoading" @click="submitPwd">提交修改</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f4f6fb;
  padding: 24px 12px;
  box-sizing: border-box;
}
.container {
  max-width: 1000px;
  margin: 0 auto;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.topbar h2 {
  margin: 0;
  font-size: 20px;
  color: #1f2d3d;
}
.card {
  border-radius: 8px;
}
.card-head {
  display: flex;
  align-items: center;
  gap: 14px;
}
.card-head .name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
}
.card-head .sub {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}
.profile-form {
  max-width: 560px;
  padding-top: 16px;
}
</style>
