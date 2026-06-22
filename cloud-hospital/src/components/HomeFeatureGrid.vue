<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

export interface HomeFeatureItem {
  title: string
  desc: string
  icon: string
  path?: string
}

const props = defineProps<{ features: HomeFeatureItem[] }>()
const router = useRouter()

function openFeature(item: HomeFeatureItem) {
  if (item.path) {
    router.push(item.path)
    return
  }
  ElMessage.info(`功能【${item.title}】暂未开放`)
}
</script>

<template>
  <section class="home-feature-grid" aria-label="常用功能">
    <button
      v-for="item in props.features"
      :key="item.title"
      class="feature-card"
      type="button"
      @click="openFeature(item)"
    >
      <span class="feature-icon">
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
      </span>

      <span class="feature-text">
        <strong>{{ item.title }}</strong>
        <small>{{ item.desc }}</small>
      </span>

      <el-icon class="feature-arrow">
        <ArrowRight />
      </el-icon>
    </button>
  </section>
</template>

<style scoped>
.home-feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(238px, 1fr));
  gap: 16px;
  margin: 18px 0;
}

.feature-card {
  min-height: 112px;
  padding: 18px;
  border: 1px solid var(--h-border);
  border-radius: var(--h-radius-lg);
  background: var(--h-card);
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
  cursor: pointer;
  box-shadow: var(--h-shadow-sm);
  transition:
    transform var(--h-transition),
    box-shadow var(--h-transition),
    border-color var(--h-transition),
    background-color var(--h-transition);
}

.feature-card:hover {
  transform: translateY(-2px);
  border-color: var(--h-primary-border);
  box-shadow: var(--h-shadow-md);
  background: linear-gradient(135deg, var(--h-card), var(--h-primary-bg));
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--h-primary-bg), var(--h-accent-bg));
  color: var(--h-primary);
  font-size: 22px;
  flex: 0 0 auto;
  border: 1px solid var(--h-border);
}

.feature-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feature-text strong {
  color: var(--h-text);
  font-size: 16px;
}

.feature-text small {
  color: var(--h-text-tertiary);
  font-size: 13px;
  line-height: 1.45;
}

.feature-arrow {
  color: var(--h-text-placeholder);
}

@media (max-width: 768px) {
  .home-feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>