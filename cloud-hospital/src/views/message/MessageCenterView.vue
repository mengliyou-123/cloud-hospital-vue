<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteMessageApi,
  listMyMessagesApi,
  markAllMessagesReadApi,
  markMessageReadApi
} from '../../api/message'
import type { SysMessageVO } from '../../types'

const router = useRouter()
const loading = ref(false)
const list = ref<SysMessageVO[]>([])
const total = ref(0)

const query = reactive({
  keyword: '',
  isRead: undefined as number | undefined,
  messageType: '',
  pageNum: 1,
  pageSize: 10
})

async function load() {
  loading.value = true
  try {
    const res = await listMyMessagesApi(query)
    if (res.code === 200 && res.data) {
      list.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } finally {
    loading.value = false
  }
}

async function markRead(row: SysMessageVO) {
  await markMessageReadApi(row.id)
  ElMessage.success('已标记为已读')
  await load()
}

async function open(row: SysMessageVO) {
  if (row.isRead === 0) {
    await markMessageReadApi(row.id)
  }

  if (row.relatedPath) {
    router.push(row.relatedPath)
  } else {
    await load()
  }
}

async function markAll() {
  await markAllMessagesReadApi()
  ElMessage.success('全部消息已读')
  await load()
}

async function remove(row: SysMessageVO) {
  await ElMessageBox.confirm('确定删除这条消息吗？', '提示', { type: 'warning' })
  await deleteMessageApi(row.id)
  ElMessage.success('消息已删除')
  await load()
}

function reset() {
  query.keyword = ''
  query.isRead = undefined
  query.messageType = ''
  query.pageNum = 1
  load()
}

onMounted(load)
</script>

<template>
  <div class="page-shell message-page">
    <el-card shadow="never" class="message-card">
      <template #header>
        <div class="header-row">
          <span>我的消息</span>
          <el-button type="primary" @click="markAll">
            全部标为已读
          </el-button>
        </div>
      </template>

      <div class="search-row">
        <el-input
          v-model="query.keyword"
          placeholder="搜索标题或内容"
          clearable
          style="width: 240px"
          @keyup.enter="load"
        />

        <el-select
          v-model="query.isRead"
          placeholder="阅读状态"
          clearable
          style="width: 150px"
        >
          <el-option label="未读" :value="0" />
          <el-option label="已读" :value="1" />
        </el-select>

        <el-select
          v-model="query.messageType"
          placeholder="消息类型"
          clearable
          style="width: 160px"
        >
          <el-option label="系统消息" value="system" />
          <el-option label="业务提醒" value="business" />
          <el-option label="公告通知" value="notice" />
          <el-option label="预警消息" value="warning" />
        </el-select>

        <el-button type="primary" @click="load">
          查询
        </el-button>

        <el-button @click="reset">
          重置
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" border>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isRead === 0 ? 'danger' : 'info'">
              {{ row.isRead === 0 ? '未读' : '已读' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="标题" min-width="180">
          <template #default="{ row }">
            <strong>{{ row.title }}</strong>
            <el-tag
              v-if="row.priority >= 2"
              type="warning"
              size="small"
              style="margin-left: 8px"
            >
              重要
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="content" label="内容" min-width="280" show-overflow-tooltip />
        <el-table-column prop="messageType" label="类型" width="110" />
        <el-table-column prop="businessType" label="业务" width="120" />
        <el-table-column prop="createTime" label="时间" width="180" />

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="open(row)">
              {{ row.relatedPath ? '查看业务' : '查看' }}
            </el-button>

            <el-button
              v-if="row.isRead === 0"
              link
              type="success"
              @click="markRead(row)"
            >
              已读
            </el-button>

            <el-button link type="danger" @click="remove(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="load"
          @size-change="load"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.message-page {
  display: flex;
  flex-direction: column;
}

.message-card {
  border-radius: 16px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>