<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const goToProfile = () => {
  router.push('/profile')
}
</script>

<template>
  <div class="header">
    <div class="logo">NovFit</div>
    <div class="profile-icon" @click="goToProfile">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6798F5" stroke-width="1.8">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-linecap="round"/>
        <circle cx="12" cy="7" r="4" stroke-linecap="round"/>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo {
  font-size: 68px;
  font-weight: 800;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #252B39, #3A4455);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}
.profile-icon {
  background: #FFFFFF;
  width: 48px;
  height: 48px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #E0E4EA;
  transition: all 0.2s;
}
.profile-icon:active {
  transform: scale(0.95);
}
</style>