<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDispenseListApi, getDispenseDetailApi, createDispenseApi,
  completeDispenseApi, deliverDrugApi
} from '../../api/pharmacy'
import type { DrugDispense, DrugDispenseItem } from '../../api/pharmacy'

const dispenseList = ref<DrugDispense[]>([])
const loading = ref(false)
const params = ref({ status: undefined as number | undefined, startDate: '', endDate: '' })

const statusMap: Record<number, { text: string; type: string }> = {
  1: { text: '待配药', type: 'warning' },
  2: { text: '已配药', type: 'primary' },
  4: { text: '已发药', type: 'success' }
}

async function loadDispenses() {
  loading.value = true
  try {
    const res = await getDispenseListApi(params.value)
    if (res.code === 200) dispenseList.value = res.data || []
  } finally { loading.value = false }
}

/* ========= 查看详情 ========= */
const detailDialog = ref(false)
const currentDispense = ref<DrugDispense | null>(null)
const currentDispenseItems = ref<DrugDispenseItem[]>([])
async function openDetail(id: number) {
  const res = await getDispenseDetailApi(id)
  if (res.code === 200) {
    currentDispense.value = res.data.dispense
    currentDispenseItems.value = res.data.items || []
    detailDialog.value = true
  }
}

async function handleComplete(id: number) {
  try {
    await ElMessageBox.confirm('确认完成配药？完成后将自动扣减对应药品库存。', '确认', { type: 'info' })
    const res = await completeDispenseApi(id)
    if (res.code === 200) { ElMessage.success('配药完成，库存已扣减'); detailDialog.value = false; loadDispenses() }
  } catch {}
}

const deliverDialog = ref(false)
const deliverForm = ref({ receivePerson: '' })
function openDeliver(id: number) {
  deliverForm.value = { receivePerson: '' }
  const res = getDispenseDetailApi(id)
  res.then((r) => {
    if (r.code === 200) {
      currentDispense.value = r.data.dispense
      currentDispenseItems.value = r.data.items || []
      deliverDialog.value = true
    }
  })
}

async function submitDeliver() {
  if (!deliverForm.value.receivePerson) { ElMessage.warning('请输入领药人'); return }
  if (!currentDispense.value) return
  const res = await deliverDrugApi(currentDispense.value.id, deliverForm.value.receivePerson)
  if (res.code === 200) { ElMessage.success('已发药'); deliverDialog.value = false; loadDispenses() }
}

onMounted(() => { loadDispenses() })
</script>

<template>
  <div class="page">
    <h2 class="page-title">💊 处方配药管理</h2>

    <div class="toolbar">
      <el-select v-model="params.status" placeholder="状态" style="width:140px" clearable>
        <el-option label="待配药" :value="1" />
        <el-option label="已配药" :value="2" />
        <el-option label="已发药" :value="4" />
      </el-select>
      <el-date-picker v-model="params.startDate" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" style="width:150px" />
      <el-date-picker v-model="params.endDate" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" style="width:150px" />
      <el-button type="primary" @click="loadDispenses">查询</el-button>
    </div>

    <el-table :data="dispenseList" v-loading="loading" stripe border style="width:100%">
      <el-table-column prop="dispenseNo" label="配药单号" width="200" />
      <el-table-column prop="patientName" label="患者姓名" width="120" />
      <el-table-column prop="doctorName" label="开方医生" width="120" />
      <el-table-column prop="totalItemCount" label="药品种类" width="100" />
      <el-table-column prop="totalQuantity" label="总数量" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.type || 'info'">{{ statusMap[row.status]?.text || '未知' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="pharmacistName" label="配药师" width="120" />
      <el-table-column prop="dispenseTime" label="配药时间" width="180" />
      <el-table-column prop="receivePerson" label="领药人" width="120" />
      <el-table-column prop="deliverTime" label="发药时间" width="180" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row.id)">查看</el-button>
          <el-button v-if="row.status === 1" size="small" type="primary" @click="handleComplete(row.id)">完成配药</el-button>
          <el-button v-if="row.status === 2" size="small" type="success" @click="openDeliver(row.id)">发药</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && dispenseList.length === 0" description="暂无配药单" />

    <!-- 配药单详情 弹窗 -->
    <el-dialog v-model="detailDialog" :title="`配药单详情 - ${currentDispense?.dispenseNo || ''}`" width="800px">
      <div v-if="currentDispense">
        <el-descriptions :column="3" border size="small" style="margin-bottom:12px">
          <el-descriptions-item label="配药单号">{{ currentDispense.dispenseNo }}</el-descriptions-item>
          <el-descriptions-item label="患者">{{ currentDispense.patientName }}</el-descriptions-item>
          <el-descriptions-item label="开方医生">{{ currentDispense.doctorName }}</el-descriptions-item>
          <el-descriptions-item label="药品种类">{{ currentDispense.totalItemCount }}</el-descriptions-item>
          <el-descriptions-item label="总数量">{{ currentDispense.totalQuantity }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="statusMap[currentDispense.status]?.type || 'info'">{{ statusMap[currentDispense.status]?.text }}</el-tag></el-descriptions-item>
          <el-descriptions-item v-if="currentDispense.pharmacistName" label="配药师">{{ currentDispense.pharmacistName }} ({{ currentDispense.dispenseTime }})</el-descriptions-item>
          <el-descriptions-item v-if="currentDispense.receivePerson" label="领药人">{{ currentDispense.receivePerson }} ({{ currentDispense.deliverTime }})</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentDispense.createTime }}</el-descriptions-item>
        </el-descriptions>

        <h3>药品明细</h3>
        <el-table :data="currentDispenseItems" border stripe size="small" style="width:100%">
          <el-table-column prop="drugName" label="药品名称" width="180" />
          <el-table-column prop="drugSpec" label="规格" width="140" />
          <el-table-column prop="drugType" label="类别" width="100" />
          <el-table-column prop="quantity" label="数量" width="100" />
          <el-table-column prop="unitPrice" label="单价" width="110">
            <template #default="{ row }">¥ {{ Number(row.unitPrice).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="totalPrice" label="小计" width="110">
            <template #default="{ row }">¥ {{ Number(row.totalPrice).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="usageDosage" label="用法用量" min-width="180" show-overflow-tooltip />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="detailDialog = false">关闭</el-button>
        <el-button v-if="currentDispense?.status === 1" type="primary" @click="handleComplete(currentDispense.id)">完成配药</el-button>
        <el-button v-if="currentDispense?.status === 2" type="success" @click="openDeliver(currentDispense.id)">发药</el-button>
      </template>
    </el-dialog>

    <!-- 发药 弹窗 -->
    <el-dialog v-model="deliverDialog" title="确认发药" width="480px">
      <el-form :model="deliverForm" label-width="100px">
        <el-form-item label="患者姓名"><el-input :value="currentDispense?.patientName" disabled /></el-form-item>
        <el-form-item label="配药单号"><el-input :value="currentDispense?.dispenseNo" disabled /></el-form-item>
        <el-form-item label="领药人">
          <el-input v-model="deliverForm.receivePerson" placeholder="请输入领药人姓名（可为患者本人或家属）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deliverDialog = false">取消</el-button>
        <el-button type="success" @click="submitDeliver">确认发药</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { padding: 20px; background: var(--h-bg); min-height: calc(100vh - 40px); }
.page-title { margin-bottom: 20px; color: var(--h-text); }
.toolbar { display: flex; gap: 10px; margin-bottom: 16px; align-items: center; }
</style>
