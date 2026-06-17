<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const actions = [
  {
    title: '我要挂号',
    desc: '选择科室和医生',
    icon: 'Calendar',
    path: '/patient/register',
    type: 'primary'
  },
  {
    title: '我的挂号',
    desc: '查看预约状态',
    icon: 'Notebook',
    path: '/patient/registers',
    type: 'success'
  },
  {
    title: '处方缴费',
    desc: '查看待缴费处方',
    icon: 'Wallet',
    path: '/patient/prescriptions',
    type: 'warning'
  },
  {
    title: '就诊记录',
    desc: '查看历史诊疗结果',
    icon: 'Document',
    path: '/patient/treatments',
    type: 'info'
  }
]

function go(path: string) {
  if (!path) {
    ElMessage.info('功能建设中')
    return
  }
  router.push(path)
}
</script>

<template>
  <el-card shadow="never" class="care-quick-panel">
    <template #header>
      <div class="panel-header">
        <div>
          <div class="panel-title">常用服务快捷入口</div>
          <div class="panel-subtitle">关怀模式下为您突出显示最常用的就医功能</div>
        </div>
        <el-tag type="success">长者友好</el-tag>
      </div>
    </template>

    <div class="care-quick-grid">
      <button
        v-for="item in actions"
        :key="item.title"
        type="button"
        class="care-quick-action"
        @click="go(item.path)"
      >
        <el-icon :size="30" color="#1677ff">
          <component :is="item.icon" />
        </el-icon>
        <span>
          <span class="care-quick-title">{{ item.title }}</span>
          <span class="care-quick-desc">{{ item.desc }}</span>
        </span>
      </button>
    </div>
  </el-card>
</template>

<style scoped>
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 18px;
  font-weight: 800;
  color: #1f2d3d;
}

.panel-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #8492a6;
}

.care-quick-action {
  font-family: inherit;
  text-align: left;
}

.care-quick-action span {
  display: flex;
  flex-direction: column;
}
</style>