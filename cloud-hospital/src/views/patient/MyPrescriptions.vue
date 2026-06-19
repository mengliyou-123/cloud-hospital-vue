<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPatientPrescriptionsApi, getPrescriptionDetailApi } from '../../api/patient-query'
import { getPatientPayOrdersApi, payOrderApi } from '../../api/patient-query'
import type { PrescriptionVO, PayOrderVO, PrescriptionItemVO } from '../../types'

const router = useRouter()

const activeTab = ref<'prescriptions' | 'payments'>('prescriptions')
const prescriptions = ref<PrescriptionVO[]>([])
const payOrders = ref<PayOrderVO[]>([])
const loading = ref(false)

const detailVisible = ref(false)
const detailPrescription = ref<PrescriptionVO | null>(null)
const detailLoading = ref(false)

onMounted(() => {
  loadPrescriptions()
})

async function loadPrescriptions() {
  loading.value = true
  try {
    const res = await getPatientPrescriptionsApi()
    if (res.code === 200) {
      prescriptions.value = res.data || []
    }
  } finally {
    loading.value = false
  }
}

async function loadPayOrders() {
  loading.value = true
  try {
    const res = await getPatientPayOrdersApi()
    if (res.code === 200) {
      payOrders.value = res.data || []
    }
  } finally {
    loading.value = false
  }
}

function handleTabChange(tab: string) {
  activeTab.value = tab as 'prescriptions' | 'payments'
  if (tab === 'payments') {
    loadPayOrders()
  }
}

async function showDetail(prescription: PrescriptionVO) {
  detailLoading.value = true
  detailVisible.value = true
  try {
    const res = await getPrescriptionDetailApi(prescription.id)
    if (res.code === 200) {
      detailPrescription.value = res.data
    }
  } finally {
    detailLoading.value = false
  }
}

async function handlePay(order: PayOrderVO) {
  try {
    await ElMessageBox.confirm(
      `确认缴纳 ¥${order.totalFee.toFixed(2)} 费用吗？`,
      '确认缴费',
      { confirmButtonText: '确认缴费', cancelButtonText: '取消', type: 'info' }
    )
  } catch {
    return
  }
  const res = await payOrderApi(order.id)
  if (res.code === 200) {
    ElMessage.success('缴费成功')
    loadPayOrders()
  }
}

function getPrescriptionStatusTag(status: number) {
  if (status === 0) return { text: '待配药', type: 'warning' as const }
  if (status === 1) return { text: '已配药', type: 'success' as const }
  return { text: '已作废', type: 'info' as const }
}

function getPayStatusTag(status: number) {
  if (status === 0) return { text: '待缴费', type: 'danger' as const }
  if (status === 1) return { text: '已缴费', type: 'success' as const }
  return { text: '已作废', type: 'info' as const }
}

function getPayTypeText(type: number) {
  if (type === 1) return '线下'
  if (type === 2) return '线上'
  return '未知'
}
</script>

<template>
  <div class="prescriptions-page">
    <header class="page-header">
      <div class="page-header-inner">
        <el-button text @click="router.push('/patient/home')">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回首页</span>
        </el-button>
        <h1 class="page-title">处方与缴费</h1>
        <div></div>
      </div>
    </header>

    <div class="content">
      <div class="main-card">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="custom-tabs">
          <el-tab-pane name="prescriptions">
            <template #label>
              <span class="tab-label">
                <el-icon><Document /></el-icon>
                我的处方单
              </span>
            </template>
          </el-tab-pane>
          <el-tab-pane name="payments">
            <template #label>
              <span class="tab-label">
                <el-icon><Wallet /></el-icon>
                缴费记录
              </span>
            </template>
          </el-tab-pane>
        </el-tabs>

        <div v-loading="loading" class="tab-content">
          <!-- 处方列表 -->
          <template v-if="activeTab === 'prescriptions'">
            <el-empty v-if="prescriptions.length === 0 && !loading" description="暂无处方记录" />
            <el-table v-else :data="prescriptions" stripe style="width:100%">
              <el-table-column prop="id" label="处方编号" min-width="80" />
              <el-table-column prop="doctorName" label="开方医生" min-width="90" />
              <el-table-column prop="diagnosisResult" label="诊断结果" min-width="150" show-overflow-tooltip />
              <el-table-column label="处方金额" min-width="100">
                <template #default="{ row }">
                  <span class="amount">¥{{ row.totalMoney?.toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" min-width="80">
                <template #default="{ row }">
                  <el-tag :type="getPrescriptionStatusTag(row.prescriptionStatus).type" size="small">
                    {{ getPrescriptionStatusTag(row.prescriptionStatus).text }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="prescriptionTime" label="开方时间" min-width="150" />
              <el-table-column label="操作" min-width="90">
                <template #default="{ row }">
                  <el-button type="primary" size="small" text @click="showDetail(row)">
                    查看详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>

          <!-- 缴费记录 -->
          <template v-if="activeTab === 'payments'">
            <el-empty v-if="payOrders.length === 0 && !loading" description="暂无缴费记录" />
            <el-table v-else :data="payOrders" stripe style="width:100%">
              <el-table-column prop="id" label="缴费单编号" min-width="90" />
              <el-table-column prop="doctorName" label="接诊医生" min-width="90" />
              <el-table-column prop="deptName" label="科室" min-width="80" />
              <el-table-column label="金额" min-width="90">
                <template #default="{ row }">
                  <span class="amount-danger">¥{{ row.totalFee?.toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="支付方式" min-width="80">
                <template #default="{ row }">{{ getPayTypeText(row.payType) }}</template>
              </el-table-column>
              <el-table-column label="状态" min-width="80">
                <template #default="{ row }">
                  <el-tag :type="getPayStatusTag(row.payStatus).type" size="small">
                    {{ getPayStatusTag(row.payStatus).text }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="payTime" label="缴费时间" min-width="150">
                <template #default="{ row }">{{ row.payTime || '--' }}</template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" min-width="150" />
              <el-table-column label="操作" min-width="90">
                <template #default="{ row }">
                  <el-button
                    v-if="row.payStatus === 0"
                    type="success"
                    size="small"
                    @click="handlePay(row)"
                  >
                    去缴费
                  </el-button>
                  <span v-else style="color:#cbd5e1">--</span>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </div>
      </div>

      <!-- 处方详情弹窗 -->
      <el-dialog v-model="detailVisible" title="处方详情" width="650px" destroy-on-close>
        <div v-loading="detailLoading">
          <template v-if="detailPrescription">
            <el-descriptions :column="2" border size="small" class="desc-block">
              <el-descriptions-item label="处方编号">{{ detailPrescription.id }}</el-descriptions-item>
              <el-descriptions-item label="开方医生">{{ detailPrescription.doctorName }}</el-descriptions-item>
              <el-descriptions-item label="诊断结果" :span="2">{{ detailPrescription.diagnosisResult }}</el-descriptions-item>
              <el-descriptions-item label="开方时间">{{ detailPrescription.prescriptionTime }}</el-descriptions-item>
              <el-descriptions-item label="处方金额">
                <span class="amount-danger">¥{{ detailPrescription.totalMoney?.toFixed(2) }}</span>
              </el-descriptions-item>
            </el-descriptions>

            <el-divider content-position="left">
              <span style="font-weight:600;font-size:14px">药品明细</span>
            </el-divider>

            <el-table v-if="detailPrescription.items?.length" :data="detailPrescription.items" stripe size="small">
              <el-table-column type="index" label="序号" width="60" />
              <el-table-column prop="drugName" label="药品名称" min-width="140" />
              <el-table-column prop="drugSpec" label="规格" width="120" />
              <el-table-column prop="manufacturer" label="厂家" min-width="120" />
              <el-table-column prop="drugNum" label="数量" width="70" />
              <el-table-column label="单价" width="90">
                <template #default="{ row }">¥{{ row.drugPrice?.toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="小计" width="100">
                <template #default="{ row }">¥{{ (row.drugPrice * row.drugNum).toFixed(2) }}</template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="无药品明细" :image-size="60" />
          </template>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<style scoped>
.prescriptions-page {
  min-height: 100vh;
  background: var(--h-bg);
  display: flex;
  flex-direction: column;
}

.page-header {
  background: #fff;
  border-bottom: 1px solid var(--h-border);
  position: relative;
  flex-shrink: 0;
}

.page-header-inner {
  max-width: 1200px;
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

.content {
  flex: 1;
  overflow-y: auto;
}

.main-card {
  background: #fff;
  border-radius: var(--h-radius-md);
  border: 1px solid var(--h-border);
  padding: 24px;
  box-shadow: var(--h-shadow);
}

.custom-tabs {
  margin-bottom: 20px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-content {
  min-height: 200px;
}

.amount {
  font-weight: 600;
  color: var(--h-text);
}

.amount-danger {
  font-weight: 700;
  color: var(--h-danger);
}

.desc-block {
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .page-header-inner {
    padding: 0 16px;
    height: 52px;
  }

  .page-title {
    font-size: 16px;
  }

  .content {
    padding: 18px;
  }

  .main-card {
    padding: 18px 14px;
    border-radius: var(--h-radius);
  }

  .custom-tabs {
    margin-bottom: 12px;
  }
}
</style>