<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { DashboardCardVO, DashboardTodoVO } from '../types'

const props = defineProps<{
  item: DashboardCardVO | DashboardTodoVO
  mode?: 'card' | 'todo'
}>()

const router = useRouter()

const isTodo = computed(() => props.mode === 'todo')
const cardItem = computed(() => props.item as DashboardCardVO)
const todoItem = computed(() => props.item as DashboardTodoVO)

const tagType = computed(() => {
  const type = props.item.type || 'primary'
  if (type === 'danger') return 'danger'
  if (type === 'warning') return 'warning'
  if (type === 'success') return 'success'
  if (type === 'info') return 'info'
  return 'primary'
})

const displayValue = computed(() => {
  return isTodo.value ? todoItem.value.count : cardItem.value.value
})

const displayUnit = computed(() => {
  return isTodo.value ? '' : cardItem.value.unit || ''
})

const displayIcon = computed(() => {
  return isTodo.value ? '' : cardItem.value.icon
})

function go() {
  if (props.item.path) {
    router.push(props.item.path)
  }
}
</script>

<template>
  <div
    class="todo-card"
    :class="{ clickable: !!item.path, todo: isTodo }"
    tabindex="0"
    @click="go"
    @keydown.enter="go"
  >
    <template v-if="isTodo">
      <div class="todo-left">
        <el-tag :type="tagType" effect="light">{{ displayValue }}</el-tag>
        <div>
          <div class="todo-title">{{ todoItem.title }}</div>
          <div class="todo-desc">{{ todoItem.description }}</div>
        </div>
      </div>
      <el-icon v-if="item.path"><ArrowRight /></el-icon>
    </template>

    <template v-else>
      <div class="stat-main">
        <div class="stat-icon" :class="`stat-${item.type || 'primary'}`" v-if="displayIcon">
          <el-icon :size="20">
            <component :is="displayIcon" />
          </el-icon>
        </div>
        <div>
          <div class="stat-title">{{ cardItem.title }}</div>
          <div class="stat-desc">{{ cardItem.description }}</div>
        </div>
      </div>

      <div class="stat-value">
        <span class="num">{{ displayValue }}</span>
        <span class="unit" v-if="displayUnit">{{ displayUnit }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.todo-card {
  min-height: 78px;
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--h-card);
  border: 1px solid var(--h-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: 0.18s;
}

.todo-card.clickable {
  cursor: pointer;
}

.todo-card.clickable:hover {
  border-color: var(--h-primary-light);
  background: var(--h-primary-bg);
}

.stat-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-primary {
  background: #ecf5ff;
  color: #409eff;
}

.stat-success {
  background: #f0f9eb;
  color: #67c23a;
}

.stat-warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.stat-danger {
  background: #fef0f0;
  color: #f56c6c;
}

.stat-info {
  background: #f4f4f5;
  color: #909399;
}

.stat-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.stat-desc {
  margin-top: 3px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 3px;
  flex-shrink: 0;
}

.num {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.unit {
  font-size: 12px;
  color: #909399;
}

.todo-card.todo {
  min-height: 54px;
  padding: 10px 12px;
}

.todo-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.todo-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.todo-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>