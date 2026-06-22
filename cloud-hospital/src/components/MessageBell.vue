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
  if (msg.isRead === 0) {
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
          <el-button circle class="message-btn" title="消息提醒">
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
          <button
            v-for="msg in latest"
            :key="msg.id"
            class="message-item"
            :class="{ unread: msg.isRead === 0 }"
            type="button"
            @click="openMessage(msg)"
          >
            <span class="message-title">
              <strong>{{ msg.title }}</strong>
              <el-tag v-if="msg.isRead === 0" type="danger" size="small">未读</el-tag>
            </span>
            <span class="message-content">{{ msg.content }}</span>
            <span class="message-time">{{ msg.createTime }}</span>
          </button>
        </div>
        <el-empty v-else description="暂无消息" />
      </div>
    </div>
  </el-popover>
</template>

<style scoped>
.message-bell {
  display: inline-flex;
  align-items: center;
}

.message-btn {
  width: 38px;
  height: 38px;
  color: var(--h-primary);
  background: var(--h-card);
  border-color: var(--h-border);
}

.message-btn:hover {
  color: var(--h-primary-hover);
  background: var(--h-primary-bg);
  border-color: var(--h-primary-border);
}

.popover {
  max-height: 480px;
}

.pop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 800;
  margin-bottom: 10px;
  color: var(--h-text);
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-item {
  width: 100%;
  border: 1px solid var(--h-border);
  padding: 12px;
  border-radius: 12px;
  background: var(--h-card);
  cursor: pointer;
  text-align: left;
  transition: all var(--h-transition);
}

.message-item:hover {
  background: var(--h-primary-bg);
  border-color: var(--h-primary-border);
}

.message-item.unread {
  border-left: 4px solid var(--h-danger);
  background: var(--h-danger-bg);
}

.message-title {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--h-text);
}

.message-content {
  margin-top: 5px;
  color: var(--h-text-secondary);
  font-size: 13px;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.message-time {
  display: block;
  margin-top: 7px;
  font-size: 12px;
  color: var(--h-text-tertiary);
}
</style>