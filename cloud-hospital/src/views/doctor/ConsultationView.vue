<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getTodayPendingApi,
  startConsultationApi,
  completeConsultationApi,
  getDrugsApi,
  createPrescriptionApi,
  getDoctorHistoryApi
} from '../../api/consultation'
import type { TreatmentVO, Drug, PrescriptionItemDTO } from '../../types'

const router = useRouter()

// 数据状态
const pendingList = ref<TreatmentVO[]>([])
const historyList = ref<TreatmentVO[]>([])
const loading = ref(false)
const drugs = ref<Drug[]>([])

// 搜索条件
const searchParams = reactive({
  startDate: '',
  endDate: '',
  patientName: ''
})

// 当前接诊状态
const activeTreatment = ref<TreatmentVO | null>(null)
const activeTab = ref<'pending' | 'history'>('pending')

// 诊疗表单
const form = ref({
  diseaseDesc: '',
  diagnosisResult: '',
  doctorAdvice: ''
})

// 处方开药
const showPrescription = ref(false)
const selectedDrugId = ref<number | null>(null)
const selectedDrugNum = ref(1)
const prescriptionItems = ref<PrescriptionItemDTO[]>([])
const prescribingTreatmentId = ref<number | null>(null)

onMounted(() => {
  loadPendingList()
  loadDrugs()
})

async function loadPendingList() {
  loading.value = true
  try {
    const res = await getTodayPendingApi()
    if (res.code === 200) {
      pendingList.value = res.data || []
    }
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  loading.value = true
  try {
    const params: any = {}
    if (searchParams.startDate) params.startDate = searchParams.startDate
    if (searchParams.endDate) params.endDate = searchParams.endDate
    if (searchParams.patientName) params.patientName = searchParams.patientName
    const res = await getDoctorHistoryApi(params)
    if (res.code === 200) {
      historyList.value = res.data || []
    }
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchParams.startDate = ''
  searchParams.endDate = ''
  searchParams.patientName = ''
  loadHistory()
}

async function loadDrugs() {
  try {
    const res = await getDrugsApi()
    if (res.code === 200) {
      drugs.value = res.data || []
    }
  } catch {
    // 药品可能暂无数据
  }
}

/** 启动接诊 */
async function handleStart(row: TreatmentVO) {
  try {
    await ElMessageBox.confirm(
      `确认接诊患者【${row.patientName}】吗？`,
      '启动接诊',
      { confirmButtonText: '开始接诊', cancelButtonText: '取消', type: 'info' }
    )
  } catch {
    return
  }
  const res = await startConsultationApi({ registerId: row.registerId })
  if (res.code === 200) {
    ElMessage.success('接诊已启动')
    activeTreatment.value = res.data
    form.value = { diseaseDesc: '', diagnosisResult: '', doctorAdvice: '' }
    showPrescription.value = false
    prescriptionItems.value = []
  }
}

/** 完成诊疗 */
async function handleComplete() {
  if (!activeTreatment.value) return
  if (!form.value.diseaseDesc.trim()) {
    ElMessage.warning('请填写病情描述')
    return
  }
  if (!form.value.diagnosisResult.trim()) {
    ElMessage.warning('请填写诊断结果')
    return
  }
  if (!form.value.doctorAdvice.trim()) {
    ElMessage.warning('请填写医嘱')
    return
  }
  const res = await completeConsultationApi({
    id: activeTreatment.value.id,
    diseaseDesc: form.value.diseaseDesc,
    diagnosisResult: form.value.diagnosisResult,
    doctorAdvice: form.value.doctorAdvice
  })
  if (res.code === 200) {
    ElMessage.success('诊疗记录已保存')
    prescribingTreatmentId.value = activeTreatment.value.id
    showPrescription.value = true
  }
}

/** 添加药品到处方列表 */
function addDrugToPrescription() {
  if (!selectedDrugId.value) {
    ElMessage.warning('请选择药品')
    return
  }
  if (selectedDrugNum.value <= 0) {
    ElMessage.warning('数量必须大于0')
    return
  }
  const drug = drugs.value.find(d => d.id === selectedDrugId.value)
  if (!drug) return

  const existing = prescriptionItems.value.find(i => i.drugId === selectedDrugId.value)
  if (existing) {
    existing.drugNum += selectedDrugNum.value
  } else {
    prescriptionItems.value.push({
      drugId: drug.id,
      drugNum: selectedDrugNum.value,
      drugPrice: drug.price
    })
  }
  selectedDrugId.value = null
  selectedDrugNum.value = 1
}

/** 移除处方中的药品 */
function removeDrugItem(index: number) {
  prescriptionItems.value.splice(index, 1)
}

/** 提交处方 */
async function handleSubmitPrescription() {
  if (!prescribingTreatmentId.value) return
  if (prescriptionItems.value.length === 0) {
    ElMessage.warning('请至少添加一种药品')
    return
  }
  const res = await createPrescriptionApi({
    treatmentId: prescribingTreatmentId.value,
    items: prescriptionItems.value.map(i => ({
      drugId: i.drugId,
      drugNum: i.drugNum,
      drugPrice: i.drugPrice
    }))
  })
  if (res.code === 200) {
    ElMessage.success('处方已开具，已同步到药房')
    showPrescription.value = false
    prescriptionItems.value = []
    prescribingTreatmentId.value = null
    activeTreatment.value = null
    loadPendingList()
  }
}

/** 结束接诊（不处方） */
function handleEndWithoutPrescription() {
  ElMessage.success('接诊已结束')
  showPrescription.value = false
  prescriptionItems.value = []
  prescribingTreatmentId.value = null
  activeTreatment.value = null
  loadPendingList()
}

function handleTabChange(tab: string) {
  activeTab.value = tab as 'pending' | 'history'
  if (tab === 'history') {
    loadHistory()
  }
}

function getDrugName(id: number): string {
  return drugs.value.find(d => d.id === id)?.drugName || '未知药品'
}

const prescriptionTotal = computed(() => {
  return prescriptionItems.value.reduce((sum, item) => sum + item.drugPrice * item.drugNum, 0)
})
</script>

<template>
  <div class="consultation-page">
    <div class="topbar">
      <div class="topbar-left">
        <el-button @click="router.push('/doctor/home')" :icon="'ArrowLeft'">返回首页</el-button>
      </div>
      <span class="topbar-title">接诊工作台</span>
      <div class="topbar-right">
        <el-button type="primary" @click="loadPendingList">刷新列表</el-button>
      </div>
    </div>

    <div class="content">
      <!-- 当前接诊区域 -->
      <el-card v-if="activeTreatment" class="active-treatment-card">
        <template #header>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-weight:700;font-size:16px;color:#409eff">
              正在接诊：{{ activeTreatment.patientName }}
            </span>
            <el-tag type="warning">{{ activeTreatment.deptName }} | {{ activeTreatment.timeSlot }}</el-tag>
          </div>
        </template>

        <el-form label-width="100px" :model="form" :disabled="showPrescription">
          <el-form-item label="病情描述" required>
            <el-input
              v-model="form.diseaseDesc"
              type="textarea"
              :rows="3"
              placeholder="请输入患者主诉和病情描述"
            />
          </el-form-item>
          <el-form-item label="诊断结果" required>
            <el-input
              v-model="form.diagnosisResult"
              type="textarea"
              :rows="2"
              placeholder="请输入诊断结果"
            />
          </el-form-item>
          <el-form-item label="医嘱" required>
            <el-input
              v-model="form.doctorAdvice"
              type="textarea"
              :rows="2"
              placeholder="请输入医嘱建议"
            />
          </el-form-item>
          <el-form-item v-if="!showPrescription">
            <el-button type="primary" @click="handleComplete">
              保存诊疗记录
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 处方区域 -->
        <div v-if="showPrescription" class="prescription-section">
          <el-divider content-position="left">开具电子处方</el-divider>

          <div class="drug-selector">
            <el-select
              v-model="selectedDrugId"
              placeholder="选择药品"
              filterable
              style="width:260px"
              clearable
            >
              <el-option
                v-for="d in drugs"
                :key="d.id"
                :label="`${d.drugName} (${d.drugSpec}) - ¥${d.price.toFixed(2)}`"
                :value="d.id"
              />
            </el-select>
            <el-input-number
              v-model="selectedDrugNum"
              :min="1"
              :max="99"
              style="margin:0 10px"
            />
            <el-button type="success" @click="addDrugToPrescription">添加药品</el-button>
          </div>

          <div v-if="prescriptionItems.length > 0" class="prescription-items">
            <el-table :data="prescriptionItems" stripe style="width:100%;margin-top:12px">
              <el-table-column label="药品名称" min-width="180">
                <template #default="{ row }">{{ getDrugName(row.drugId) }}</template>
              </el-table-column>
              <el-table-column label="数量" width="80">
                <template #default="{ row }">{{ row.drugNum }}</template>
              </el-table-column>
              <el-table-column label="单价" width="100">
                <template #default="{ row }">¥{{ row.drugPrice.toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="小计" width="100">
                <template #default="{ row }">¥{{ (row.drugPrice * row.drugNum).toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button type="danger" size="small" text @click="removeDrugItem($index)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div style="text-align:right;margin-top:10px;font-size:16px;font-weight:700">
              处方总金额：<span style="color:#f56c6c">¥{{ prescriptionTotal.toFixed(2) }}</span>
            </div>
          </div>

          <div style="margin-top:16px;display:flex;gap:12px">
            <el-button type="primary" @click="handleSubmitPrescription">
              提交处方（同步到药房）
            </el-button>
            <el-button @click="handleEndWithoutPrescription">
              暂不开处方，结束接诊
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 列表区域 -->
      <el-card>
        <template #header>
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="今日待接诊" name="pending" />
            <el-tab-pane label="历史诊疗记录" name="history" />
          </el-tabs>
        </template>

        <div v-loading="loading">
          <!-- 待接诊列表 -->
          <template v-if="activeTab === 'pending'">
            <el-empty v-if="pendingList.length === 0 && !loading" description="今日暂无待接诊患者" />
            <el-table v-else :data="pendingList" stripe style="width:100%">
              <el-table-column prop="registerId" label="挂号编号" width="90" />
              <el-table-column prop="patientName" label="患者姓名" width="100" />
              <el-table-column prop="patientPhone" label="手机号" width="130" />
              <el-table-column prop="deptName" label="科室" width="100" />
              <el-table-column prop="timeSlot" label="就诊时段" width="160" />
              <el-table-column label="到诊状态" width="110">
                <template #default="{ row }">
                  <el-tag :type="row.arrivalStatus === 1 ? 'success' : 'info'">
                    {{ row.arrivalStatus === 1 ? '已到院' : '未到院' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="挂号费" width="90">
                <template #default="{ row }">¥{{ row.registerFee?.toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="操作" min-width="140" fixed="right">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    size="small"
                    @click="handleStart(row)"
                    :disabled="!!activeTreatment"
                  >
                    启动接诊
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>

          <!-- 历史记录 -->
          <template v-if="activeTab === 'history'">
            <!-- 检索表单 -->
            <div style="margin-bottom:16px;padding:12px 16px;background:#f8fafc;border-radius:6px;">
              <el-form :inline="true" :model="searchParams" size="default">
                <el-form-item label="就诊日期">
                  <el-date-picker
                    v-model="searchParams.startDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="开始日期"
                    style="width:150px"
                  />
                  <span style="margin:0 6px;color:#909399">-</span>
                  <el-date-picker
                    v-model="searchParams.endDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="结束日期"
                    style="width:150px"
                  />
                </el-form-item>
                <el-form-item label="患者姓名">
                  <el-input
                    v-model="searchParams.patientName"
                    placeholder="请输入患者姓名"
                    clearable
                    style="width:180px"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="loadHistory">查询</el-button>
                  <el-button @click="resetSearch">重置</el-button>
                </el-form-item>
              </el-form>
            </div>

            <el-empty v-if="historyList.length === 0 && !loading" description="暂无历史诊疗记录" />
            <el-table v-else :data="historyList" stripe style="width:100%" v-loading="loading">
              <el-table-column prop="id" label="诊疗编号" width="90" />
              <el-table-column prop="patientName" label="患者姓名" width="100" />
              <el-table-column prop="deptName" label="科室" width="100" />
              <el-table-column prop="registerDate" label="就诊日期" width="120" />
              <el-table-column prop="timeSlot" label="就诊时段" width="160" />
              <el-table-column prop="diagnosisResult" label="诊断结果" min-width="180" show-overflow-tooltip />
              <el-table-column prop="treatmentTime" label="诊疗时间" width="170" />
            </el-table>
          </template>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.consultation-page {
  min-height: 100vh;
  background: #f4f6fb;
  padding-bottom: 40px;
}
.topbar {
  display: flex;
  align-items: center;
  padding: 12px 28px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-bottom: 20px;
}
.topbar-left, .topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 180px;
}
.topbar-right { justify-content: flex-end; }
.topbar-title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}
.content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}
.active-treatment-card {
  margin-bottom: 20px;
  border-left: 4px solid #409eff;
}
.prescription-section {
  margin-top: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}
.drug-selector {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.prescription-items {
  margin-top: 12px;
}
</style>