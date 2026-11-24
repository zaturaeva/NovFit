<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import background from '../assets/background.png'
import { api, setSession } from '../lib/api'
const router=useRouter()
const isLogin=ref(false), name=ref(''), nickname=ref(''), email=ref(''), password=ref('')
const error=ref(''), busy=ref(false)
async function submit(){
 error.value=''
 if(!email.value.trim()||!password.value||(!isLogin.value&&(!name.value.trim()||!nickname.value.trim()))){error.value='Заполните все поля';return}
 if(password.value.length<6){error.value='Пароль должен содержать не менее 6 символов';return}
 busy.value=true
 try {
  const result=await api<{token:string,user:any}>(isLogin.value?'/auth/login':'/auth/register',{method:'POST',body:JSON.stringify(isLogin.value?{email:email.value,password:password.value}:{name:name.value,nickname:nickname.value,email:email.value,password:password.value})})
  setSession(result.token,result.user);router.replace('/')
 } catch(e:any){error.value=e.message} finally{busy.value=false}
}
</script>
<template>
 <main class="auth-page" :style="{ backgroundImage: `linear-gradient(180deg,rgba(248,250,255,.18),rgba(248,250,255,.38)), url(${background})` }"><section class="auth-content">
  <h1>{{isLogin?'Вход':'Регистрация'}}</h1>
  <p class="auth-switch">{{isLogin?'Ещё нет аккаунта?':'Уже есть аккаунт?'}} <button type="button" @click="isLogin=!isLogin;error=''">{{isLogin?'Регистрация':'Войти'}}</button></p>
  <form class="auth-card" @submit.prevent="submit">
   <label v-if="!isLogin" class="auth-input-wrap"><i class="fa-solid fa-user"></i><input v-model="name" placeholder="Имя" autocomplete="name"></label>
   <label v-if="!isLogin" class="auth-input-wrap"><i class="fa-solid fa-at"></i><input v-model="nickname" placeholder="Уникальный никнейм" autocomplete="username"></label>
   <label class="auth-input-wrap"><i class="fa-regular fa-envelope"></i><input v-model="email" type="email" autocomplete="email" placeholder="Почта"></label>
   <label class="auth-input-wrap"><i class="fa-solid fa-lock"></i><input v-model="password" type="password" :autocomplete="isLogin?'current-password':'new-password'" placeholder="Пароль (от 6 символов)"></label>
   <p v-if="error" class="auth-error">{{error}}</p>
   <button class="auth-submit" type="submit" :disabled="busy">{{busy?'Подождите…':isLogin?'Войти':'Создать аккаунт'}}</button>
  </form>
 </section></main>
</template>
<style scoped>
.auth-page{position:relative;isolation:isolate;overflow:hidden;width:100%;min-height:100vh;min-height:100svh;max-width:none;margin:0;padding:clamp(24px,5vh,56px) 14px;display:flex;align-items:center;justify-content:center;background-size:cover;background-position:center;background-repeat:no-repeat;background-attachment:scroll}
.auth-content{position:relative;z-index:2;width:100%;max-width:340px;margin:0 auto}.auth-content h1{text-align:center;font-size:40px;line-height:1.12;font-weight:500;letter-spacing:-1.5px;color:#465675;margin:0 0 10px}
.auth-switch{text-align:center;font-size:15px;color:#59616E;margin:0 0 30px}.auth-switch button{border:0;background:transparent;color:#6798F5;font:inherit;padding:0 2px}
.auth-card{padding:24px 19px 22px;border-radius:11px;background:#fff;box-shadow:0 4px 5px rgba(50,66,94,.18);display:grid;gap:16px}
.auth-input-wrap{height:45px;border-radius:6px;background:#F1F2F4;display:flex;align-items:center;gap:11px;padding:0 11px;color:#F4C165}
.auth-input-wrap:focus-within{color:#6798F5}.auth-input-wrap i{font-size:19px;width:22px;text-align:center}.auth-input-wrap input{width:100%;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:15px;color:#465675}
.auth-submit{height:42px;border:0;border-radius:10px;background:#6798F5;color:#fff;font-size:14px;letter-spacing:.4px;box-shadow:0 3px 3px rgba(61,81,112,.2)}.auth-submit:disabled{opacity:.6}.auth-error{margin:0;color:#C65B5B;font-size:12px}
</style>
