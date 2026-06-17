<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { unreadMessageApi, markMessageReadApi } from '../api/message'
import type { SysMessageVO } from '../types'

const router = useRouter()
const unread = ref(0)
const latest = ref<SysMessageVO[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await unreadMessageApi()
    if (res.code === 200 && res.data) {
      unread.value = res.data.unreadCount || 0
      latest.value = res.data.latestMessages || []
    }
  } finally {
    loading.value = false
  }
}

async function openMessage(msg: SysMessageVO) {
  if (!msg.isRead) {
    await markMessageReadApi(msg.id)
    await load()
  }
  if (msg.relatedPath) {
    router.push(msg.relatedPath)
  } else {
    router.push('/messages')
  }
}

function goCenter() {
  router.push('/messages')
}

onMounted(load)
</script>

<template>
  <el-popover placement="bottom-end" width="360" trigger="click" @show="load">
    <template #reference>
      <div class="message-bell">
        <el-badge :value="unread" :hidden="unread <= 0" :max="99">
          <el-button circle>
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-badge>
      </div>
    </template>

    <div class="popover">
      <div class="pop-header">
        <span>消息提醒</span>
        <el-button link type="primary" @click="goCenter">查看全部</el-button>
      </div>

      <div v-loading="loading">
        <div v-if="latest.length" class="message-list">
          <div
            v-for="msg in latest"
            :key="msg.id"
            class="message-item"
            :class="{ unread: msg.isRead === 0 }"
            @click="openMessage(msg)"
          >
            <div class="message-title">
              <span>{{ msg.title }}</span>
              <el-tag v-if="msg.isRead === 0" type="danger" size="small">未读</el-tag>
            </div>
            <div class="message-content">{{ msg.content }}</div>
            <div class="message-time">{{ msg.createTime }}</div>
          </div>
        </div>
        <el-empty v-else description="暂无消息" />
      </div>
    </div>
  </el-popover>
</template>

<style scoped>
.message-bell :deep(.el-button) {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.popover {
  max-height: 480px;
}

.pop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  margin-bottom: 8px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-item {
  padding: 10px;
  border-radius: 10px;
  background: #f6f8fb;
  cursor: pointer;
  transition: 0.2s;
}

.message-item:hover {
  background: #ecf5ff;
}

.message-item.unread {
  border-left: 4px solid #f56c6c;
  background: #fff7f7;
}

.message-title {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-weight: 700;
  color: #1f2d3d;
}

.message-content {
  margin-top: 4px;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.message-time {
  margin-top: 6px;
  font-size: 12px;
  color: #a8abb2;
}
</style>