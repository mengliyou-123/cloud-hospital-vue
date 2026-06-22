<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const now = ref(new Date())
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})

const dateText = computed(() => {
  const d = now.value
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${week}`
})

const timeText = computed(() => {
  const d = now.value
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
})
</script>

<template>
  <div class="digital-clock" title="系统时间">
    <el-icon class="clock-icon"><Clock /></el-icon>
    <div class="clock-content">
      <span class="date">{{ dateText }}</span>
      <span class="time">{{ timeText }}</span>
    </div>
  </div>
</template>

<style scoped>
.digital-clock {
  height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  user-select: none;
}

.clock-icon {
  color: #2563eb;
  font-size: 16px;
}

.clock-content {
  display: flex;
  align-items: baseline;
  gap: 8px;
  white-space: nowrap;
}

.date {
  font-size: 12px;
  color: #64748b;
}

.time {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #1d4ed8;
}

@media (max-width: 980px) {
  .date {
    display: none;
  }
}

@media (max-width: 720px) {
  .digital-clock {
    display: none;
  }
}
</style>