<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPurchaseListApi, getPurchaseDetailApi, createPurchaseApi,
  approvePurchaseApi, rejectPurchaseApi, confirmStorageApi,
  getDrugListApi
} from '../../api/pharmacy'
import type { DrugPurchase, DrugPurchaseItem, Drug } from '../../api/pharmacy'

const purchaseList = ref<DrugPurchase[]>([])
const loading = ref(false)
const params = ref({ status: undefined as number | undefined, startDate: '', endDate: '' })

const statusMap: Record<number, { text: string; type: string }> = {
  1: { text: '待审核', type: 'warning' },
  2: { text: '已审核', type: 'primary' },
  3: { text: '已入库', type: 'success' },
  4: { text: '已驳回', type: 'info' }
}

async function loadPurchases() {
  loading.value = true
  try {
    const res = await getPurchaseListApi(params.value)
    if (res.code === 200) purchaseList.value = res.data || []
  } finally { loading.value = false }
}

/* ========= 新建采购单 ========= */
const purchaseDialog = ref(false)
const purchaseForm = ref({
  supplier: '', remark: '',
  items: [] as { drugId: number; drugName: string; drugSpec?: string; quantity: number; unitPrice: number; totalPrice: number }[]
})

const allDrugs = ref<Drug[]>([])
async function loadAllDrugs() {
  const res = await getDrugListApi({ status: 1 })
  if (res.code === 200) allDrugs.value = res.data || []
}

function openNewPurchase() {
  purchaseForm.value = { supplier: '', remark: '', items: [] }
  purchaseDialog.value = true
  loadAllDrugs()
}

function addPurchaseItem() {
  purchaseForm.value.items.push({ drugId: 0, drugName: '', drugSpec: '', quantity: 1, unitPrice: 0, totalPrice: 0 })
}

function removeItem(idx: number) { purchaseForm.value.items.splice(idx, 1) }

function onDrugSelect(item: any, idx: number) {
  const drug = allDrugs.value.find(d => d.id === item.drugId)
  if (drug) {
    item.drugName = drug.drugName
    item.drugSpec = drug.drugSpec
  }
}

function computeTotalPrice(item: any) {
  item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0)
}

async function submitPurchase() {
  if (!purchaseForm.value.supplier) { ElMessage.warning('请输入供应商'); return }
  if (purchaseForm.value.items.length === 0) { ElMessage.warning('请添加采购明细'); return }
  for (const item of purchaseForm.value.items) {
    if (!item.drugId || !item.drugName) { ElMessage.warning('请选择药品'); return }
    if (!item.quantity || item.quantity <= 0) { ElMessage.warning('请输入采购数量'); return }
  }
  const res = await createPurchaseApi({
    supplier: purchaseForm.value.supplier,
    remark: purchaseForm.value.remark,
    items: purchaseForm.value.items
  })
  if (res.code === 200) { ElMessage.success('采购单已创建'); purchaseDialog.value = false; loadPurchases() }
}

/* ========= 采购单详情 ========= */
const detailDialog = ref(false)
const currentPurchase = ref<DrugPurchase | null>(null)
const currentPurchaseItems = ref<DrugPurchaseItem[]>([])

async function openDetail(id: number) {
  const res = await getPurchaseDetailApi(id)
  if (res.code === 200) {
    currentPurchase.value = res.data.purchase
    currentPurchaseItems.value = res.data.items || []
    detailDialog.value = true
  }
}

async function handleApprove(id: number) {
  try {
    await ElMessageBox.confirm('确认审核通过？', '确认', { type: 'info' })
    const res = await approvePurchaseApi(id, '')
    if (res.code === 200) { ElMessage.success('审核通过'); loadPurchases() }
  } catch {}
}

async function handleReject(id: number) {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回采购单', { inputValue: '' })
    const res = await rejectPurchaseApi(id, value)
    if (res.code === 200) { ElMessage.success('已驳回'); loadPurchases() }
  } catch {}
}

async function handleStorage(id: number) {
  try {
    await ElMessageBox.confirm('确认入库？入库后将自动更新各药品库存。', '确认', { type: 'success' })
    const res = await confirmStorageApi(id)
    if (res.code === 200) { ElMessage.success('入库成功，库存已更新'); loadPurchases() }
  } catch {}
}

onMounted(() => { loadPurchases() })
</script>

<template>
  <div class="page">
    <h2 class="page-title">🛒 药品采购管理</h2>

    <div class="toolbar">
      <el-select v-model="params.status" placeholder="状态" style="width:140px" clearable>
        <el-option label="待审核" :value="1" />
        <el-option label="已审核" :value="2" />
        <el-option label="已入库" :value="3" />
        <el-option label="已驳回" :value="4" />
      </el-select>
      <el-date-picker v-model="params.startDate" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" style="width:150px" />
      <el-date-picker v-model="params.endDate" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" style="width:150px" />
      <el-button type="primary" @click="loadPurchases">查询</el-button>
      <el-button type="success" @click="openNewPurchase">+ 新建采购单</el-button>
    </div>

    <el-table :data="purchaseList" v-loading="loading" stripe border style="width:100%">
      <el-table-column prop="purchaseNo" label="采购单号" width="200" />
      <el-table-column prop="supplier" label="供应商" width="180" />
      <el-table-column prop="applicantName" label="申请人" width="110" />
      <el-table-column prop="totalQuantity" label="总数量" width="100" />
      <el-table-column prop="totalAmount" label="总金额(¥)" width="120">
        <template #default="{ row }">¥ {{ Number(row.totalAmount).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.type || 'info'">{{ statusMap[row.status]?.text || '未知' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="approverName" label="审核人" width="110" />
      <el-table-column prop="inStorageTime" label="入库时间" width="180" />
      <el-table-column prop="inStorageOperator" label="入库操作人" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row.id)">查看详情</el-button>
          <el-button v-if="row.status === 1" size="small" type="primary" @click="handleApprove(row.id)">审核通过</el-button>
          <el-button v-if="row.status === 1" size="small" type="danger" @click="handleReject(row.id)">驳回</el-button>
          <el-button v-if="row.status === 2" size="small" type="success" @click="handleStorage(row.id)">确认入库</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="!loading && purchaseList.length === 0" description="暂无采购单" />

    <!-- 新建采购单 弹窗 -->
    <el-dialog v-model="purchaseDialog" title="新建采购单" width="800px">
      <el-form :model="purchaseForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="供应商"><el-input v-model="purchaseForm.supplier" placeholder="如XX制药有限公司" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="备注"><el-input v-model="purchaseForm.remark" /></el-form-item></el-col>
        </el-row>
        <el-divider content-position="left">采购明细</el-divider>
        <el-table :data="purchaseForm.items" border stripe style="width:100%">
          <el-table-column label="药品" width="260">
            <template #default="{ row }">
              <el-select v-model="row.drugId" placeholder="选择药品" style="width:100%" @change="onDrugSelect(row, $event)" filterable>
                <el-option v-for="drug in allDrugs" :key="drug.id" :label="drug.drugName + ' - ' + drug.drugSpec" :value="drug.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" style="width:100%" @change="computeTotalPrice(row)" />
            </template>
          </el-table-column>
          <el-table-column label="单价(¥)" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.unitPrice" :min="0" :precision="2" :step="0.5" style="width:100%" @change="computeTotalPrice(row)" />
            </template>
          </el-table-column>
          <el-table-column label="小计(¥)" width="140">
            <template #default="{ row }">¥ {{ Number(row.totalPrice).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ $index }"><el-button type="danger" size="small" @click="removeItem($index)">删除</el-button></template>
          </el-table-column>
        </el-table>
        <div style="margin-top:12px;text-align:right"><el-button type="primary" @click="addPurchaseItem">+ 添加一行</el-button></div>
      </el-form>
      <template #footer>
        <el-button @click="purchaseDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPurchase">提交采购</el-button>
      </template>
    </el-dialog>

    <!-- 采购单详情 弹窗 -->
    <el-dialog v-model="detailDialog" :title="`采购单详情 - ${currentPurchase?.purchaseNo || ''}`" width="800px">
      <div v-if="currentPurchase">
        <el-descriptions :column="3" border size="small" style="margin-bottom:12px">
          <el-descriptions-item label="采购单号">{{ currentPurchase.purchaseNo }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ currentPurchase.supplier }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentPurchase.applicantName }}</el-descriptions-item>
          <el-descriptions-item label="总数量">{{ currentPurchase.totalQuantity }}</el-descriptions-item>
          <el-descriptions-item label="总金额">¥ {{ Number(currentPurchase.totalAmount).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="statusMap[currentPurchase.status]?.type || 'info'">{{ statusMap[currentPurchase.status]?.text }}</el-tag></el-descriptions-item>
          <el-descriptions-item v-if="currentPurchase.approverName" label="审核人">{{ currentPurchase.approverName }} ({{ currentPurchase.approveTime }})</el-descriptions-item>
          <el-descriptions-item v-if="currentPurchase.approveRemark" label="审核备注">{{ currentPurchase.approveRemark }}</el-descriptions-item>
          <el-descriptions-item v-if="currentPurchase.inStorageOperator" label="入库">{{ currentPurchase.inStorageOperator }} ({{ currentPurchase.inStorageTime }})</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentPurchase.createTime }}</el-descriptions-item>
        </el-descriptions>

        <h3>采购明细</h3>
        <el-table :data="currentPurchaseItems" border stripe size="small" style="width:100%">
          <el-table-column prop="drugName" label="药品名称" width="180" />
          <el-table-column prop="drugSpec" label="规格" width="140" />
          <el-table-column prop="quantity" label="数量" width="100" />
          <el-table-column prop="unitPrice" label="单价" width="120">
            <template #default="{ row }">¥ {{ Number(row.unitPrice).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="totalPrice" label="小计" width="130">
            <template #default="{ row }">¥ {{ Number(row.totalPrice).toFixed(2) }}</template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="detailDialog = false">关闭</el-button>
        <el-button v-if="currentPurchase?.status === 1" size="small" type="primary" @click="handleApprove(currentPurchase.id)">审核通过</el-button>
        <el-button v-if="currentPurchase?.status === 1" size="small" type="danger" @click="handleReject(currentPurchase.id)">驳回</el-button>
        <el-button v-if="currentPurchase?.status === 2" size="small" type="success" @click="handleStorage(currentPurchase.id)">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { padding: 20px; background: var(--h-bg); min-height: calc(100vh - 40px); }
.page-title { margin-bottom: 20px; color: var(--h-text); }
.toolbar { display: flex; gap: 10px; margin-bottom: 16px; align-items: center; }
</style>
