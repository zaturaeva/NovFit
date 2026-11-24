<script setup lang="ts">
import { ref,onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
const router=useRouter(),requests=ref<any[]>([]),error=ref(''),loading=ref(false)
async function load(){loading.value=true;try{requests.value=await api<any[]>('/friends/requests')}catch(e:any){error.value=e.message}finally{loading.value=false}}
async function respond(id:number,status:'accepted'|'rejected'){error.value='';try{await api(`/friends/requests/${id}`,{method:'PATCH',body:JSON.stringify({status})});await load()}catch(e:any){error.value=e.message}}
onMounted(load)
</script>
<template><main class="requests-page"><header><button @click="router.push('/friends')">← Друзья</button><h1>Заявки в друзья</h1></header><p v-if="error" class="error">{{error}}</p><p v-if="loading">Загрузка…</p><article v-for="req in requests" :key="req.id" class="request-card"><div><strong>{{req.name}}</strong><small>@{{req.nickname}}</small></div><div class="actions"><button @click="respond(req.id,'accepted')">Принять</button><button class="reject" @click="respond(req.id,'rejected')">Отклонить</button></div></article><p v-if="!loading&&!requests.length" class="empty">Входящих заявок пока нет.</p></main></template>
<style scoped>
.requests-page{max-width:480px;min-height:70vh;margin:0 auto;padding:12px 14px 110px;color:#465675}.requests-page header{display:flex;align-items:center;gap:12px;margin-bottom:20px}.requests-page h1{font-size:28px;font-weight:600;margin:0}.requests-page header button{border:0;border-radius:8px;background:#edf2fa;color:#547dc4;padding:9px}.request-card{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px;margin-bottom:10px;background:#fff;border-radius:12px}.request-card>div:first-child{display:grid;gap:4px}.request-card small{color:#8a9bb0}.actions{display:flex;gap:7px}.actions button{border:0;border-radius:8px;padding:9px 10px;background:#6798f5;color:#fff}.actions .reject{background:#eef1f5;color:#657696}.empty{padding:30px;text-align:center;color:#8a9bb0}.error{color:#c65b5b}
</style>
