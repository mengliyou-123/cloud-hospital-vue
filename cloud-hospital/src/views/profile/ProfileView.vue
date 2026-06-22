<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { profileApi, profileUpdateApi, profilePatientUpdateApi, profileDoctorUpdateApi } from '../../api/common'
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

const doctorForm = reactive({
  title: '',
  skill: '',
  workStatus: 1
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
        activeTab.value = 'patient'
      }
      if (res.data.roleCode === 'doctor') {
        doctorForm.title = res.data.doctorTitle || ''
        doctorForm.skill = res.data.doctorSkill || ''
        doctorForm.workStatus = res.data.doctorWorkStatus ?? 1
        activeTab.value = 'doctor'
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

async function submitDoctor() {
  const res = await profileDoctorUpdateApi({
    title: doctorForm.title,
    skill: doctorForm.skill,
    workStatus: doctorForm.workStatus
  })
  if (res.code === 200) {
    ElMessage.success('医生信息已更新')
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
  <div class="page-shell profile-page">
    <div class="page-toolbar">
      <div class="toolbar-left">
        <el-button text @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回首页</span>
        </el-button>
      </div>
      <div class="toolbar-right"></div>
    </div>

    <div class="page-card profile-card" v-loading="loading">
      <!-- 用户信息头部 -->
      <div class="profile-banner">
        <div class="banner-bg"></div>
        <div class="banner-content">
          <div class="profile-avatar">
            <el-avatar :size="80" class="avatar">
              {{ profile.realName?.charAt(0) || user?.realName?.charAt(0) || 'U' }}
            </el-avatar>
          </div>
          <div class="profile-info">
            <h2 class="profile-name">{{ profile.realName || user?.realName || '---' }}</h2>
            <div class="profile-meta">
              <span class="meta-item">
                <el-icon><User /></el-icon>
                账号：{{ profile.username || user?.username }}
              </span>
              <el-tag size="small" type="success" effect="dark" round>
                {{ profile.roleName || user?.roleName }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签页 -->
      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="基础资料" name="base">
          <el-form :model="baseForm" :rules="baseRules" label-width="110px" class="profile-form">
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
              <el-button type="primary" @click="submitBase" class="save-btn">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane v-if="profile.roleCode === 'patient'" label="患者档案" name="patient">
          <el-form label-width="110px" class="profile-form">
            <el-form-item label="年龄">
              <el-input-number v-model="patientForm.age" :min="0" :max="150" placeholder="请输入年龄" />
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
              <el-input v-model="patientForm.pastMedical" type="textarea" :rows="3" placeholder="请输入既往病史（选填）" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitPatient" class="save-btn">保存档案</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane v-if="profile.roleCode === 'doctor'" label="医生信息" name="doctor">
          <el-form label-width="110px" class="profile-form">
            <el-form-item label="职称">
              <el-input v-model="doctorForm.title" placeholder="请输入职称，如：主治医师、副主任医师等" />
            </el-form-item>
            <el-form-item label="专业技能">
              <el-input v-model="doctorForm.skill" type="textarea" :rows="3" placeholder="请输入专业技能" />
            </el-form-item>
            <el-form-item label="在岗状态">
              <el-radio-group v-model="doctorForm.workStatus">
                <el-radio :value="1">在岗</el-radio>
                <el-radio :value="0">请假</el-radio>
                <el-radio :value="2">离岗</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="所属科室">
              <el-tag v-if="profile.doctorDeptName" type="success">{{ profile.doctorDeptName }}</el-tag>
              <el-tag v-else type="info">未分配科室，请联系管理员分配</el-tag>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitDoctor" class="save-btn">保存信息</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="修改密码" name="pwd">
          <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="110px" class="profile-form">
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
              <el-button type="primary" :loading="pwdLoading" @click="submitPwd" class="save-btn">提交修改</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back-btn {
  color: var(--h-text-secondary);
  transition: all 0.25s ease;
}

.back-btn:hover {
  color: var(--h-primary);
}

.profile-card {
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
}

/* ========== 用户信息横幅 ========== */
.profile-banner {
  position: relative;
  overflow: hidden;
}

.banner-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 120%, rgba(147, 197, 253, 0.4), transparent 55%),
    radial-gradient(circle at 85% 20%, rgba(125, 211, 252, 0.35), transparent 50%),
    linear-gradient(135deg, #60a5fa 0%, #3b82f6 40%, #0ea5e9 100%);
}

.banner-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 40px 36px 34px;
}

.profile-avatar {
  flex-shrink: 0;
}

.avatar {
  background: linear-gradient(135deg, var(--h-primary-bg), var(--h-accent-bg)) !important;
  color: var(--h-primary) !important;
  font-weight: 800;
  font-size: 30px;
  box-shadow:
    0 4px 16px rgba(59, 130, 246, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.3);
  border: 3px solid rgba(255, 255, 255, 0.4);
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 10px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  letter-spacing: 0.02em;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 500;
}

.meta-item .el-icon {
  opacity: 0.85;
}

/* ========== 标签页 ========== */
.profile-tabs {
  padding: 0 32px;
}

.profile-tabs :deep(.el-tabs__header) {
  margin-bottom: 28px;
}

.profile-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: var(--h-border);
}

.profile-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 600;
  color: var(--h-text-tertiary);
  height: 48px;
  line-height: 48px;
  padding: 0 20px;
  transition: all 0.25s ease;
}

.profile-tabs :deep(.el-tabs__item.is-active) {
  color: var(--h-primary);
  font-weight: 700;
}

.profile-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--h-primary), var(--h-accent));
}

.profile-tabs :deep(.el-tabs__content) {
  padding: 0 4px 32px;
}

/* ========== 表单 ========== */
.profile-form {
  max-width: 560px;
}

.profile-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--h-text-secondary);
  font-size: 14px;
}

.profile-form :deep(.el-input__wrapper),
.profile-form :deep(.el-textarea__inner) {
  border-radius: 10px;
  transition: all 0.25s ease;
}

.profile-form :deep(.el-input__wrapper:hover),
.profile-form :deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px var(--h-primary-border);
}

.profile-form :deep(.el-input__wrapper:focus-within),
.profile-form :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 2px var(--h-primary), 0 0 0 5px color-mix(in srgb, var(--h-primary) 20%, transparent);
}

.save-btn {
  min-width: 140px;
  height: 42px;
  border-radius: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, var(--h-primary), var(--h-accent));
  border: none;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--h-primary) 25%, transparent);
  transition: all 0.3s ease;
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--h-primary) 35%, transparent);
}

.save-btn:active {
  transform: translateY(0);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .profile-card {
    border-radius: 16px;
  }

  .banner-content {
    gap: 16px;
    padding: 28px 20px 24px;
  }

  .avatar {
    font-size: 24px !important;
  }

  .profile-name {
    font-size: 21px;
  }

  .meta-item {
    font-size: 13px;
  }

  .profile-tabs {
    padding: 0 20px;
  }

  .profile-form {
    max-width: 100%;
  }
}
</style>