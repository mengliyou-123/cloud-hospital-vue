<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
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

const schedules = ref<Schedule[]>([])
const loadingSchedules = ref(false)

const selectedDept = ref<Department | null>(null)
const selectedDoctor = ref<Doctor | null>(null)
const selectedDate = ref('')
const selectedSlot = ref('')

const submitting = ref(false)

const query = reactive({
  deptKeyword: '',
  doctorKeyword: ''
})

const dateOptions = computed(() => {
  const options: { label: string; value: string; week: string; day: string }[] = []
  const today = new Date()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)

    const value = d.toISOString().split('T')[0]

    options.push({
      label: i === 0 ? '今天' : i === 1 ? '明天' : weekDays[d.getDay()],
      value,
      week: weekDays[d.getDay()],
      day: `${d.getMonth() + 1}/${d.getDate()}`
    })
  }

  return options
})

const filteredDepts = computed(() => {
  const kw = query.deptKeyword.trim()
  if (!kw) return depts.value
  return depts.value.filter((d) => `${d.deptName}${d.deptDesc || ''}`.includes(kw))
})

const filteredDoctors = computed(() => {
  const kw = query.doctorKeyword.trim()
  if (!kw) return doctors.value
  return doctors.value.filter((d) => `${d.realName}${d.title}${d.skill || ''}${d.deptName || ''}`.includes(kw))
})

const selectedSchedule = computed(() => {
  return schedules.value.find((s) => s.timeSlot === selectedSlot.value)
})

const canSubmit = computed(() => {
  return !!selectedDept.value && !!selectedDoctor.value && !!selectedDate.value && !!selectedSlot.value
})

onMounted(loadDepts)

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
  doctors.value = []
  query.doctorKeyword = ''
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
  selectedSlot.value = ''

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

function selectDate(date: string) {
  selectedDate.value = date
  loadSchedules()
}

function selectSlot(schedule: Schedule) {
  if ((schedule.remainingQuota ?? 0) <= 0) {
    ElMessage.warning('该时段号源已满，请选择其他时段')
    return
  }

  selectedSlot.value = schedule.timeSlot
}

function goStep(targetStep: number) {
  if (targetStep === 1) {
    step.value = 1
  }

  if (targetStep === 2 && selectedDept.value) {
    step.value = 2
  }

  if (targetStep === 3 && selectedDoctor.value) {
    step.value = 3
  }
}

function goBack() {
  if (step.value === 3) {
    step.value = 2
    selectedDate.value = ''
    selectedSlot.value = ''
    schedules.value = []
    return
  }

  if (step.value === 2) {
    step.value = 1
    selectedDoctor.value = null
    doctors.value = []
    return
  }

  router.push('/patient/home')
}

async function doRegister() {
  if (!canSubmit.value || !selectedDoctor.value || !selectedDept.value) {
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
      ElMessage.success('挂号成功，请按预约时间到院就诊')
      router.push('/patient/registers')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page-shell register-page">
    <div class="page-card guide-card">
      <div class="guide-left">
        <div class="guide-title">三步完成在线挂号</div>
        <div class="guide-sub">选择科室、医生和就诊时段，系统会自动校验号源。</div>
      </div>

      <el-button type="primary" plain @click="router.push('/patient/registers')">
        <el-icon><Notebook /></el-icon>
        我的挂号记录
      </el-button>
    </div>

    <div class="page-card steps-card">
      <el-steps :active="step - 1" align-center finish-status="success">
        <el-step title="选择科室" description="明确就诊方向" @click="goStep(1)" />
        <el-step title="选择医生" description="查看出诊医生" @click="goStep(2)" />
        <el-step title="确认号源" description="提交预约" @click="goStep(3)" />
      </el-steps>
    </div>

    <div v-if="step === 1" class="page-card step-panel" v-loading="loadingDepts">
      <div class="step-header">
        <div>
          <h2>请选择就诊科室</h2>
          <p>建议根据症状选择对应科室，不确定时可咨询导诊台。</p>
        </div>

        <el-input
          v-model="query.deptKeyword"
          clearable
          placeholder="搜索科室"
          class="step-search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <el-empty v-if="filteredDepts.length === 0 && !loadingDepts" description="暂无可选科室" />

      <div v-else class="dept-grid">
        <button
          v-for="dept in filteredDepts"
          :key="dept.id"
          class="dept-card"
          type="button"
          @click="selectDept(dept)"
        >
          <span class="dept-icon">
            <el-icon><OfficeBuilding /></el-icon>
          </span>
          <span class="dept-name">{{ dept.deptName }}</span>
          <span class="dept-desc">{{ dept.deptDesc || '专业医疗团队为您服务' }}</span>
          <span class="card-action">
            选择科室
            <el-icon><ArrowRight /></el-icon>
          </span>
        </button>
      </div>
    </div>

    <div v-if="step === 2" class="page-card step-panel" v-loading="loadingDoctors">
      <div class="step-header">
        <div>
          <el-button text class="back-btn" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回选科室
          </el-button>
          <h2>【{{ selectedDept?.deptName }}】出诊医生</h2>
          <p>请选择本次预约医生。</p>
        </div>

        <el-input
          v-model="query.doctorKeyword"
          clearable
          placeholder="搜索医生 / 职称 / 专长"
          class="step-search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <el-empty v-if="filteredDoctors.length === 0 && !loadingDoctors" description="该科室暂无出诊医生" />

      <div v-else class="doctor-grid">
        <button
          v-for="doc in filteredDoctors"
          :key="doc.id"
          class="doctor-card"
          type="button"
          @click="selectDoctor(doc)"
        >
          <el-avatar :size="52" class="doc-avatar">
            {{ doc.realName.charAt(0) }}
          </el-avatar>

          <span class="doc-info">
            <span class="doc-name">
              {{ doc.realName }}
              <el-tag size="small" type="primary" effect="plain">{{ doc.title }}</el-tag>
            </span>
            <span class="doc-skill">{{ doc.skill || '暂无介绍' }}</span>
            <span class="doc-dept">{{ doc.deptName }}</span>
          </span>

          <el-icon class="doc-arrow"><ArrowRight /></el-icon>
        </button>
      </div>
    </div>

    <div v-if="step === 3" class="register-workspace">
      <div class="page-card confirm-panel">
        <div class="step-header compact">
          <div>
            <el-button text class="back-btn" @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              返回选医生
            </el-button>
            <h2>确认挂号信息</h2>
            <p>请选择日期和时段后提交预约。</p>
          </div>
        </div>

        <div class="doctor-summary">
          <el-avatar :size="58" class="doc-avatar large">
            {{ selectedDoctor?.realName?.charAt(0) }}
          </el-avatar>

          <div>
            <div class="summary-name">
              {{ selectedDoctor?.realName }}
              <el-tag size="small" type="primary" effect="plain">
                {{ selectedDoctor?.title }}
              </el-tag>
            </div>
            <div class="summary-line">
              {{ selectedDept?.deptName }} · {{ selectedDoctor?.skill || '暂无专长介绍' }}
            </div>
          </div>
        </div>

        <div class="section-title">
          <el-icon><Calendar /></el-icon>
          选择就诊日期
        </div>

        <div class="date-grid">
          <button
            v-for="d in dateOptions"
            :key="d.value"
            class="date-card"
            :class="{ active: selectedDate === d.value }"
            type="button"
            @click="selectDate(d.value)"
          >
            <strong>{{ d.label }}</strong>
            <span>{{ d.day }}</span>
            <small>{{ d.week }}</small>
          </button>
        </div>

        <div class="section-title">
          <el-icon><Clock /></el-icon>
          选择就诊时段
        </div>

        <div v-loading="loadingSchedules" class="slot-area">
          <el-empty
            v-if="selectedDate && schedules.length === 0 && !loadingSchedules"
            description="该日期暂无出诊排班"
            :image-size="76"
          />

          <el-empty
            v-else-if="!selectedDate"
            description="请先选择就诊日期"
            :image-size="76"
          />

          <div v-else class="slot-grid">
            <button
              v-for="s in schedules"
              :key="s.id"
              type="button"
              class="slot-card"
              :class="{
                active: selectedSlot === s.timeSlot,
                full: (s.remainingQuota ?? 0) <= 0
              }"
              @click="selectSlot(s)"
            >
              <span class="slot-time">{{ s.timeSlot }}</span>
              <span
                class="slot-quota"
                :class="{ danger: (s.remainingQuota ?? 0) <= 0 }"
              >
                {{ (s.remainingQuota ?? 0) <= 0 ? '号源已满' : `剩余 ${s.remainingQuota} / ${s.quota}` }}
              </span>

              <span v-if="selectedSlot === s.timeSlot" class="slot-check">
                <el-icon><Check /></el-icon>
              </span>
            </button>
          </div>
        </div>
      </div>

      <aside class="page-card order-summary">
        <div class="summary-title">预约确认</div>

        <div class="summary-row">
          <span>科室</span>
          <strong>{{ selectedDept?.deptName || '-' }}</strong>
        </div>

        <div class="summary-row">
          <span>医生</span>
          <strong>{{ selectedDoctor?.realName || '-' }}</strong>
        </div>

        <div class="summary-row">
          <span>日期</span>
          <strong>{{ selectedDate || '-' }}</strong>
        </div>

        <div class="summary-row">
          <span>时段</span>
          <strong>{{ selectedSlot || '-' }}</strong>
        </div>

        <div class="summary-row">
          <span>号源</span>
          <strong>{{ selectedSchedule ? `剩余 ${selectedSchedule.remainingQuota}` : '-' }}</strong>
        </div>

        <div class="summary-fee">
          <span>挂号费</span>
          <strong>¥10.00</strong>
        </div>

        <el-button
          class="submit-btn"
          type="primary"
          size="large"
          :disabled="!canSubmit"
          :loading="submitting"
          @click="doRegister"
        >
          <el-icon><Check /></el-icon>
          确认挂号
        </el-button>

        <div class="summary-tip">
          挂号成功后，可在“我的挂号记录”查看就医进度。
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guide-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.guide-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--h-text);
}

.guide-sub {
  margin-top: 4px;
  color: var(--h-text-tertiary);
  font-size: 13px;
}

.steps-card {
  padding: 24px 18px;
}

.step-panel {
  min-height: 420px;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.step-header h2 {
  margin: 0 0 6px;
  font-size: 20px;
  color: var(--h-text);
}

.step-header p {
  margin: 0;
  color: var(--h-text-tertiary);
  font-size: 14px;
}

.step-search {
  width: 260px;
}

.back-btn {
  margin-bottom: 6px;
  padding-left: 0;
}

.dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 16px;
}

.dept-card,
.doctor-card,
.date-card,
.slot-card {
  border: 0;
  font-family: inherit;
}

.dept-card {
  min-height: 184px;
  padding: 22px;
  border: 1px solid var(--h-border);
  border-radius: var(--h-radius-md);
  background: var(--h-card);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  box-shadow: var(--h-shadow-sm);
  transition: all var(--h-transition);
}

.dept-card:hover,
.doctor-card:hover,
.date-card:hover,
.slot-card:hover:not(.full) {
  transform: translateY(-2px);
  border-color: var(--h-primary-border);
  box-shadow: var(--h-shadow-md);
}

.dept-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--h-primary-bg);
  color: var(--h-primary);
  font-size: 22px;
  margin-bottom: 16px;
}

.dept-name {
  font-size: 17px;
  font-weight: 800;
  color: var(--h-text);
}

.dept-desc {
  margin: 8px 0 14px;
  color: var(--h-text-tertiary);
  font-size: 13px;
  line-height: 1.45;
  flex: 1;
}

.card-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--h-primary);
  font-size: 13px;
  font-weight: 700;
}

.doctor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.doctor-card {
  padding: 18px;
  border: 1px solid var(--h-border);
  border-radius: var(--h-radius-md);
  background: var(--h-card);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
  box-shadow: var(--h-shadow-sm);
  transition: all var(--h-transition);
}

.doc-avatar {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  color: #fff;
  font-weight: 800;
  flex: 0 0 auto;
}

.doc-avatar.large {
  font-size: 20px;
}

.doc-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.doc-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 800;
  color: var(--h-text);
}

.doc-skill {
  margin-top: 5px;
  font-size: 13px;
  color: var(--h-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-dept {
  margin-top: 3px;
  font-size: 12px;
  color: var(--h-text-tertiary);
}

.doc-arrow {
  color: var(--h-text-placeholder);
}

.register-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  align-items: start;
}

.confirm-panel {
  min-width: 0;
}

.doctor-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--h-border);
  border-radius: var(--h-radius-md);
  background: linear-gradient(135deg, #f8fafc, #fff);
  margin-bottom: 22px;
}

.summary-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 800;
  color: var(--h-text);
}

.summary-line {
  margin-top: 5px;
  color: var(--h-text-secondary);
  font-size: 13px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 12px;
  font-weight: 800;
  color: var(--h-text);
}

.section-title .el-icon {
  color: var(--h-primary);
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(98px, 1fr));
  gap: 10px;
}

.date-card {
  padding: 13px 8px;
  border: 1px solid var(--h-border);
  border-radius: var(--h-radius);
  background: var(--h-card);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
  color: var(--h-text-secondary);
  transition: all var(--h-transition);
}

.date-card strong {
  color: var(--h-text);
}

.date-card span {
  font-weight: 800;
}

.date-card small {
  color: var(--h-text-tertiary);
}

.date-card.active {
  border-color: var(--h-primary);
  background: var(--h-primary-bg);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.slot-area {
  min-height: 126px;
}

.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.slot-card {
  position: relative;
  min-height: 74px;
  padding: 14px 16px;
  border: 1.5px solid var(--h-border);
  border-radius: var(--h-radius);
  background: var(--h-card);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  transition: all var(--h-transition);
}

.slot-card.active {
  border-color: var(--h-primary);
  background: var(--h-primary-bg);
}

.slot-card.full {
  opacity: 0.58;
  cursor: not-allowed;
  background: var(--h-primary-bg);
}

.slot-time {
  font-size: 15px;
  font-weight: 800;
  color: var(--h-text);
}

.slot-quota {
  font-size: 12px;
  color: var(--h-success);
}

.slot-quota.danger {
  color: var(--h-danger);
}

.slot-check {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--h-primary);
  color: #fff;
  display: grid;
  place-items: center;
}

.order-summary {
  position: sticky;
  top: 88px;
  padding: 18px;
}

.summary-title {
  font-size: 16px;
  font-weight: 900;
  color: var(--h-text);
  margin-bottom: 14px;
}

.summary-row,
.summary-fee {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--h-border);
  font-size: 13px;
}

.summary-row span {
  color: var(--h-text-tertiary);
}

.summary-row strong {
  color: var(--h-text);
  text-align: right;
}

.summary-fee {
  border-bottom: 0;
  margin: 8px 0 12px;
}

.summary-fee span {
  color: var(--h-text-secondary);
}

.summary-fee strong {
  color: var(--h-danger);
  font-size: 20px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-weight: 800;
}

.summary-tip {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--h-text-tertiary);
  text-align: center;
}

@media (max-width: 1100px) {
  .register-workspace {
    grid-template-columns: 1fr;
  }

  .order-summary {
    position: static;
  }
}

@media (max-width: 768px) {
  .guide-card,
  .step-header {
    flex-direction: column;
    align-items: stretch;
  }

  .step-search {
    width: 100%;
  }

  .dept-grid,
  .doctor-grid,
  .date-grid,
  .slot-grid {
    grid-template-columns: 1fr;
  }

  .steps-card {
    padding: 18px 8px;
  }
}
</style>