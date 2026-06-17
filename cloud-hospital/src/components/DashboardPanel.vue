<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { currentDashboardApi } from '../api/dashboard'
import type { RoleDashboardVO } from '../types'
import TodoCard from './TodoCard.vue'

const loading = ref(false)
const dashboard = ref<RoleDashboardVO | null>(null)

async function loadDashboard() {
  loading.value = true
  try {
    const res = await currentDashboardApi()
    if (res.code === 200) {
      dashboard.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <el-card class="dashboard-panel" shadow="never" v-loading="loading">
    <template #header>
      <div class="panel-header">
        <div>
          <span class="panel-title">今日工作台</span>
          <span class="panel-subtitle">{{ dashboard?.greeting || '查看今日业务摘要和待办提醒' }}</span>
        </div>
        <el-button link type="primary" @click="loadDashboard">刷新</el-button>
      </div>
    </template>

    <div v-if="dashboard">
      <div class="cards-grid">
        <TodoCard
          v-for="card in dashboard.cards"
          :key="card.title"
          :item="card"
          mode="card"
        />
      </div>

      <div class="todo-section" v-if="dashboard.todos.length">
        <div class="section-title">
          <span>待办提醒</span>
          <el-tag type="warning" size="small">{{ dashboard.todos.length }} 项</el-tag>
        </div>

        <div class="todo-list">
          <TodoCard
            v-for="todo in dashboard.todos"
            :key="todo.title"
            :item="todo"
            mode="todo"
          />
        </div>
      </div>

      <div class="empty-tip" v-else>
        <el-icon><CircleCheck /></el-icon>
        当前没有需要优先处理的待办事项
      </div>
    </div>

    <el-empty v-else description="暂无工作台数据" />
  </el-card>
</template>

<style scoped>
.dashboard-panel {
  margin-bottom: 18px;
  border-radius: 12px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-right: 12px;
}

.panel-subtitle {
  font-size: 13px;
  color: #909399;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.todo-section {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed #ebeef5;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-weight: 600;
  color: #303133;
}

.todo-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
}

.empty-tip {
  margin-top: 14px;
  padding: 12px;
  border-radius: 8px;
  background: #f0f9eb;
  color: #67c23a;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
</style>