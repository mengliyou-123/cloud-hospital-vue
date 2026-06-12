<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { operLogPageApi, operLogSelfApi } from '../../api/common'
import type { SysOperLog } from '../../types'
import { getUser } from '../../utils/request'

const route = useRoute()
const router = useRouter()

// 判断是否是 super_admin：如果路由以 /super-admin 开头，就显示全量筛选
const isAdmin = computed(() => String(route.path).startsWith('/super-admin'))

const list = ref<SysOperLog[]>([])
const total = ref(0)
const loading = ref(false)

const params = reactive({
  operModule: '',
  operType: '',
  username: '',
  startTime: '',
  endTime: '',
  pageNum: 1,
  pageSize: 15
})

const moduleOptions = ['系统登录', '用户管理', '角色管理', '数据字典', '个人中心']
const typeOptions = ['登录', '登出', '新增', '修改', '删除', '查询', '其他']

async function load() {
  loading.value = true
  try {
    const api = isAdmin.value ? operLogPageApi : operLogSelfApi
    const p = isAdmin.value
      ? params
      : { pageNum: params.pageNum, pageSize: params.pageSize }
    const res = await api(p as any)
    if (res.code === 200) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } finally {
    loading.value = false
  }
}

function onSearch() {
  params.pageNum = 1
  load()
}

function onReset() {
  params.operModule = ''
  params.operType = ''
  params.username = ''
  params.startTime = ''
  params.endTime = ''
  params.pageNum = 1
  load()
}

function handlePageChange(p: number) {
  params.pageNum = p
  load()
}

function handleSizeChange(s: number) {
  params.pageSize = s
  params.pageNum = 1
  load()
}

onMounted(load)

function goBack() {
  const u = getUser()
  if (u && u.roleCode) {
    const map: Record<string, string> = {
      patient: '/patient/home',
      doctor: '/doctor/home',
      drug_admin: '/drug-admin/home',
      finance_admin: '/finance-admin/home',
      super_admin: '/super-admin/home'
    }
    router.push(map[u.roleCode] || '/login')
  } else {
    router.back()
  }
}

function getTypeTag(type: string) {
  if (type === '登录' || type === '登出') return 'info'
  if (type === '新增') return 'success'
  if (type === '修改') return 'warning'
  if (type === '删除') return 'danger'
  return ''
}
</script>

<template>
  <div class="log-page">
    <div class="container">
      <div class="topbar">
        <el-button link @click="goBack">返回首页</el-button>
        <h2>{{ isAdmin ? '系统操作日志' : '我的操作记录' }}</h2>
        <div></div>
      </div>

      <el-card shadow="never" class="card">
        <el-form :inline="true" class="search-form">
          <el-form-item label="操作模块" v-if="isAdmin">
            <el-select v-model="params.operModule" placeholder="全部" clearable style="width:160px">
              <el-option v-for="m in moduleOptions" :key="m" :label="m" :value="m" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作类型" v-if="isAdmin">
            <el-select v-model="params.operType" placeholder="全部" clearable style="width:140px">
              <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作用户" v-if="isAdmin">
            <el-input v-model="params.username" placeholder="用户名/姓名" clearable style="width:180px" />
          </el-form-item>
          <el-form-item label="开始日期" v-if="isAdmin">
            <el-date-picker
              v-model="params.startTime"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择日期"
            />
          </el-form-item>
          <el-form-item label="结束日期" v-if="isAdmin">
            <el-date-picker
              v-model="params.endTime"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择日期"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe border style="width:100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="时间" width="180">
            <template #default="{ row }">{{ row.operTime }}</template>
          </el-table-column>
          <el-table-column label="操作用户" width="160" v-if="isAdmin">
            <template #default="{ row }">
              {{ row.username || '-' }}
              <span style="color:#909399;margin-left:4px">({{ row.realName || '-' }})</span>
            </template>
          </el-table-column>
          <el-table-column prop="operModule" label="模块" width="120" />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTag(row.operType) as any" size="small">{{ row.operType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operContent" label="内容" min-width="280" show-overflow-tooltip />
          <el-table-column prop="ipAddress" label="IP" width="140" />
        </el-table>

        <div class="pager">
          <el-pagination
            :current-page="params.pageNum"
            :page-size="params.pageSize"
            :page-sizes="[10, 15, 30, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.log-page {
  min-height: 100vh;
  background: #f4f6fb;
  padding: 24px 12px;
  box-sizing: border-box;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.topbar h2 {
  margin: 0;
  font-size: 20px;
  color: #1f2d3d;
}
.card {
  border-radius: 8px;
}
.search-form {
  margin-bottom: 8px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
