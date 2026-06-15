<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyRegistersApi, cancelRegisterApi } from '../../api/registration'
import type { RegisterRecord } from '../../types'

const router = useRouter()
const list = ref<RegisterRecord[]>([])
const loading = ref(false)

onMounted(() => {
  loadList()
})

async function loadList() {
  loading.value = true
  try {
    const res = await getMyRegistersApi()
    if (res.code === 200) {
      list.value = res.data || []
    }
  } finally {
    loading.value = false
  }
}

async function handleCancel(row: RegisterRecord) {
  try {
    await ElMessageBox.confirm(
      `确定取消【${row.deptName}】${row.doctorName}(${row.doctorTitle}) 的挂号吗？\n日期：${row.registerDate}  时段：${row.timeSlot}`,
      '取消挂号',
      { confirmButtonText: '确定取消', cancelButtonText: '再想想', type: 'warning' }
    )
  } catch {
    return
  }
  const res = await cancelRegisterApi(row.id)
  if (res.code === 200) {
    ElMessage.success('已取消挂号')
    loadList()
  }
}

function getStatusTag(status: number) {
  if (status === 0) return { text: '待就诊', type: 'warning' as const }
  if (status === 1) return { text: '已就诊', type: 'success' as const }
  return { text: '已取消', type: 'info' as const }
}
</script>

<template>
  <div class="my-registers-page">
    <div class="topbar">
      <el-button @click="router.push('/patient/home')" :icon="'ArrowLeft'">返回首页</el-button>
      <span class="topbar-title">我的挂号记录</span>
      <el-button type="primary" @click="router.push('/patient/register')">去挂号</el-button>
    </div>

    <div class="content">
      <el-card v-loading="loading">
        <template #header>
          <span style="font-weight:600">挂号记录列表</span>
        </template>

        <el-empty v-if="list.length === 0 && !loading" description="暂无挂号记录" />

        <el-table v-else :data="list" stripe style="width:100%">
          <el-table-column prop="id" label="挂号编号" width="90" />
          <el-table-column prop="deptName" label="科室" width="100" />
          <el-table-column label="医生" width="150">
            <template #default="{ row }">
              {{ row.doctorName }}
              <el-tag size="small" type="info">{{ row.doctorTitle }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="registerDate" label="就诊日期" width="120" />
          <el-table-column prop="timeSlot" label="就诊时段" width="160" />
          <el-table-column prop="registerFee" label="挂号费" width="90">
            <template #default="{ row }">¥{{ row.registerFee.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.registerStatus).type">
                {{ getStatusTag(row.registerStatus).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="挂号时间" width="170" />
          <el-table-column label="操作" min-width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.registerStatus === 0"
                type="danger"
                size="small"
                text
                @click="handleCancel(row)"
              >
                取消挂号
              </el-button>
              <span v-else style="color:#c0c4cc">--</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.my-registers-page {
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
  margin-bottom: 20px;
}
.topbar-title {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}
.content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}
</style>