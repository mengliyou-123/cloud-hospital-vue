<script setup lang="ts">
import { computed, ref } from 'vue'
import { getRoleHelp } from '../config/roleMenus'

const props = defineProps<{
  roleCode?: string
}>()

const visible = ref(false)

const helpConfig = computed(() => getRoleHelp(props.roleCode))

function open() {
  visible.value = true
}

defineExpose({ open })
</script>

<template>
  <el-drawer
    v-model="visible"
    title="使用说明"
    size="420px"
    append-to-body
    class="help-drawer"
  >
    <div class="help-head">
      <div class="role-badge">{{ helpConfig.roleName }}</div>
      <h3>{{ helpConfig.title }}</h3>
      <p>{{ helpConfig.description }}</p>
    </div>

    <div class="help-section" v-for="section in helpConfig.sections" :key="section.title">
      <div class="section-title">
        <el-icon>
          <component :is="section.icon" />
        </el-icon>
        <span>{{ section.title }}</span>
      </div>
      <ul>
        <li v-for="item in section.items" :key="item">{{ item }}</li>
      </ul>
    </div>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="提示"
      description="本说明按当前登录角色自动展示。后续可扩展为后台可配置的在线帮助文档。"
    />
  </el-drawer>
</template>

<style scoped>
.help-head {
  padding: 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(16, 185, 129, 0.1));
  border: 1px solid rgba(37, 99, 235, 0.12);
  margin-bottom: 18px;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.help-head h3 {
  margin: 12px 0 8px;
  color: #0f172a;
}

.help-head p {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.help-section {
  margin-bottom: 18px;
  padding: 16px;
  border-radius: 14px;
  background: var(--h-card);
  border: 1px solid var(--h-border);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 10px;
}

.section-title .el-icon {
  color: #2563eb;
}

ul {
  margin: 0;
  padding-left: 20px;
  color: #475569;
  line-height: 1.9;
}

li + li {
  margin-top: 4px;
}
</style>