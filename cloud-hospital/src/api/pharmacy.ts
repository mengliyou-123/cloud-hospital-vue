import request from '../utils/request'
import type { Result } from '../types'

/** ========== 药品信息 ========== */
export interface Drug {
  id: number
  drugName: string
  drugSpec: string
  drugType: string
  price: number
  stockQuantity: number
  warningStock: number
  expireWarningDays: number
  stockLocation: string
  manufacturer: string
  validTime: string
  usage: string
  status: number
  createTime: string
  updateTime: string
}

/** 查询药品列表 */
export const getDrugListApi = (params?: {
  drugName?: string
  drugType?: string
  status?: number
}): Promise<Result<Drug[]>> =>
  request.get('/pharmacy/drugs', { params })

/** 新增药品 */
export const addDrugApi = (data: Partial<Drug>): Promise<Result<Drug>> =>
  request.post('/pharmacy/drugs', data)

/** 更新药品 */
export const updateDrugApi = (id: number, data: Partial<Drug>): Promise<Result<Drug>> =>
  request.put(`/pharmacy/drugs/${id}`, data)

/** 下架药品 */
export const removeDrugApi = (id: number): Promise<Result<boolean>> =>
  request.delete(`/pharmacy/drugs/${id}`)

/** 低库存预警 */
export const getLowStockDrugsApi = (): Promise<Result<Drug[]>> =>
  request.get('/pharmacy/drugs/warning/low-stock')

/** 即将过期预警 */
export const getExpiringDrugsApi = (): Promise<Result<Drug[]>> =>
  request.get('/pharmacy/drugs/warning/expiring')

/** 已过期预警 */
export const getExpiredDrugsApi = (): Promise<Result<Drug[]>> =>
  request.get('/pharmacy/drugs/warning/expired')

/** ========== 库存变动记录 ========== */
export interface DrugStockLog {
  id: number
  drugId: number
  drugName?: string
  drugSpec?: string
  changeType: string
  changeQuantity: number
  beforeQuantity: number
  afterQuantity: number
  relatedId?: number
  relatedType?: string
  operatorId?: number
  operatorName?: string
  remark?: string
  createTime: string
}

/** 查询库存变动记录 */
export const getStockLogListApi = (params?: {
  drugId?: number
  changeType?: string
  startDate?: string
  endDate?: string
}): Promise<Result<DrugStockLog[]>> =>
  request.get('/pharmacy/stock-logs', { params })

/** 手动记录库存变动 */
export const addStockLogApi = (data: {
  drugId: number
  changeType: string
  changeQuantity: number
  remark?: string
}): Promise<Result<DrugStockLog>> =>
  request.post('/pharmacy/stock-logs', data)

/** ========== 库存盘点 ========== */
export interface DrugInventory {
  id: number
  inventoryNo: string
  inventoryDate: string
  inventoryType: string
  operatorId?: number
  operatorName?: string
  totalItems: number
  profitQuantity: number
  lossQuantity: number
  profitAmount: number
  lossAmount: number
  diffRate: number
  status: number
  remark?: string
  createTime: string
  updateTime: string
  items?: DrugInventoryItem[]
}

export interface DrugInventoryItem {
  id: number
  inventoryId: number
  drugId: number
  drugName: string
  drugSpec: string
  drugType?: string
  drugPrice: number
  systemQuantity: number
  actualQuantity: number
  diffQuantity: number
  diffAmount: number
  diffType: string
  diffReason?: string
  remark?: string
  createTime: string
}

/** 查询盘点单列表 */
export const getInventoryListApi = (params?: {
  status?: number
  startDate?: string
  endDate?: string
}): Promise<Result<DrugInventory[]>> =>
  request.get('/pharmacy/inventory', { params })

/** 获取盘点单详情 */
export const getInventoryDetailApi = (id: number): Promise<Result<{
  inventory: DrugInventory
  items: DrugInventoryItem[]
}>> =>
  request.get(`/pharmacy/inventory/${id}`)

/** 获取盘点统计报表 */
export const getInventoryReportApi = (id: number): Promise<Result<{
  inventory: DrugInventory
  items: DrugInventoryItem[]
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
}>> =>
  request.get(`/pharmacy/inventory/${id}/report`)

/** 创建盘点单 */
export const createInventoryApi = (data: {
  inventoryType?: string
  drugType?: string
  stockLocation?: string
  remark?: string
  drugIds?: number[]
}): Promise<Result<DrugInventory>> =>
  request.post('/pharmacy/inventory', data)

/** 更新盘点明细实际数量和差异原因 */
export const updateInventoryItemApi = (data: {
  id: number
  actualQuantity: number
  diffReason?: string
  remark?: string
}): Promise<Result<boolean>> =>
  request.post('/pharmacy/inventory/item', data)

/** 批量更新盘点明细 */
export const batchUpdateInventoryItemsApi = (data: DrugInventoryItem[]): Promise<Result<boolean>> =>
  request.post('/pharmacy/inventory/items/batch', data)

/** 开始盘点 */
export const startInventoryApi = (id: number): Promise<Result<boolean>> =>
  request.post(`/pharmacy/inventory/${id}/start`)

/** 暂停盘点 */
export const pauseInventoryApi = (id: number): Promise<Result<boolean>> =>
  request.post(`/pharmacy/inventory/${id}/pause`)

/** 继续盘点 */
export const resumeInventoryApi = (id: number): Promise<Result<boolean>> =>
  request.post(`/pharmacy/inventory/${id}/resume`)

/** 作废盘点单 */
export const cancelInventoryApi = (id: number): Promise<Result<boolean>> =>
  request.post(`/pharmacy/inventory/${id}/cancel`)

/** 完成盘点 */
export const finishInventoryApi = (id: number): Promise<Result<boolean>> =>
  request.post(`/pharmacy/inventory/${id}/finish`)

/** ========== 药品采购 ========== */
export interface DrugPurchaseItem {
  id: number
  purchaseId?: number
  drugId: number
  drugName: string
  drugSpec?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  remark?: string
  createTime?: string
}

export interface DrugPurchase {
  id: number
  purchaseNo: string
  applicantId?: number
  applicantName?: string
  supplier: string
  totalQuantity: number
  totalAmount: number
  status: number
  approverId?: number
  approverName?: string
  approveTime?: string
  approveRemark?: string
  inStorageTime?: string
  inStorageOperator?: string
  remark?: string
  createTime: string
  updateTime: string
  items?: DrugPurchaseItem[]
}

/** 采购单列表 */
export const getPurchaseListApi = (params?: {
  status?: number
  startDate?: string
  endDate?: string
}): Promise<Result<DrugPurchase[]>> =>
  request.get('/pharmacy/purchase', { params })

/** 采购单详情 */
export const getPurchaseDetailApi = (id: number): Promise<Result<{
  purchase: DrugPurchase
  items: DrugPurchaseItem[]
}>> =>
  request.get(`/pharmacy/purchase/${id}`)

/** 创建采购单 */
export const createPurchaseApi = (data: {
  supplier: string
  remark?: string
  items: {
    drugId: number
    drugName: string
    drugSpec?: string
    quantity: number
    unitPrice: number
  }[]
}): Promise<Result<DrugPurchase>> =>
  request.post('/pharmacy/purchase', data)

/** 审核通过 */
export const approvePurchaseApi = (id: number, remark?: string): Promise<Result<DrugPurchase>> =>
  request.post(`/pharmacy/purchase/${id}/approve`, { remark })

/** 驳回 */
export const rejectPurchaseApi = (id: number, remark?: string): Promise<Result<DrugPurchase>> =>
  request.post(`/pharmacy/purchase/${id}/reject`, { remark })

/** 确认入库 */
export const confirmStorageApi = (id: number): Promise<Result<DrugPurchase>> =>
  request.post(`/pharmacy/purchase/${id}/storage`)

/** ========== 处方配药 ========== */
export interface DrugDispenseItem {
  id: number
  dispenseId: number
  prescriptionItemId?: number
  drugId: number
  drugName: string
  drugSpec?: string
  drugType?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  usageDosage?: string
  createTime: string
}

export interface DrugDispense {
  id: number
  dispenseNo: string
  prescriptionId: number
  treatmentId?: number
  patientId?: number
  patientName?: string
  doctorId?: number
  doctorName?: string
  pharmacistId?: number
  pharmacistName?: string
  totalItemCount: number
  totalQuantity: number
  status: number
  dispenseTime?: string
  deliverTime?: string
  receivePerson?: string
  remark?: string
  createTime: string
  updateTime: string
  items?: DrugDispenseItem[]
}

/** 配药记录列表 */
export const getDispenseListApi = (params?: {
  status?: number
  startDate?: string
  endDate?: string
}): Promise<Result<DrugDispense[]>> =>
  request.get('/pharmacy/dispense', { params })

/** 配药单详情 */
export const getDispenseDetailApi = (id: number): Promise<Result<{
  dispense: DrugDispense
  items: DrugDispenseItem[]
}>> =>
  request.get(`/pharmacy/dispense/${id}`)

/** 从处方创建配药单 */
export const createDispenseApi = (data: {
  prescriptionId: number
  treatmentId?: number
  patientId?: number
  patientName?: string
  doctorId?: number
  doctorName?: string
  items: {
    prescriptionItemId?: number
    drugId: number
    drugName: string
    drugSpec?: string
    drugType?: string
    quantity: number
    unitPrice: number
    usageDosage?: string
  }[]
  remark?: string
}): Promise<Result<DrugDispense>> =>
  request.post('/pharmacy/dispense', data)

/** 完成配药 */
export const completeDispenseApi = (id: number): Promise<Result<DrugDispense>> =>
  request.post(`/pharmacy/dispense/${id}/complete`)

/** 发药给患者 */
export const deliverDrugApi = (id: number, receivePerson: string): Promise<Result<DrugDispense>> =>
  request.post(`/pharmacy/dispense/${id}/deliver`, { receivePerson })
