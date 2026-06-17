<script setup lang="ts">
import { computed } from 'vue'
import type { VisitTimelineVO, VisitTimelineNodeVO } from '../types'

const props = defineProps<{
  timeline: VisitTimelineVO | null
}>()

const statusMap = computed<Record<string, { type: string; icon: string }>>(() => ({
  completed: { type: 'success', icon: 'CircleCheckFilled' },
  current: { type: 'warning', icon: 'Clock' },
  pending: { type: 'info', icon: 'MoreFilled' },
  warning: { type: 'danger', icon: 'WarningFilled' },
  canceled: { type: 'info', icon: 'CircleCloseFilled' }
}))

function getType(node: VisitTimelineNodeVO) {
  return statusMap.value[node.status]?.type || 'info'
}

function getIcon(node: VisitTimelineNodeVO) {
  return statusMap.value[node.status]?.icon || 'MoreFilled'
}
</script>

<template>
  <div v-if="timeline" class="visit-timeline">
    <el-alert
      :title="`当前阶段：${timeline.currentStage || '待处理'}`"
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 14px"
    >
      <template #default>
        {{ timeline.deptName }} / {{ timeline.doctorName }} / {{ timeline.registerDate }} {{ timeline.timeSlot }}
      </template>
    </el-alert>

    <el-timeline>
      <el-timeline-item
        v-for="node in timeline.nodes"
        :key="node.nodeKey"
        :type="getType(node)"
        :timestamp="node.time || ''"
        placement="top"
      >
        <el-card shadow="never" class="timeline-card" :class="`node-${node.status}`">
          <div class="node-header">
            <div>
              <el-icon>
                <component :is="getIcon(node)" />
              </el-icon>
              <strong>{{ node.title }}</strong>
            </div>
            <el-tag :type="getType(node)" size="small">
              {{ node.status === 'completed' ? '已完成' :
                 node.status === 'current' ? '当前步骤' :
                 node.status === 'warning' ? '异常提醒' :
                 node.status === 'canceled' ? '已取消' : '待处理' }}
            </el-tag>
          </div>
          <div class="node-desc">{{ node.description }}</div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
  </div>

  <el-empty v-else description="暂无就医进度" />
</template>

<style scoped>
.visit-timeline {
  padding: 4px;
}

.timeline-card {
  border-radius: 10px;
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.node-header > div {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.node-desc {
  margin-top: 8px;
  color: #606266;
  line-height: 1.7;
}

.node-current {
  border-left: 4px solid #e6a23c;
}

.node-completed {
  border-left: 4px solid #67c23a;
}

.node-warning {
  border-left: 4px solid #f56c6c;
}
</style>