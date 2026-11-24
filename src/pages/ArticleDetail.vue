<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, websocketUrl } from '../lib/api'
const router = useRouter(), route = useRoute()
const article = ref<any>(null), loading = ref(true), error = ref('')
const comments=ref<any[]>([]), commentDraft=ref(''), commentError=ref(''), commentBusy=ref(false), likeBusy=ref(false)
let socket:WebSocket|null=null
function connectArticleSocket(){ socket?.close(); socket=new WebSocket(websocketUrl()); socket.onopen=()=>socket?.send(JSON.stringify({type:'article:subscribe',slug:String(route.params.slug||'')})); socket.onmessage=(event)=>{try{const data=JSON.parse(event.data); if(data.type==='article:state'){article.value={...article.value,liked:data.liked,likes:data.likes};comments.value=data.comments||[]} else if(data.type==='article:like'&&article.value){article.value.likes=data.likes;if(data.userId===Number(JSON.parse(localStorage.getItem('novfit-user')||'{}').id))article.value.liked=data.liked} else if(data.type==='article:comment'){if(!comments.value.some(c=>c.id===data.comment.id))comments.value.unshift(data.comment)}}catch{}} }
const load = async () => {
 loading.value=true; error.value=''; article.value=null
 try { article.value=await api(`/articles/${encodeURIComponent(String(route.params.slug || ''))}`); connectArticleSocket() }
 catch(e:any) { error.value=e.message || 'Не удалось загрузить статью' }
 finally { loading.value=false }
}
async function toggleLike(){if(!article.value||likeBusy.value)return;likeBusy.value=true;try{if(!socket||socket.readyState!==WebSocket.OPEN)throw new Error('Нет соединения с сервером');socket.send(JSON.stringify({type:'article:like',slug:String(route.params.slug)}))}catch(e:any){error.value=e.message}finally{likeBusy.value=false}}
async function addComment(){const body=commentDraft.value.trim();if(!body)return;commentBusy.value=true;commentError.value='';try{if(!socket||socket.readyState!==WebSocket.OPEN)throw new Error('Нет соединения с сервером');socket.send(JSON.stringify({type:'article:comment',slug:String(route.params.slug),body}));commentDraft.value=''}catch(e:any){commentError.value=e.message}finally{commentBusy.value=false}}
onMounted(load)
watch(() => route.params.slug, load)
onBeforeUnmount(()=>socket?.close())
</script>
<template>
 <div class="app-container">
  <header class="header"><button class="back-btn" @click="router.push('/articles')"><i class="fa-solid fa-arrow-left"></i><span>Все статьи</span></button><button class="profile-icon" aria-label="Профиль" @click="router.push('/profile')"><i class="fa-solid fa-user"></i></button></header>
  <div v-if="loading" class="message">Загружаем статью…</div>
  <div v-else-if="error" class="message">{{ error }} <button class="back-btn" @click="router.push('/articles')">К статьям</button></div>
  <article v-else-if="article" class="article-detail">
   <div class="article-meta">{{ article.category.toUpperCase() }} <span>·</span> {{ article.read_minutes }} МИН ЧТЕНИЯ</div>
   <h1>{{ article.title }}</h1>
   <div class="author"><span class="author-avatar">{{ article.author?.charAt(0) }}</span><div><strong>{{ article.author }}</strong><small>Автор NovFit</small></div></div>
   <img class="article-visual" :src="article.image_url" :alt="article.title" loading="lazy" decoding="async" />
   <p v-for="(paragraph,index) in article.body.split('\n\n')" :key="index" :class="{lead:index===0}">{{ paragraph }}</p>
   <div class="article-note"><i class="fa-solid fa-lightbulb"></i><span>Прислушивайтесь к своему самочувствию и выбирайте комфортный темп.</span></div>
   <button class="like-button" :class="{liked:article.liked}" :disabled="likeBusy" @click="toggleLike">{{article.liked?'♥':'♡'}} Нравится · {{article.likes||0}}</button>
   <section class="comments"><h2>Комментарии · {{comments.length}}</h2><form @submit.prevent="addComment"><textarea v-model="commentDraft" rows="3" maxlength="2000" placeholder="Поделитесь своим мнением…"></textarea><button :disabled="commentBusy||!commentDraft.trim()">{{commentBusy?'Отправляем…':'Оставить комментарий'}}</button></form><p v-if="commentError" class="comment-error">{{commentError}}</p><article v-for="comment in comments" :key="comment.id" class="comment"><strong>{{comment.name}}</strong><small>@{{comment.nickname}}</small><p>{{comment.body}}</p></article><p v-if="!comments.length" class="no-comments">Пока нет комментариев. Будьте первым!</p></section>
  </article>
 </div>
</template>
<style scoped>
.app-container{max-width:480px;margin:auto;padding:18px 16px 100px;background:#F3F4F5;min-height:100vh}.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}.back-btn{display:flex;align-items:center;gap:9px;border:0;background:transparent;color:#6798F5;font-size:14px;font-weight:700;padding:8px 0}.profile-icon{width:42px;height:42px;border:1px solid #E0E4EA;border-radius:12px;background:#fff;color:#6798F5}.article-detail{background:#fff;border:1px solid #E0E4EA;border-radius:14px;padding:20px;box-shadow:0 3px 12px rgba(37,43,57,.04)}.article-meta{font-size:10px;letter-spacing:1px;color:#6798F5;font-weight:800;margin-bottom:12px}.article-detail h1{font-size:27px;line-height:1.2;color:#252B39;margin:0 0 18px}.author{display:flex;align-items:center;gap:10px;margin-bottom:20px}.author-avatar{width:38px;height:38px;border-radius:10px;background:#6798F5;color:#fff;display:grid;place-items:center;font-weight:800}.author strong,.author small{display:block}.author strong{font-size:13px;color:#252B39}.author small{font-size:11px;color:#8A9BB0;margin-top:3px}.article-visual{width:100%;height:190px;object-fit:cover;border-radius:11px;margin-bottom:20px}.article-detail p{font-size:15px;line-height:1.7;color:#5C6F87;margin:0 0 16px;white-space:pre-line}.article-detail .lead{font-size:16px;color:#252B39;font-weight:600}.article-note{display:flex;gap:12px;align-items:flex-start;background:#EFF4FF;color:#5C6F87;border-radius:10px;padding:14px;font-size:13px;line-height:1.5}.article-note i{color:#6798F5;font-size:18px}.like-button{display:block;margin:18px 0 4px;border:0;border-radius:10px;background:#fff0f2;color:#d94f70;padding:11px 16px;font-weight:750;font-size:14px;cursor:pointer}.like-button.liked{background:#ffe0e7}.comments{margin-top:22px;border-top:1px solid #edf0f4;padding-top:18px}.comments h2{font-size:19px;color:#252b39}.comments form{display:grid;gap:9px}.comments textarea{resize:vertical;border:1px solid #e0e4ea;border-radius:10px;padding:11px;font:inherit;font-size:13px}.comments form button{justify-self:end;border:0;border-radius:9px;background:#6798f5;color:white;padding:10px 14px;font-weight:700}.comment{padding:12px 0;border-bottom:1px solid #edf0f4}.comment strong{font-size:13px;color:#252b39}.comment small{margin-left:7px;color:#8a9bb0;font-size:11px}.comment p{margin:7px 0 0;font-size:13px;line-height:1.5;color:#5c6f87}.comment-error,.no-comments{font-size:12px;color:#8a9bb0}.comment-error{color:#c65b5b}.message{padding:28px;text-align:center;color:#68788D}
</style>
