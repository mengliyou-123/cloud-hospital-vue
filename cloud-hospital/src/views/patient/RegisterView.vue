<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getDepartmentsApi, getDoctorsByDeptApi, getSchedulesApi, registerApi } from '../../api/registration'
import type { Department, Doctor, Schedule } from '../../types'

const router = useRouter()

const step = ref(1)

const depts = ref<Department[]>([])
const loadingDepts = ref(false)

const doctors = ref<Doctor[]>([])
const loadingDoctors = ref(false)
const selectedDept = ref<Department | null>(null)

const schedules = ref<Schedule[]>([])
const loadingSchedules = ref(false)
const selectedDoctor = ref<Doctor | null>(null)
const selectedDate = ref('')
const selectedSlot = ref('')

const submitting = ref(false)

const dateOptions = computed(() => {
  const options: { label: string; value: string }[] = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const ds = d.toISOString().split('T')[0]
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    options.push({
      label: ds + ' ' + weekDays[d.getDay()],
      value: ds
    })
  }
  return options
})

onMounted(() => {
  loadDepts()
})

async function loadDepts() {
  loadingDepts.value = true
  try {
    const res = await getDepartmentsApi()
    if (res.code === 200) {
      depts.value = res.data || []
    }
  } finally {
    loadingDepts.value = false
  }
}

function selectDept(dept: Department) {
  selectedDept.value = dept
  selectedDoctor.value = null
  selectedDate.value = ''
  selectedSlot.value = ''
  schedules.value = []
  step.value = 2
  loadDoctors(dept.id)
}

async function loadDoctors(deptId: number) {
  loadingDoctors.value = true
  try {
    const res = await getDoctorsByDeptApi(deptId)
    if (res.code === 200) {
      doctors.value = res.data || []
    }
  } finally {
    loadingDoctors.value = false
  }
}

function selectDoctor(doctor: Doctor) {
  selectedDoctor.value = doctor
  selectedDate.value = ''
  selectedSlot.value = ''
  schedules.value = []
  step.value = 3
}

async function loadSchedules() {
  if (!selectedDoctor.value || !selectedDate.value) return
  loadingSchedules.value = true
  try {
    const res = await getSchedulesApi(selectedDoctor.value.id, selectedDate.value)
    if (res.code === 200) {
      schedules.value = res.data || []
    }
  } finally {
    loadingSchedules.value = false
  }
}

function selectSlot(s: Schedule) {
  if ((s.remainingQuota ?? 0) === 0) {
    ElMessage.warning('该时段号源已满，请选择其他时段')
    return
  }
  selectedSlot.value = s.timeSlot
}

async function doRegister() {
  if (!selectedDoctor.value || !selectedDept.value || !selectedDate.value || !selectedSlot.value) {
    ElMessage.warning('请完善挂号信息')
    return
  }
  submitting.value = true
  try {
    const res = await registerApi({
      doctorId: selectedDoctor.value.id,
      deptId: selectedDept.value.id,
      registerDate: selectedDate.value,
      timeSlot: selectedSlot.value
    })
    if (res.code === 200) {
      ElMessage.success('挂号成功！')
      router.push('/patient/registers')
    }
  } finally {
    submitting.value = false
  }
}

function goBack() {
  if (step.value === 3) {
    step.value = 2
    selectedDate.value = ''
    selectedSlot.value = ''
    schedules.value = []
  } else if (step.value === 2) {
    step.value = 1
    selectedDoctor.value = null
  }
}
</script>

<template>
  <div class="register-page">
    <!-- 顶部导航 -->
    <header class="page-header">
      <div class="page-header-inner">
        <el-button text @click="router.push('/patient/home')">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回首页</span>
        </el-button>
        <h1 class="page-title">在线挂号预约</h1>
        <el-button type="primary" size="default" @click="router.push('/patient/registers')">
          我的挂号记录
        </el-button>
      </div>
    </header>

    <!-- 步骤条 -->
    <div class="steps-bar">
      <div class="steps-inner">
        <el-steps :active="step - 1" align-center finish-status="success">
          <el-step title="选择科室" description="选择需要就诊的科室" />
          <el-step title="选择医生" description="选择您信任的医生" />
          <el-step title="确认挂号" description="确认时间并完成挂号" />
        </el-steps>
      </div>
    </div>

    <div class="content">
      <!-- 步骤1：选择科室 -->
      <div v-if="step === 1" v-loading="loadingDepts" class="step-content">
        <div class="step-header">
          <h2>请选择就诊科室</h2>
          <p>根据您的症状选择对应的科室，如有疑问请咨询导诊台</p>
        </div>
        <div v-if="depts.length === 0 && !loadingDepts" class="empty-state">
          <el-empty description="暂无可选科室" />
        </div>
        <div v-else class="dept-grid">
          <div
            v-for="dept in depts"
            :key="dept.id"
            class="dept-card"
            @click="selectDept(dept)"
          >
            <div class="dept-icon">
              <el-icon :size="28"><OfficeBuilding /></el-icon>
            </div>
            <div class="dept-name">{{ dept.deptName }}</div>
            <div class="dept-desc">{{ dept.deptDesc || '专业医疗团队为您服务' }}</div>
            <div class="dept-action">
              <span>选择科室</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤2：选择医生 -->
      <div v-if="step === 2" v-loading="loadingDoctors" class="step-content">
        <div class="step-header">
          <el-button text @click="goBack" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>返回选科室
          </el-button>
          <h2>【{{ selectedDept?.deptName }}】出诊医生</h2>
        </div>
        <div v-if="doctors.length === 0 && !loadingDoctors" class="empty-state">
          <el-empty description="该科室暂无出诊医生" />
        </div>
        <div v-else class="doctor-list">
          <div
            v-for="doc in doctors"
            :key="doc.id"
            class="doctor-card"
            @click="selectDoctor(doc)"
          >
            <el-avatar :size="52" class="doc-avatar">{{ doc.realName.charAt(0) }}</el-avatar>
            <div class="doc-info">
              <div class="doc-name">
                {{ doc.realName }}
                <el-tag size="small" type="primary" effect="plain">{{ doc.title }}</el-tag>
              </div>
              <div class="doc-skill">{{ doc.skill || '暂无介绍' }}</div>
              <div class="doc-dept">{{ doc.deptName }}</div>
            </div>
            <div class="doc-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤3：确认挂号 -->
      <div v-if="step === 3" class="step-content">
        <div class="step-header">
          <el-button text @click="goBack" class="back-btn">
            <el-icon><ArrowLeft /></el-icon>返回选医生
          </el-button>
          <h2>确认挂号信息</h2>
        </div>

        <!-- 医生信息卡片 -->
        <div class="confirm-card">
          <div class="confirm-info">
            <el-avatar :size="56" class="confirm-avatar">
              {{ selectedDoctor?.realName?.charAt(0) }}
            </el-avatar>
            <div class="confirm-detail">
              <div class="confirm-doctor">
                {{ selectedDoctor?.realName }}
                <el-tag size="small" type="primary" effect="plain">{{ selectedDoctor?.title }}</el-tag>
              </div>
              <div class="confirm-dept">{{ selectedDept?.deptName }}</div>
              <div class="confirm-skill">{{ selectedDoctor?.skill || '暂无专长介绍' }}</div>
            </div>
          </div>
        </div>

        <!-- 选择日期 -->
        <div class="section-block">
          <div class="section-title">
            <el-icon><Calendar /></el-icon>
            <span>选择就诊日期</span>
          </div>
          <div class="date-options">
            <el-radio-group v-model="selectedDate" @change="loadSchedules" size="large">
              <el-radio-button
                v-for="d in dateOptions"
                :key="d.value"
                :value="d.value"
              >{{ d.label }}</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- 选择时段 -->
        <div v-if="selectedDate" class="section-block" v-loading="loadingSchedules">
          <div class="section-title">
            <el-icon><Clock /></el-icon>
            <span>选择就诊时段</span>
          </div>
          <div v-if="schedules.length === 0 && !loadingSchedules" class="empty-state">
            <el-empty description="该日期暂无出诊排班" :image-size="80" />
          </div>
          <div v-else class="slot-grid">
            <div
              v-for="s in schedules"
              :key="s.id"
              class="slot-card"
              :class="{
                active: selectedSlot === s.timeSlot,
                'is-full': s.remainingQuota === 0
              }"
              @click="selectSlot(s)"
            >
              <div class="slot-icon">
                <el-icon :size="20"><Clock /></el-icon>
              </div>
              <div class="slot-info">
                <span class="slot-time">{{ s.timeSlot }}</span>
                <span class="slot-quota">
                  <template v-if="s.remainingQuota === 0">
                    <span class="quota-full">号源已满</span>
                  </template>
                  <template v-else>
                    <span class="quota-available">剩余 {{ s.remainingQuota }} / {{ s.quota }}</span>
                  </template>
                </span>
              </div>
              <div v-if="selectedSlot === s.timeSlot" class="slot-check">
                <el-icon><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 确认按钮 -->
        <div class="submit-area">
          <el-button
            type="primary"
            size="large"
            :disabled="!selectedSlot"
            :loading="submitting"
            @click="doRegister"
            class="submit-btn"
          >
            <template v-if="selectedSlot">
              <el-icon><Check /></el-icon>
              确认挂号 · 挂号费 ¥10.00
            </template>
            <template v-else>
              请先选择就诊时段
            </template>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  background: var(--h-bg);
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.page-header {
  background: #fff;
  border-bottom: 1px solid var(--h-border);
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
}

.page-header-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--h-text);
  margin: 0;
}

/* 步骤条 */
.steps-bar {
  background: #fff;
  border-bottom: 1px solid var(--h-border-light);
}

.steps-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 28px 24px;
}

/* 内容区 */
.content {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 24px 60px;
}

.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.step-header {
  margin-bottom: 24px;
}

.step-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--h-text);
  margin: 0 0 6px;
}

.step-header p {
  font-size: 14px;
  color: var(--h-text-tertiary);
  margin: 0;
}

.back-btn {
  margin-bottom: 8px;
}

/* 科室网格 */
.dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 16px;
}

.dept-card {
  padding: 28px 20px 22px;
  background: #fff;
  border: 1px solid var(--h-border);
  border-radius: var(--h-radius-md);
  text-align: center;
  cursor: pointer;
  transition: all var(--h-transition);
  box-shadow: var(--h-shadow-sm);
}

.dept-card:hover {
  border-color: var(--h-primary);
  box-shadow: var(--h-shadow-md);
  transform: translateY(-3px);
}

.dept-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--h-radius-md);
  background: var(--h-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--h-primary);
  margin: 0 auto 14px;
  transition: all var(--h-transition);
}

.dept-card:hover .dept-icon {
  background: var(--h-primary);
  color: #fff;
}

.dept-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--h-text);
  margin-bottom: 6px;
}

.dept-desc {
  font-size: 13px;
  color: var(--h-text-tertiary);
  line-height: 1.5;
  margin-bottom: 14px;
}

.dept-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--h-primary);
  font-weight: 500;
}

/* 医生列表 */
.doctor-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.doctor-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border: 1px solid var(--h-border);
  border-radius: var(--h-radius-md);
  cursor: pointer;
  transition: all var(--h-transition);
  box-shadow: var(--h-shadow-sm);
}

.doctor-card:hover {
  border-color: var(--h-primary);
  box-shadow: var(--h-shadow-md);
  transform: translateX(4px);
}

.doc-avatar {
  background: linear-gradient(135deg, #10B981, #059669) !important;
  color: #fff;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--h-text);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.doc-skill {
  font-size: 13px;
  color: var(--h-text-secondary);
  margin-bottom: 2px;
  line-height: 1.5;
}

.doc-dept {
  font-size: 12px;
  color: var(--h-text-tertiary);
}

.doc-arrow {
  color: var(--h-text-placeholder);
  flex-shrink: 0;
  transition: all var(--h-transition);
}

.doctor-card:hover .doc-arrow {
  color: var(--h-primary);
  transform: translateX(4px);
}

/* 确认卡片 */
.confirm-card {
  background: #fff;
  border: 1px solid var(--h-border);
  border-radius: var(--h-radius-md);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--h-shadow);
}

.confirm-info {
  display: flex;
  align-items: center;
  gap: 18px;
}

.confirm-avatar {
  background: linear-gradient(135deg, var(--h-primary), var(--h-primary-light)) !important;
  color: #fff;
  font-weight: 700;
  font-size: 20px;
  flex-shrink: 0;
}

.confirm-detail {
  flex: 1;
}

.confirm-doctor {
  font-size: 18px;
  font-weight: 700;
  color: var(--h-text);
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.confirm-dept {
  font-size: 14px;
  color: var(--h-text-secondary);
  margin-bottom: 4px;
}

.confirm-skill {
  font-size: 13px;
  color: var(--h-text-tertiary);
}

/* 区块 */
.section-block {
  background: #fff;
  border: 1px solid var(--h-border);
  border-radius: var(--h-radius-md);
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: var(--h-shadow-sm);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--h-text);
  margin-bottom: 16px;
}

.section-title .el-icon {
  color: var(--h-primary);
}

/* 日期选项 */
.date-options {
  overflow-x: auto;
  padding-bottom: 4px;
}

/* 时段网格 */
.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.slot-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1.5px solid var(--h-border);
  border-radius: var(--h-radius);
  cursor: pointer;
  transition: all var(--h-transition);
  position: relative;
}

.slot-card:hover:not(.is-full) {
  border-color: var(--h-primary);
  background: var(--h-primary-bg);
}

.slot-card.active {
  border-color: var(--h-primary);
  background: var(--h-primary-bg);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.slot-card.is-full {
  opacity: 0.5;
  cursor: not-allowed;
  background: #F8FAFC;
}

.slot-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--h-radius);
  background: var(--h-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--h-primary);
  flex-shrink: 0;
}

.slot-card.active .slot-icon {
  background: var(--h-primary);
  color: #fff;
}

.slot-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slot-time {
  font-size: 15px;
  font-weight: 600;
  color: var(--h-text);
}

.slot-quota {
  font-size: 12px;
}

.quota-full {
  color: var(--h-danger);
}

.quota-available {
  color: var(--h-success);
}

.slot-check {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--h-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
}

/* 提交按钮 */
.submit-area {
  text-align: center;
  margin-top: 32px;
}

.submit-btn {
  min-width: 280px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: var(--h-radius) !important;
}

.submit-btn .el-icon {
  margin-right: 6px;
}

/* 空状态 */
.empty-state {
  padding: 40px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header-inner {
    padding: 0 16px;
  }

  .page-title {
    font-size: 16px;
  }

  .content {
    padding: 16px 16px 40px;
  }

  .dept-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .slot-grid {
    grid-template-columns: 1fr;
  }
}
</style>