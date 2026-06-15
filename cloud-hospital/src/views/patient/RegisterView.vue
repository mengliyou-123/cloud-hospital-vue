<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getDepartmentsApi, getDoctorsByDeptApi, getSchedulesApi, registerApi } from '../../api/registration'
import type { Department, Doctor, Schedule } from '../../types'

const router = useRouter()

// 步骤：1=选科室, 2=选医生, 3=选时段确认
const step = ref(1)

// 科室列表
const depts = ref<Department[]>([])
const loadingDepts = ref(false)

// 医生列表
const doctors = ref<Doctor[]>([])
const loadingDoctors = ref(false)
const selectedDept = ref<Department | null>(null)

// 排班
const schedules = ref<Schedule[]>([])
const loadingSchedules = ref(false)
const selectedDoctor = ref<Doctor | null>(null)
const selectedDate = ref('')
const selectedSlot = ref('')

// 提交中
const submitting = ref(false)

// 可选的日期范围：今天起7天
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

function selectSlot(slot: string) {
  selectedSlot.value = slot
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

function getStatusTag(status: number) {
  if (status === 0) return { text: '待就诊', type: 'warning' as const }
  if (status === 1) return { text: '已就诊', type: 'success' as const }
  return { text: '已取消', type: 'info' as const }
}
</script>

<template>
  <div class="register-page">
    <!-- 顶部导航 -->
    <div class="topbar">
      <el-button @click="router.push('/patient/home')" :icon="'ArrowLeft'">返回首页</el-button>
      <span class="topbar-title">在线挂号预约</span>
      <el-button type="primary" @click="router.push('/patient/registers')">我的挂号记录</el-button>
    </div>

    <!-- 步骤条 -->
    <div class="steps-bar">
      <el-steps :active="step - 1" align-center>
        <el-step title="选择科室" />
        <el-step title="选择医生" />
        <el-step title="确认挂号" />
      </el-steps>
    </div>

    <div class="content">
      <!-- 步骤1：选择科室 -->
      <el-card v-if="step === 1" v-loading="loadingDepts">
        <template #header><span style="font-weight:600">请选择就诊科室</span></template>
        <div v-if="depts.length === 0 && !loadingDepts" style="text-align:center;padding:40px;color:#999">
          暂无可选科室
        </div>
        <div class="dept-grid">
          <div
            v-for="dept in depts"
            :key="dept.id"
            class="dept-card"
            @click="selectDept(dept)"
          >
            <el-icon :size="28" color="#409eff"><component :is="'OfficeBuilding'" /></el-icon>
            <div class="dept-name">{{ dept.deptName }}</div>
            <div class="dept-desc">{{ dept.deptDesc || '暂无描述' }}</div>
          </div>
        </div>
      </el-card>

      <!-- 步骤2：选择医生 -->
      <el-card v-if="step === 2" v-loading="loadingDoctors">
        <template #header>
          <div style="display:flex;align-items:center;gap:12px">
            <el-button text @click="goBack">
              <el-icon><ArrowLeft /></el-icon>返回选科室
            </el-button>
            <span style="font-weight:600">【{{ selectedDept?.deptName }}】出诊医生</span>
          </div>
        </template>
        <div v-if="doctors.length === 0 && !loadingDoctors" style="text-align:center;padding:40px;color:#999">
          该科室暂无出诊医生
        </div>
        <div class="doctor-list">
          <div
            v-for="doc in doctors"
            :key="doc.id"
            class="doctor-card"
            @click="selectDoctor(doc)"
          >
            <el-avatar :size="48" style="background:#67c23a">{{ doc.realName.charAt(0) }}</el-avatar>
            <div class="doc-info">
              <div class="doc-name">{{ doc.realName }} <el-tag size="small">{{ doc.title }}</el-tag></div>
              <div class="doc-skill">{{ doc.skill || '暂无介绍' }}</div>
              <div class="doc-dept">{{ doc.deptName }}</div>
            </div>
            <el-icon :size="20" color="#c0c4cc"><ArrowRight /></el-icon>
          </div>
        </div>
      </el-card>

      <!-- 步骤3：确认挂号 -->
      <el-card v-if="step === 3">
        <template #header>
          <div style="display:flex;align-items:center;gap:12px">
            <el-button text @click="goBack">
              <el-icon><ArrowLeft /></el-icon>返回选医生
            </el-button>
            <span style="font-weight:600">确认挂号信息</span>
          </div>
        </template>

        <!-- 医生信息 -->
        <el-descriptions :column="2" border size="default" style="margin-bottom:20px">
          <el-descriptions-item label="科室">{{ selectedDept?.deptName }}</el-descriptions-item>
          <el-descriptions-item label="医生">{{ selectedDoctor?.realName }}</el-descriptions-item>
          <el-descriptions-item label="职称">{{ selectedDoctor?.title }}</el-descriptions-item>
          <el-descriptions-item label="专长">{{ selectedDoctor?.skill || '暂无' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 选择日期 -->
        <div class="section-title">选择就诊日期</div>
        <div class="date-options">
          <el-radio-group v-model="selectedDate" @change="loadSchedules">
            <el-radio-button
              v-for="d in dateOptions"
              :key="d.value"
              :value="d.value"
            >{{ d.label }}</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 选择时段 -->
        <div v-if="selectedDate" class="slot-section" v-loading="loadingSchedules">
          <div class="section-title">选择就诊时段</div>
          <div v-if="schedules.length === 0 && !loadingSchedules" style="color:#999;padding:20px;text-align:center">
            该日期暂无出诊排班
          </div>
          <div class="slot-grid">
            <div
              v-for="s in schedules"
              :key="s.id"
              class="slot-card"
              :class="{ active: selectedSlot === s.timeSlot }"
              @click="selectSlot(s.timeSlot)"
            >
              <el-icon :size="18"><Clock /></el-icon>
              <span>{{ s.timeSlot }}</span>
            </div>
          </div>
        </div>

        <!-- 确认按钮 -->
        <div style="margin-top:24px;text-align:center">
          <el-button
            type="primary"
            size="large"
            :disabled="!selectedSlot"
            :loading="submitting"
            @click="doRegister"
          >
            {{ selectedSlot ? '确认挂号 · 挂号费 ¥10.00' : '请先选择就诊时段' }}
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #f4f6fb;
  padding-bottom: 40px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 28px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-bottom: 0;
}
.topbar-title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}
.steps-bar {
  background: #fff;
  padding: 24px 28px 16px;
  margin-bottom: 20px;
}
.content {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}
.dept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.dept-card {
  padding: 24px 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.dept-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64,158,255,0.15);
  transform: translateY(-2px);
}
.dept-name {
  font-size: 16px;
  font-weight: 600;
  margin: 10px 0 4px;
  color: #303133;
}
.dept-desc {
  font-size: 12px;
  color: #909399;
}
.doctor-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.doctor-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.doctor-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64,158,255,0.1);
}
.doc-info {
  flex: 1;
}
.doc-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}
.doc-skill {
  font-size: 13px;
  color: #606266;
  margin-top: 4px;
}
.doc-dept {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 12px;
}
.date-options {
  margin-bottom: 8px;
}
.slot-section {
  margin-top: 16px;
}
.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.slot-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #606266;
}
.slot-card:hover {
  border-color: #409eff;
}
.slot-card.active {
  border-color: #409eff;
  background: #ecf5ff;
  color: #409eff;
  font-weight: 600;
}
</style>