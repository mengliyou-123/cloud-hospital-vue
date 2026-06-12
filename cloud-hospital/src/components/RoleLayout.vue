<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { logoutApi, changePasswordApi } from '../api/auth'
import { getUser, clearUser, saveUser } from '../utils/request'
import type { LoginUser, ChangePasswordForm } from '../types'

const props = defineProps<{
  pageTitle: string
  iconName?: string
  subtitle?: string
  features?: { title: string; desc: string; icon: string; path?: string }[]
}>()

const router = useRouter()
const user = ref<LoginUser | null>(null)
const dialogVisible = ref(false)
const pwdLoading = ref(false)
const pwdFormRef = ref<FormInstance>()
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

onMounted(() => {
  user.value = getUser()
})

function openProfile() {
  if (!user.value) return
  const map: Record<string, string> = {
    patient: '/patient/profile',
    doctor: '/doctor/profile',
    drug_admin: '/drug-admin/profile',
    finance_admin: '/finance-admin/profile',
    super_admin: '/super-admin/profile'
  }
  router.push(map[user.value.roleCode] || '/login')
}

function openLogs() {
  if (!user.value) return
  const map: Record<string, string> = {
    patient: '/patient/logs',
    doctor: '/doctor/logs',
    super_admin: '/super-admin/logs'
  }
  const p = map[user.value.roleCode]
  if (p) router.push(p)
  else ElMessage.info('当前角色暂不支持查询日志入口')
}

function openChangePassword() {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  dialogVisible.value = true
}

async function submitPassword() {
  if (!pwdFormRef.value) return
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return
  pwdLoading.value = true
  try {
    const res = await changePasswordApi(pwdForm)
    if (res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      dialogVisible.value = false
      await doLogout(true)
    }
  } finally {
    pwdLoading.value = false
  }
}

const doLogout = async (silent = false) => {
  if (!silent) {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
  }
  try {
    await logoutApi()
  } catch {
    /* ignore */
  }
  clearUser()
  router.replace('/login')
  if (!silent) ElMessage.success('已退出登录')
}

function onFeatureClick(f: { path?: string; title: string }) {
  if (f.path) {
    router.push(f.path)
    return
  }
  ElMessage.info(`功能【${f.title}】占位，后续可继续扩展`)
}
</script>

<template>
  <div class="layout">
    <header class="header">
      <div class="left">
        <el-icon :size="24" color="#fff"><component :is="props.iconName || 'HomeFilled'" /></el-icon>
        <span class="logo">云医院信息管理系统</span>
      </div>
      <div class="right">
        <el-dropdown>
          <span class="user-chip">
            <el-avatar :size="32" style="background:#67c23a">{{
              user?.realName?.charAt(0) || 'U'
            }}</el-avatar>
            <span class="name">{{ user?.realName }}（{{ user?.roleName }}）</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="openProfile">
                <el-icon><User /></el-icon>个人中心
              </el-dropdown-item>
              <el-dropdown-item divided @click="openChangePassword">
                <el-icon><Lock /></el-icon>修改密码
              </el-dropdown-item>
              <el-dropdown-item @click="openLogs">
                <el-icon><Document /></el-icon>操作记录
              </el-dropdown-item>
              <el-dropdown-item divided @click="doLogout()">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="main">
      <section class="hero">
        <el-icon :size="36" color="#409eff">
          <component :is="props.iconName || 'HomeFilled'" />
        </el-icon>
        <div>
          <div class="hero-title">{{ props.pageTitle }}</div>
          <div class="hero-sub">{{ props.subtitle || '欢迎使用云医院信息管理系统' }}</div>
        </div>
      </section>

      <section class="welcome">
        <el-card shadow="never">
          <div class="greeting">
            <div>
              你好，<span class="uname">{{ user?.realName }}</span>！当前角色：
              <el-tag type="primary">{{ user?.roleName }}</el-tag>
            </div>
            <div class="date">{{ new Date().toLocaleString('zh-CN') }}</div>
          </div>
        </el-card>
      </section>

      <section v-if="features && features.length" class="features">
        <el-card
          v-for="(f, i) in features"
          :key="i"
          shadow="hover"
          class="feature-card"
          @click="onFeatureClick(f)"
        >
          <template #header>
            <div class="feature-header">
              <el-icon :size="20" color="#409eff"><component :is="f.icon" /></el-icon>
              <span>{{ f.title }}</span>
            </div>
          </template>
          <div class="feature-desc">{{ f.desc }}</div>
          <div class="feature-more" v-if="f.path">点击进入 →</div>
        </el-card>
      </section>

      <section class="placeholder" v-if="!features || features.length === 0">
        <el-card shadow="never">
          <el-empty description="此处为后续业务功能的占位区域，请根据需求文档继续扩展" />
        </el-card>
      </section>
    </main>

    <el-dialog v-model="dialogVisible" title="修改密码" width="420px">
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="96px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdLoading" @click="submitPassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  background: #f4f6fb;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  background: linear-gradient(90deg, #1e88e5, #43cea2);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
}
.user-chip .name {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.main {
  padding: 20px 28px 40px;
  max-width: 1200px;
  margin: 0 auto;
}
.hero {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.hero-title {
  font-size: 22px;
  font-weight: 700;
  color: #1f2d3d;
}
.hero-sub {
  color: #8492a6;
  font-size: 13px;
  margin-top: 2px;
}
.welcome {
  margin-bottom: 18px;
}
.greeting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: #303133;
}
.uname {
  color: #409eff;
  font-weight: 600;
  margin: 0 4px;
}
.date {
  color: #8492a6;
  font-size: 13px;
}
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}
.feature-card {
  cursor: pointer;
  transition: transform 0.2s;
}
.feature-card:hover {
  transform: translateY(-3px);
}
.feature-card :deep(.el-card__body) {
  min-height: 100px;
}
.feature-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.feature-desc {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}
.feature-more {
  margin-top: 8px;
  color: #409eff;
  font-size: 12px;
}
.placeholder {
  margin-top: 12px;
}
</style>
