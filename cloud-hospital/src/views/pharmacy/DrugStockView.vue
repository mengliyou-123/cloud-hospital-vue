<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDrugListApi,
  addDrugApi,
  updateDrugApi,
  removeDrugApi,
  getLowStockDrugsApi,
  getExpiringDrugsApi,
  getExpiredDrugsApi,
  getStockLogListApi,
  addStockLogApi,
  getInventoryListApi,
  getInventoryDetailApi,
  getInventoryReportApi,
  createInventoryApi,
  updateInventoryItemApi,
  startInventoryApi,
  pauseInventoryApi,
  resumeInventoryApi,
  cancelInventoryApi,
  finishInventoryApi
} from '../../api/pharmacy'
import type { Drug, DrugStockLog, DrugInventory, DrugInventoryItem } from '../../api/pharmacy'

const activeTab = ref('list')
const statusMap: Record<number, string> = { 0: '下架', 1: '上架' }

/* ========= 药品列表 ========= */
const drugList = ref<Drug[]>([])
const loading = ref(false)
const searchParams = ref({ drugName: '', drugType: '', status: 1 })

async function loadDrugs() {
  loading.value = true
  try {
    const res = await getDrugListApi(searchParams.value)
    if (res.code === 200) drugList.value = res.data || []
  } finally {
    loading.value = false
  }
}

/* 新增/编辑药品弹窗 */
const drugDialog = ref(false)
const drugForm = ref<Partial<Drug>>({
  drugName: '',
  drugSpec: '',
  drugType: '',
  price: 0,
  stockQuantity: 0,
  warningStock: 10,
  expireWarningDays: 60,
  stockLocation: '',
  manufacturer: '',
  validTime: '',
  usage: '',
  status: 1
})

function openAddDrug() {
  drugForm.value = {
    drugName: '',
    drugSpec: '',
    drugType: '',
    price: 0,
    stockQuantity: 0,
    warningStock: 10,
    expireWarningDays: 60,
    stockLocation: '',
    manufacturer: '',
    validTime: '',
    usage: '',
    status: 1
  }
  drugDialog.value = true
}

function openEditDrug(drug: Drug) {
  drugForm.value = { ...drug }
  drugDialog.value = true
}

async function saveDrug() {
  if (!drugForm.value.drugName) {
    ElMessage.warning('请输入药品名称')
    return
  }

  if (drugForm.value.id) {
    const res = await updateDrugApi(drugForm.value.id, drugForm.value)
    if (res.code === 200) {
      ElMessage.success('更新成功')
      drugDialog.value = false
      loadDrugs()
    }
  } else {
    const res = await addDrugApi(drugForm.value)
    if (res.code === 200) {
      ElMessage.success('添加成功')
      drugDialog.value = false
      loadDrugs()
    }
  }
}

async function handleRemoveDrug(drug: Drug) {
  try {
    await ElMessageBox.confirm(`确认下架药品【${drug.drugName}】吗？`, '确认', {
      type: 'warning'
    })
    const res = await removeDrugApi(drug.id)
    if (res.code === 200) {
      ElMessage.success('已下架')
      loadDrugs()
    }
  } catch {}
}

/* ========= 低库存 / 即将过期 / 已过期预警 ========= */
const lowStockList = ref<Drug[]>([])
const expiringList = ref<Drug[]>([])
const expiredList = ref<Drug[]>([])

async function loadWarnings() {
  const res1 = await getLowStockDrugsApi()
  if (res1.code === 200) lowStockList.value = res1.data || []

  const res2 = await getExpiringDrugsApi()
  if (res2.code === 200) expiringList.value = res2.data || []

  const res3 = await getExpiredDrugsApi()
  if (res3.code === 200) expiredList.value = res3.data || []
}

/* ========= 库存变动记录 ========= */
const stockLogList = ref<DrugStockLog[]>([])
const logParams = ref({
  drugId: undefined as number | undefined,
  changeType: '',
  startDate: '',
  endDate: ''
})

async function loadStockLogs() {
  loading.value = true
  try {
    const res = await getStockLogListApi(logParams.value)
    if (res.code === 200) stockLogList.value = res.data || []
  } finally {
    loading.value = false
  }
}

const stockLogDialog = ref(false)
const stockLogForm = ref({
  drugId: undefined as number | undefined,
  changeType: '入库',
  changeQuantity: 1,
  remark: ''
})

function openAddStockLog(drugId?: number) {
  stockLogForm.value = {
    drugId: drugId || undefined,
    changeType: '入库',
    changeQuantity: 1,
    remark: ''
  }
  stockLogDialog.value = true
}

async function saveStockLog() {
  if (!stockLogForm.value.drugId) {
    ElMessage.warning('请选择药品')
    return
  }

  if (!stockLogForm.value.changeQuantity || stockLogForm.value.changeQuantity <= 0) {
    ElMessage.warning('请输入正确的变动数量')
    return
  }

  const res = await addStockLogApi(stockLogForm.value as any)
  if (res.code === 200) {
    ElMessage.success('已记录库存变动')
    stockLogDialog.value = false
    loadStockLogs()
  }
}

/* ========= 盘点管理 ========= */
const inventoryList = ref<DrugInventory[]>([])
const invParams = ref({
  status: undefined as number | undefined,
  startDate: '',
  endDate: ''
})

async function loadInventories() {
  loading.value = true
  try {
    const res = await getInventoryListApi(invParams.value)
    if (res.code === 200) inventoryList.value = res.data || []
  } finally {
    loading.value = false
  }
}

/* 盘点详情弹窗 */
const invDetailDialog = ref(false)
const currentInventory = ref<DrugInventory | null>(null)
const currentInventoryItems = ref<DrugInventoryItem[]>([])

const invStatusMap: Record<number, string> = { 0: '草稿', 1: '进行中', 2: '已暂停', 3: '已完成', 4: '已作废' }
const invStatusTypeMap: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'info', 3: 'success', 4: 'danger' }

const diffReasonOptions = [
  { label: '正常损耗', value: '正常损耗' },
  { label: '被盗', value: '被盗' },
  { label: '过期报损', value: '过期报损' },
  { label: '入库错误', value: '入库错误' },
  { label: '出库错误', value: '出库错误' },
  { label: '其他', value: '其他' },
]

const createInvDialog = ref(false)
const createInvForm = reactive({
  inventoryType: '普通盘点',
  drugType: '',
  stockLocation: '',
  remark: '',
  drugIds: [] as number[],
})

const reportDialog = ref(false)
const inventoryReport = ref<{
  statistics: {
    totalItems: number
    matchCount: number
    profitCount: number
    lossCount: number
    totalSystemQty: number
    totalActualQty: number
    totalSystemAmount: number
    totalActualAmount: number
    profitTop5: DrugInventoryItem[]
    lossTop5: DrugInventoryItem[]
  }
} | null>(null)

async function handleCreateInventory() {
  Object.assign(createInvForm, { inventoryType: '普通盘点', drugType: '', stockLocation: '', remark: '', drugIds: [] })
  createInvDialog.value = true
}

async function saveCreateInventory() {
  try {
    const res = await createInventoryApi({
      inventoryType: createInvForm.inventoryType,
      drugType: createInvForm.drugType || undefined,
      stockLocation: createInvForm.stockLocation || undefined,
      remark: createInvForm.remark || undefined,
      drugIds: createInvForm.drugIds.length > 0 ? createInvForm.drugIds : undefined,
    })
    if (res.code === 200) {
      ElMessage.success('盘点单创建成功')
      createInvDialog.value = false
      loadInventories()
    }
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

async function openInventoryDetail(id: number) {
  const res = await getInventoryDetailApi(id)
  if (res.code === 200) {
    currentInventory.value = res.data.inventory
    currentInventoryItems.value = res.data.items
    invDetailDialog.value = true
  }
}

async function handleUpdateItem(row: DrugInventoryItem) {
  if (!currentInventory.value || currentInventory.value.status !== 1) return
  try {
    await updateInventoryItemApi({
      id: row.id,
      actualQuantity: row.actualQuantity,
      diffReason: row.diffReason,
      remark: row.remark,
    })
  } catch {}
}

async function handleStartInventory(id: number) {
  try {
    await ElMessageBox.confirm('确认开始此盘点吗？开始后可以录入实际盘点数量。', '确认', { type: 'info' })
    const res = await startInventoryApi(id)
    if (res.code === 200) {
      ElMessage.success('盘点已开始')
      loadInventories()
    }
  } catch {}
}

async function handlePauseInventory(id: number) {
  try {
    await ElMessageBox.confirm('确认暂停此盘点吗？暂停后可以继续。', '确认', { type: 'info' })
    const res = await pauseInventoryApi(id)
    if (res.code === 200) {
      ElMessage.success('盘点已暂停')
      loadInventories()
    }
  } catch {}
}

async function handleResumeInventory(id: number) {
  try {
    const res = await resumeInventoryApi(id)
    if (res.code === 200) {
      ElMessage.success('盘点已继续')
      loadInventories()
    }
  } catch {}
}

async function handleCancelInventory(id: number) {
  try {
    await ElMessageBox.confirm('确认作废此盘点单吗？作废后不可恢复。', '确认', { type: 'warning' })
    const res = await cancelInventoryApi(id)
    if (res.code === 200) {
      ElMessage.success('盘点单已作废')
      loadInventories()
    }
  } catch {}
}

async function handleFinishInventory(id: number) {
  try {
    await ElMessageBox.confirm('确认完成此盘点吗？完成后将根据差异自动更新库存。', '确认', {
      type: 'warning'
    })
    const res = await finishInventoryApi(id)
    if (res.code === 200) {
      ElMessage.success('盘点完成')
      invDetailDialog.value = false
      loadInventories()
    }
  } catch {}
}

async function handleViewReport(id: number) {
  try {
    const res = await getInventoryReportApi(id)
    if (res.code === 200) {
      inventoryReport.value = res.data
      reportDialog.value = true
    }
  } catch {
    ElMessage.error('获取报表失败')
  }
}

onMounted(() => {
  loadDrugs()
  loadWarnings()
  loadStockLogs()
  loadInventories()
})

function handleTabChange(tab: string) {
  if (tab === 'warning') loadWarnings()
  if (tab === 'log') loadStockLogs()
  if (tab === 'inventory') loadInventories()
}
</script>

<template>
  <div class="page">
    <h2 class="page-title">📦 药品库存管理</h2>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="药品信息" name="list">
        <div class="toolbar">
          <el-input
            v-model="searchParams.drugName"
            placeholder="搜索药品名称"
            style="width: 200px"
            clearable
            @keyup.enter="loadDrugs"
          />

          <el-select
            v-model="searchParams.drugType"
            placeholder="药品类别"
            style="width: 150px"
            clearable
          >
            <el-option label="西药" value="西药" />
            <el-option label="中药" value="中药" />
            <el-option label="中成药" value="中成药" />
            <el-option label="保健品" value="保健品" />
            <el-option label="抗生素" value="抗生素" />
            <el-option label="解热镇痛" value="解热镇痛" />
            <el-option label="维生素" value="维生素" />
          </el-select>

          <el-select
            v-model="searchParams.status"
            placeholder="状态"
            style="width: 120px"
            clearable
          >
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>

          <el-button type="primary" @click="loadDrugs">查询</el-button>
          <el-button type="success" @click="openAddDrug">+ 新增药品</el-button>
        </div>

        <el-table :data="drugList" v-loading="loading" stripe border style="width: 100%">
          <el-table-column prop="drugName" label="药品名称" width="180" />
          <el-table-column prop="drugSpec" label="规格" width="140" />
          <el-table-column prop="drugType" label="类别" width="100" />

          <el-table-column prop="price" label="单价(¥)" width="100">
            <template #default="{ row }">
              ¥ {{ row.price?.toFixed(2) }}
            </template>
          </el-table-column>

          <el-table-column prop="stockQuantity" label="当前库存" width="100">
            <template #default="{ row }">
              <span
                :style="{
                  color: row.stockQuantity <= row.warningStock ? '#f56c6c' : '#303133',
                  fontWeight: 'bold'
                }"
              >
                {{ row.stockQuantity }}
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="warningStock" label="预警阈值" width="90" />
          <el-table-column prop="stockLocation" label="存放位置" width="120" />
          <el-table-column prop="manufacturer" label="生产厂家" width="180" show-overflow-tooltip />
          <el-table-column prop="validTime" label="有效期" width="130" />
          <el-table-column prop="usage" label="用法用量" width="200" show-overflow-tooltip />

          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ statusMap[row.status] || '未知' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <div style="display: flex; gap: 6px; align-items: center; flex-wrap: nowrap;">
                <el-button size="small" @click="openEditDrug(row)">编辑</el-button>
                <el-button size="small" type="warning" @click="openAddStockLog(row.id)">调整库存</el-button>
                <el-button size="small" type="danger" @click="handleRemoveDrug(row)">下架</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="!loading && drugList.length === 0" description="暂无药品数据" />
      </el-tab-pane>

      <el-tab-pane label="预警" name="warning">
        <div class="warning-section">
          <div class="section-header low-stock">
            <span class="section-icon">📦</span>
            <h3>低库存预警</h3>
            <span class="section-count">{{ lowStockList.length }}</span>
          </div>
          <el-table :data="lowStockList" stripe border style="width: 100%">
            <el-table-column prop="drugName" label="药品名称" width="180" />
            <el-table-column prop="drugSpec" label="规格" width="140" />
            <el-table-column prop="stockQuantity" label="当前库存" width="100">
              <template #default="{ row }">
                <span style="color: #f56c6c; font-weight: bold">{{ row.stockQuantity }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="warningStock" label="预警阈值" width="100" />
            <el-table-column prop="manufacturer" label="生产厂家" width="180" show-overflow-tooltip />
            <el-table-column prop="stockLocation" label="存放位置" width="120" />
          </el-table>
          <el-empty v-if="lowStockList.length === 0" description="暂无低库存药品 🎉" />
        </div>

        <div class="warning-section">
          <div class="section-header expiring">
            <span class="section-icon">⏰</span>
            <h3>即将过期预警</h3>
            <span class="section-count">{{ expiringList.length }}</span>
          </div>
          <el-table :data="expiringList" stripe border style="width: 100%">
            <el-table-column prop="drugName" label="药品名称" width="180" />
            <el-table-column prop="drugSpec" label="规格" width="140" />
            <el-table-column prop="stockQuantity" label="当前库存" width="100" />
            <el-table-column prop="validTime" label="有效期" width="130">
              <template #default="{ row }">
                <span style="color: #e6a23c; font-weight: bold">{{ row.validTime }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="manufacturer" label="生产厂家" width="180" show-overflow-tooltip />
            <el-table-column prop="stockLocation" label="存放位置" width="120" />
          </el-table>
          <el-empty v-if="expiringList.length === 0" description="暂无即将过期药品 🎉" />
        </div>

        <div class="warning-section">
          <div class="section-header expired">
            <span class="section-icon">⚠️</span>
            <h3>已过期预警</h3>
            <span class="section-count">{{ expiredList.length }}</span>
          </div>
          <el-table :data="expiredList" stripe border style="width: 100%">
            <el-table-column prop="drugName" label="药品名称" width="180" />
            <el-table-column prop="drugSpec" label="规格" width="140" />
            <el-table-column prop="stockQuantity" label="当前库存" width="100">
              <template #default="{ row }">
                <span style="color: #f56c6c; font-weight: bold">{{ row.stockQuantity }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="validTime" label="过期日期" width="130">
              <template #default="{ row }">
                <span style="color: #f56c6c; font-weight: bold; text-decoration: line-through">{{ row.validTime }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="manufacturer" label="生产厂家" width="180" show-overflow-tooltip />
            <el-table-column prop="stockLocation" label="存放位置" width="120" />
          </el-table>
          <el-empty v-if="expiredList.length === 0" description="暂无已过期药品 🎉" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="库存变动" name="log">
        <div class="toolbar">
          <el-input
            v-model="logParams.drugId"
            placeholder="药品ID"
            style="width: 140px"
            clearable
            @keyup.enter="loadStockLogs"
          />

          <el-select
            v-model="logParams.changeType"
            placeholder="变动类型"
            style="width: 140px"
            clearable
          >
            <el-option label="入库" value="入库" />
            <el-option label="出库" value="出库" />
            <el-option label="损耗" value="损耗" />
            <el-option label="盘点调整" value="盘点调整" />
          </el-select>

          <el-date-picker
            v-model="logParams.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="开始日期"
            style="width: 150px"
          />

          <el-date-picker
            v-model="logParams.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="结束日期"
            style="width: 150px"
          />

          <el-button type="primary" @click="loadStockLogs">查询</el-button>
          <el-button type="success" @click="openAddStockLog()">+ 手动记录</el-button>
        </div>

        <el-table :data="stockLogList" v-loading="loading" stripe border style="width: 100%">
          <el-table-column prop="id" label="编号" width="80" />
          <el-table-column prop="drugName" label="药品名称" width="180" />
          <el-table-column prop="drugSpec" label="规格" width="120" />

          <el-table-column prop="changeType" label="变动类型" width="100">
            <template #default="{ row }">
              <el-tag
                :type="
                  row.changeType === '入库'
                    ? 'success'
                    : row.changeType === '出库'
                      ? 'primary'
                      : row.changeType === '损耗'
                        ? 'danger'
                        : 'warning'
                "
              >
                {{ row.changeType }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="changeQuantity" label="变动数量" width="100" />
          <el-table-column prop="beforeQuantity" label="变动前" width="80" />
          <el-table-column prop="afterQuantity" label="变动后" width="80" />
          <el-table-column prop="relatedType" label="关联来源" width="120" />
          <el-table-column prop="operatorName" label="操作人" width="120" />
          <el-table-column prop="remark" label="备注" width="180" show-overflow-tooltip />
          <el-table-column prop="createTime" label="时间" width="180" />
        </el-table>

        <el-empty v-if="!loading && stockLogList.length === 0" description="暂无库存变动记录" />
      </el-tab-pane>

      <el-tab-pane label="盘点管理" name="inventory">
        <div class="toolbar">
          <el-select v-model="invParams.status" placeholder="状态" style="width: 130px" clearable>
            <el-option label="草稿" :value="0" />
            <el-option label="进行中" :value="1" />
            <el-option label="已暂停" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已作废" :value="4" />
          </el-select>

          <el-date-picker
            v-model="invParams.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="开始日期"
            style="width: 150px"
          />

          <el-date-picker
            v-model="invParams.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="结束日期"
            style="width: 150px"
          />

          <el-button type="primary" @click="loadInventories">查询</el-button>
          <el-button type="success" @click="handleCreateInventory">+ 新建盘点</el-button>
        </div>

        <el-table :data="inventoryList" v-loading="loading" stripe border style="width: 100%">
          <el-table-column prop="inventoryNo" label="盘点单号" width="180" />
          <el-table-column prop="inventoryDate" label="盘点日期" width="130" />
          <el-table-column prop="inventoryType" label="类型" width="100" />
          <el-table-column prop="operatorName" label="操作人" width="120" />
          <el-table-column prop="totalItems" label="盘点品种" width="100" />
          <el-table-column prop="profitQuantity" label="盘盈数量" width="100" />
          <el-table-column prop="lossQuantity" label="盘亏数量" width="100" />
          <el-table-column prop="profitAmount" label="盘盈金额" width="110">
            <template #default="{ row }">
              <span style="color: #67c23a">¥ {{ row.profitAmount?.toFixed(2) || '0.00' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="lossAmount" label="盘亏金额" width="110">
            <template #default="{ row }">
              <span style="color: #f56c6c">¥ {{ row.lossAmount?.toFixed(2) || '0.00' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="diffRate" label="差异率(%)" width="100">
            <template #default="{ row }">
              <span :style="{ color: (row.diffRate || 0) > 5 ? '#f56c6c' : '#909399' }">
                {{ row.diffRate?.toFixed(2) || '0.00' }}
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="invStatusTypeMap[row.status] || 'info'">
                {{ invStatusMap[row.status] || '未知' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="remark" label="备注" width="180" show-overflow-tooltip />
          <el-table-column prop="createTime" label="创建时间" width="180" />

          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openInventoryDetail(row.id)">
                查看明细
              </el-button>

              <el-button v-if="row.status === 3" size="small" type="primary" @click="handleViewReport(row.id)">
                统计报表
              </el-button>

              <el-button v-if="row.status === 0" size="small" type="success" @click="handleStartInventory(row.id)">
                开始盘点
              </el-button>

              <el-button v-if="row.status === 1" size="small" type="info" @click="handlePauseInventory(row.id)">
                暂停
              </el-button>

              <el-button v-if="row.status === 2" size="small" type="warning" @click="handleResumeInventory(row.id)">
                继续
              </el-button>

              <el-button v-if="row.status === 1" size="small" type="success" @click="handleFinishInventory(row.id)">
                完成盘点
              </el-button>

              <el-button v-if="row.status !== 3 && row.status !== 4" size="small" type="danger" @click="handleCancelInventory(row.id)">
                作废
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="!loading && inventoryList.length === 0" description="暂无盘点记录" />
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="drugDialog" :title="drugForm.id ? '编辑药品' : '新增药品'" width="640px">
      <el-form :model="drugForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="药品名称">
              <el-input v-model="drugForm.drugName" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="规格">
              <el-input v-model="drugForm.drugSpec" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="类别">
              <el-input v-model="drugForm.drugType" placeholder="如：西药 / 中药" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="单价">
              <el-input-number
                v-model="drugForm.price"
                :min="0"
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="当前库存">
              <el-input-number v-model="drugForm.stockQuantity" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="预警阈值">
              <el-input-number v-model="drugForm.warningStock" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="存放位置">
              <el-input v-model="drugForm.stockLocation" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="生产厂家">
              <el-input v-model="drugForm.manufacturer" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="有效期">
              <el-date-picker
                v-model="drugForm.validTime"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="drugForm.status" style="width: 100%">
                <el-option label="上架" :value="1" />
                <el-option label="下架" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="用法用量">
              <el-input v-model="drugForm.usage" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="drugDialog = false">取消</el-button>
        <el-button type="primary" @click="saveDrug">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stockLogDialog" title="记录库存变动" width="480px">
      <el-form :model="stockLogForm" label-width="100px">
        <el-form-item label="药品ID">
          <el-input-number v-model="stockLogForm.drugId" :min="1" style="width: 100%" />
        </el-form-item>

        <el-form-item label="变动类型">
          <el-select v-model="stockLogForm.changeType" style="width: 100%">
            <el-option label="入库" value="入库" />
            <el-option label="出库" value="出库" />
            <el-option label="损耗" value="损耗" />
          </el-select>
        </el-form-item>

        <el-form-item label="变动数量">
          <el-input-number v-model="stockLogForm.changeQuantity" :min="1" style="width: 100%" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="stockLogForm.remark" type="textarea" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="stockLogDialog = false">取消</el-button>
        <el-button type="primary" @click="saveStockLog">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="invDetailDialog"
      :title="`盘点单明细 - ${currentInventory?.inventoryNo || ''}`"
      width="1000px"
    >
      <div v-if="currentInventory" style="margin-bottom: 12px">
        <el-descriptions :column="4" border size="small">
          <el-descriptions-item label="盘点单号">
            {{ currentInventory.inventoryNo }}
          </el-descriptions-item>

          <el-descriptions-item label="盘点日期">
            {{ currentInventory.inventoryDate }}
          </el-descriptions-item>

          <el-descriptions-item label="类型">
            {{ currentInventory.inventoryType }}
          </el-descriptions-item>

          <el-descriptions-item label="操作人">
            {{ currentInventory.operatorName }}
          </el-descriptions-item>

          <el-descriptions-item label="品种数">
            {{ currentInventory.totalItems }}
          </el-descriptions-item>

          <el-descriptions-item label="盘盈数量">
            <span style="color: #67c23a">{{ currentInventory.profitQuantity }}</span>
          </el-descriptions-item>

          <el-descriptions-item label="盘亏数量">
            <span style="color: #f56c6c">{{ currentInventory.lossQuantity }}</span>
          </el-descriptions-item>

          <el-descriptions-item label="状态">
            <el-tag :type="invStatusTypeMap[currentInventory.status] || 'info'">
              {{ invStatusMap[currentInventory.status] }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-table :data="currentInventoryItems" border stripe size="small" style="width: 100%">
        <el-table-column prop="drugName" label="药品名称" width="160" />
        <el-table-column prop="drugSpec" label="规格" width="120" />
        <el-table-column prop="drugType" label="类别" width="90" />
        <el-table-column prop="drugPrice" label="单价" width="90">
          <template #default="{ row }">
            ¥ {{ row.drugPrice?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="systemQuantity" label="系统库存" width="100" />

        <el-table-column label="实际盘点" width="120">
          <template #default="{ row }">
            <el-input-number
              v-if="currentInventory && currentInventory.status === 1"
              v-model="row.actualQuantity"
              :min="0"
              size="small"
              style="width: 100%"
              @change="handleUpdateItem(row)"
            />
            <span v-else>{{ row.actualQuantity }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="diffQuantity" label="差异数量" width="100">
          <template #default="{ row }">
            <span
              :style="{
                color:
                  row.diffQuantity > 0
                    ? '#67c23a'
                    : row.diffQuantity < 0
                      ? '#f56c6c'
                      : '#909399'
              }"
            >
              {{ row.diffQuantity > 0 ? '+' : '' }}{{ row.diffQuantity }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="diffAmount" label="差异金额" width="100">
          <template #default="{ row }">
            <span
              :style="{
                color:
                  row.diffQuantity > 0
                    ? '#67c23a'
                    : row.diffQuantity < 0
                      ? '#f56c6c'
                      : '#909399'
              }"
            >
              ¥ {{ row.diffAmount?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="diffType" label="差异类型" width="100">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="row.diffType === '盘盈' ? 'success' : row.diffType === '盘亏' ? 'danger' : 'info'"
            >
              {{ row.diffType }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="差异原因" width="140">
          <template #default="{ row }">
            <el-select
              v-if="currentInventory && currentInventory.status === 1 && (row.diffType === '盘盈' || row.diffType === '盘亏')"
              v-model="row.diffReason"
              placeholder="选择原因"
              size="small"
              style="width: 100%"
              @change="handleUpdateItem(row)"
            >
              <el-option v-for="opt in diffReasonOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <span v-else>{{ row.diffReason || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="备注" width="150">
          <template #default="{ row }">
            <el-input
              v-if="currentInventory && currentInventory.status === 1"
              v-model="row.remark"
              size="small"
              @blur="handleUpdateItem(row)"
            />
            <span v-else>{{ row.remark || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="invDetailDialog = false">关闭</el-button>
        <el-button v-if="currentInventory?.status === 0" type="success" @click="handleStartInventory(currentInventory.id)">
          开始盘点
        </el-button>
        <el-button v-if="currentInventory?.status === 1" type="info" @click="handlePauseInventory(currentInventory.id)">
          暂停
        </el-button>
        <el-button v-if="currentInventory?.status === 2" type="warning" @click="handleResumeInventory(currentInventory.id)">
          继续
        </el-button>
        <el-button
          v-if="currentInventory?.status === 1"
          type="success"
          @click="handleFinishInventory(currentInventory.id)"
        >
          完成盘点
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="createInvDialog" title="新建盘点单" width="560px">
      <el-form :model="createInvForm" label-width="100px">
        <el-form-item label="盘点类型">
          <el-select v-model="createInvForm.inventoryType" style="width: 100%">
            <el-option label="普通盘点" value="普通盘点" />
            <el-option label="月度盘点" value="月度盘点" />
            <el-option label="季度盘点" value="季度盘点" />
            <el-option label="年度盘点" value="年度盘点" />
            <el-option label="专项盘点" value="专项盘点" />
          </el-select>
        </el-form-item>

        <el-form-item label="筛选条件" label-width="100px">
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <el-select v-model="createInvForm.drugType" placeholder="药品类别" style="width: 150px" clearable>
              <el-option label="西药" value="西药" />
              <el-option label="中药" value="中药" />
              <el-option label="中成药" value="中成药" />
              <el-option label="保健品" value="保健品" />
              <el-option label="抗生素" value="抗生素" />
              <el-option label="解热镇痛" value="解热镇痛" />
              <el-option label="维生素" value="维生素" />
            </el-select>

            <el-input v-model="createInvForm.stockLocation" placeholder="存放位置" style="width: 150px" clearable />
          </div>
          <div style="margin-top: 8px; font-size: 12px; color: #909399;">
            提示：不选择筛选条件则盘点全部药品，可同时选择类别和位置进行组合筛选
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="createInvForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createInvDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCreateInventory">创建盘点单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reportDialog" title="盘点统计报表" width="800px">
      <div v-if="inventoryReport" style="margin-bottom: 20px;">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="盘点品种数">
            <span style="font-weight: bold; color: #303133">{{ inventoryReport.statistics.totalItems }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="一致品种数">
            <span style="font-weight: bold; color: #67c23a">{{ inventoryReport.statistics.matchCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="盘盈品种数">
            <span style="font-weight: bold; color: #e6a23c">{{ inventoryReport.statistics.profitCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="盘亏品种数">
            <span style="font-weight: bold; color: #f56c6c">{{ inventoryReport.statistics.lossCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="系统总数量">
            {{ inventoryReport.statistics.totalSystemQty }}
          </el-descriptions-item>
          <el-descriptions-item label="实际总数量">
            {{ inventoryReport.statistics.totalActualQty }}
          </el-descriptions-item>
          <el-descriptions-item label="系统总金额">
            ¥ {{ inventoryReport.statistics.totalSystemAmount?.toFixed(2) || '0.00' }}
          </el-descriptions-item>
          <el-descriptions-item label="实际总金额">
            ¥ {{ inventoryReport.statistics.totalActualAmount?.toFixed(2) || '0.00' }}
          </el-descriptions-item>
          <el-descriptions-item label="差异率">
            <span :style="{ color: (currentInventory?.diffRate || 0) > 5 ? '#f56c6c' : '#909399' }">
              {{ currentInventory?.diffRate?.toFixed(2) || '0.00' }}%
            </span>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="inventoryReport.statistics.profitTop5.length > 0" style="margin-top: 20px;">
          <h4 style="margin-bottom: 12px; color: #e6a23c;">📈 盘盈TOP5</h4>
          <el-table :data="inventoryReport.statistics.profitTop5" border stripe size="small" style="width: 100%">
            <el-table-column prop="drugName" label="药品名称" width="180" />
            <el-table-column prop="drugSpec" label="规格" width="120" />
            <el-table-column prop="diffQuantity" label="盘盈数量" width="100">
              <template #default="{ row }">
                <span style="color: #67c23a; font-weight: bold">+{{ row.diffQuantity }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="diffAmount" label="盘盈金额" width="120">
              <template #default="{ row }">
                <span style="color: #67c23a">¥ {{ row.diffAmount?.toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-if="inventoryReport.statistics.lossTop5.length > 0" style="margin-top: 20px;">
          <h4 style="margin-bottom: 12px; color: #f56c6c;">📉 盘亏TOP5</h4>
          <el-table :data="inventoryReport.statistics.lossTop5" border stripe size="small" style="width: 100%">
            <el-table-column prop="drugName" label="药品名称" width="180" />
            <el-table-column prop="drugSpec" label="规格" width="120" />
            <el-table-column prop="diffQuantity" label="盘亏数量" width="100">
              <template #default="{ row }">
                <span style="color: #f56c6c; font-weight: bold">{{ row.diffQuantity }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="diffAmount" label="盘亏金额" width="120">
              <template #default="{ row }">
                <span style="color: #f56c6c">¥ {{ row.diffAmount?.toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="reportDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page {
  padding: 20px;
  background: var(--h-bg);
  min-height: calc(100vh - 40px);
}

.page-title {
  margin-bottom: 20px;
  color: #303133;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.warning-section {
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: bold;
}

.section-header.low-stock {
  background: linear-gradient(135deg, #fdf6ec 0%, #fdeed3 100%);
  color: #e6a23c;
}

.section-header.expiring {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  color: #f56c6c;
}

.section-header.expired {
  background: linear-gradient(135deg, #fef0f0 0%, #fcdcdc 100%);
  color: #f56c6c;
}

.section-icon {
  font-size: 20px;
  margin-right: 8px;
}

.section-count {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: normal;
}
</style>