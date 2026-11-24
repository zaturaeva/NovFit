<script setup>
import { RouterLink } from 'vue-router'

const navItems = [
  { to: '/diary', label: 'ДНЕВНИК', icon: 'fa-solid fa-book-open' },
  { to: '/rating', label: 'РЕЙТИНГ', icon: 'fa-solid fa-trophy' },
  { to: '/', label: 'ГЛАВНАЯ', icon: 'fa-solid fa-house' },
  { to: '/articles', label: 'СТАТЬИ', icon: 'fa-solid fa-newspaper' },
  { to: '/progress', label: 'ПРОГРЕСС', icon: 'fa-solid fa-chart-line' }
]
</script>

<template>
  <div class="bottom-nav">
    <div class="nav-items">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        custom
        v-slot="{ isActive, navigate }"
      >
        <div 
          :class="['nav-item', { active: isActive }]"
          @click="navigate"
        >
          <i :class="[item.icon, 'nav-icon']" aria-hidden="true"></i>
          <div class="nav-label">{{ item.label }}</div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #252B39;
  padding: 8px 16px 22px;
  z-index: 100;
}
.nav-items {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: #8A9BB0;
  transition: color 0.2s;
  cursor: pointer;
  padding: 6px 0;
}
.nav-item.active {
  color: #F4C165;
}
.nav-icon {
  display: none;
  font-size: 22px;
  line-height: 1;
}
@media (max-width: 768px) {
  .nav-icon { display: block; }
}
.nav-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
</style>