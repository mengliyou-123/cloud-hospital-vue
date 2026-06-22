<script setup lang="ts">
defineProps<{
  collapsed?: boolean
  subtitle?: string
}>()
</script>

<template>
  <div class="hospital-logo" :class="{ collapsed }">
    <div class="logo-mark" aria-hidden="true">
      <svg viewBox="0 0 72 72" role="img">
        <defs>
          <linearGradient id="cloudHospitalLogoGradient" x1="10" y1="8" x2="62" y2="64">
            <stop offset="0%" stop-color="var(--h-primary)" />
            <stop offset="100%" stop-color="var(--h-accent)" />
          </linearGradient>
        </defs>

        <rect x="6" y="6" width="60" height="60" rx="18" fill="url(#cloudHospitalLogoGradient)" />

        <path
          d="M22 43h30c4.7 0 8-3.1 8-7.2 0-3.7-2.9-6.6-6.9-7.1C51.3 20.4 44.2 15 35.8 15c-8.1 0-15.1 5.1-17.2 12.4C13.4 28 10 31.4 10 35.6 10 40 13.7 43 18.6 43H22z"
          fill="#ffffff"
          opacity="0.96"
        />

        <path d="M34 24h7v8h8v7h-8v8h-7v-8h-8v-7h8z" fill="var(--h-primary)" />

        <path
          d="M18 51h12l3.8-6.6 6.4 12.1 4.8-8.3h10"
          fill="none"
          stroke="#ffffff"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.95"
        />
      </svg>
    </div>

    <div v-if="!collapsed" class="logo-text">
      <div class="title">东软云医院 HIS</div>
      <div class="sub">{{ subtitle || 'Hospital Information System' }}</div>
    </div>
  </div>
</template>

<style scoped>
.hospital-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.logo-mark {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: var(--h-card);
  box-shadow: var(--h-shadow-sm);
  border: 1px solid var(--h-border);
  flex: 0 0 auto;
}

.logo-mark svg {
  width: 42px;
  height: 42px;
  display: block;
}

.logo-text {
  min-width: 0;
  line-height: 1.12;
}

.title {
  font-weight: 900;
  font-size: 17px;
  color: var(--h-text);
  letter-spacing: 0.2px;
  white-space: nowrap;
}

.sub {
  margin-top: 4px;
  font-size: 11px;
  color: var(--h-text-tertiary);
  white-space: nowrap;
}

.collapsed {
  justify-content: center;
}

@media (max-width: 768px) {
  .logo-text {
    display: none;
  }

  .logo-mark {
    width: 40px;
    height: 40px;
    border-radius: 14px;
  }

  .logo-mark svg {
    width: 38px;
    height: 38px;
  }
}
</style>