<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
const router = useRouter()
const articles = ref<any[]>([])
const videos = ref<any[]>([])
const loading = ref(false)
const hasMore = ref(true)
const nextOffset = ref(0)
const error = ref('')
const sentinel = ref<HTMLElement | null>(null)
const selectedVideo = ref<any | null>(null)
const showCreate=ref(false), savingArticle=ref(false), articleDraft=ref({title:'',category:'Тренировки',excerpt:'',body:'',image_url:''})
const createError=ref('')
async function createArticle(){createError.value='';savingArticle.value=true;try{const result=await api<any>('/articles',{method:'POST',body:JSON.stringify(articleDraft.value)});articleDraft.value={title:'',category:'Тренировки',excerpt:'',body:'',image_url:''};showCreate.value=false;nextOffset.value=0;articles.value=[];hasMore.value=true;await loadArticles();router.push(`/articles/${result.slug}`)}catch(e:any){createError.value=e.message}finally{savingArticle.value=false}}
let observer: IntersectionObserver | null = null
const loadArticles = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true; error.value = ''
  try {
    const result = await api<{items:any[];hasMore:boolean;nextOffset:number}>(`/articles?limit=4&offset=${nextOffset.value}`)
    articles.value.push(...result.items)
    hasMore.value = result.hasMore
    nextOffset.value = result.nextOffset
  } catch (e:any) { error.value = e.message || 'Не удалось загрузить статьи' }
  finally { loading.value = false }
}
const loadVideos = async () => { try { videos.value = await api('/videos') } catch { /* раздел статей остаётся доступным */ } }
const openVideo = (video:any) => { selectedVideo.value = video }
onMounted(async () => {
  await Promise.all([loadArticles(), loadVideos()])
  if ('IntersectionObserver' in window && sentinel.value) {
    observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) loadArticles() }, { rootMargin: '320px 0px' })
    observer.observe(sentinel.value)
  }
})
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <div class="app-container">
    <header class="header">
      <div class="logo">NovFit</div>
      <button class="profile-icon" aria-label="Профиль" @click="router.push('/profile')"><i class="fa-solid fa-user"></i></button>
    </header>
    <div class="articles-title-row"><h1 class="section-title">Интересные статьи</h1><button class="load-more create-article" @click="showCreate=!showCreate">＋ Добавить статью</button></div>
    <form v-if="showCreate" class="create-form" @submit.prevent="createArticle"><h3>Новая статья</h3><input v-model="articleDraft.title" required maxlength="140" placeholder="Название статьи"><input v-model="articleDraft.category" required placeholder="Категория"><input v-model="articleDraft.excerpt" required maxlength="300" placeholder="Краткое описание"><input v-model="articleDraft.image_url" placeholder="URL обложки (необязательно)"><textarea v-model="articleDraft.body" required rows="7" placeholder="Текст статьи"></textarea><p v-if="createError" class="create-error">{{createError}}</p><div class="create-actions"><button type="button" class="article-btn" @click="showCreate=false">Отмена</button><button class="watch-btn" :disabled="savingArticle">{{savingArticle?'Публикуем…':'Опубликовать'}}</button></div></form>
    <article v-for="article in articles" :key="article.id" class="article-card">
      <img class="article-image" :src="article.image_url" :alt="article.title" loading="lazy" decoding="async" />
      <div class="article-heading">
        <div class="article-icon"><i class="fa-solid fa-file-lines"></i></div>
        <div><div class="article-category">{{ article.category }} · {{ article.read_minutes }} МИН ЧТЕНИЯ</div><h2 class="article-title">{{ article.title }}</h2></div>
      </div>
      <p class="article-description">{{ article.excerpt }}</p>
      <footer class="article-footer">
        <div class="author-info"><div class="author-avatar">{{ article.author?.charAt(0) }}</div><span class="author-name">{{ article.author }}</span></div>
        <button class="article-btn" @click="router.push(`/articles/${article.slug}`)">Читать <i class="fa-solid fa-arrow-right"></i></button>
      </footer>
    </article>
    <div ref="sentinel" class="load-sentinel" aria-hidden="true"></div>
    <p v-if="loading" class="load-status">Загружаем статьи…</p>
    <div v-if="error" class="load-status error-state"><span>{{ error }}</span><button class="article-btn" @click="loadArticles">Повторить</button></div>
    <p v-if="!hasMore && articles.length" class="load-status">Вы посмотрели все статьи</p>
    <button v-if="hasMore && !loading" class="load-more" @click="loadArticles">Загрузить ещё</button>

    <h2 class="section-title video-section-title">Видео тренировки</h2>
    <article v-for="video in videos" :key="video.id" class="video-card">
      <div class="video-heading"><div class="video-icon"><i class="fa-solid fa-film"></i></div><h3 class="video-title">{{ video.title }}</h3></div>
      <button class="video-cover" :aria-label="`Смотреть: ${video.title}`" @click="openVideo(video)">
        <img class="video-cover-image" :src="video.cover_url" :alt="video.title" loading="lazy" decoding="async" />
        <span class="video-play-icon"><i class="fa-solid fa-play"></i></span><span class="video-duration">{{ video.duration }}</span>
      </button>
      <p class="video-description">{{ video.description }}</p>
      <footer class="article-footer"><div class="author-info"><div class="author-avatar">{{ video.author?.charAt(0) }}</div><span class="author-name">{{ video.author }}</span></div><button class="watch-btn" @click="openVideo(video)">Смотреть</button></footer>
    </article>
    <div v-if="selectedVideo" class="video-modal" @click.self="selectedVideo=null">
      <div class="video-dialog"><button class="close-video" aria-label="Закрыть" @click="selectedVideo=null">×</button><div class="video-frame"><iframe :src="`https://www.youtube-nocookie.com/embed/${selectedVideo.youtube_id}?autoplay=1&rel=0`" :title="selectedVideo.title" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><h3>{{ selectedVideo.title }}</h3><p>{{ selectedVideo.description }}</p></div>
    </div>
  </div>
</template>

<style scoped>
.app-container{max-width:480px;margin:auto;padding:18px 16px 100px;background:#F3F4F5;min-height:100vh}.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}.logo{font-size:48px;font-weight:800;letter-spacing:-2px;background:linear-gradient(135deg,#252B39,#3A4455);background-clip:text;-webkit-background-clip:text;color:transparent}.profile-icon{width:44px;height:44px;border:1px solid #E0E4EA;border-radius:12px;background:#fff;color:#6798F5;font-size:17px}.articles-title-row{display:flex;align-items:center;justify-content:space-between;gap:8px}.create-article{margin:0 0 15px 6px;padding:9px 10px;font-size:11px;white-space:nowrap;transform:translateX(5px)}.create-form{display:grid;gap:10px;background:#fff;border:1px solid #e0e4ea;border-radius:14px;padding:15px;margin-bottom:18px}.create-form h3{margin:0;color:#252b39}.create-form input,.create-form textarea{width:100%;box-sizing:border-box;border:1px solid #e0e4ea;border-radius:9px;padding:11px;font:inherit;font-size:13px}.create-actions{display:flex;justify-content:flex-end;gap:8px}.create-error{color:#c65b5b;font-size:12px;margin:0}.section-title{font-size:21px;font-weight:750;color:#252B39;margin:0 0 15px}.article-card,.video-card{background:#fff;border:1px solid #E0E4EA;border-radius:14px;padding:16px;margin-bottom:18px;box-shadow:0 3px 12px rgba(37,43,57,.04)}.article-image{display:block;width:100%;height:160px;object-fit:cover;border-radius:10px;margin-bottom:15px;background:#EFF4FF}.article-heading,.video-heading{display:flex;align-items:center;gap:13px;margin-bottom:15px}.article-icon,.video-icon{width:44px;height:44px;border-radius:12px;background:#FCE6A4;color:#C97E00;display:grid;place-items:center;font-size:19px;flex-shrink:0}.article-category{font-size:10px;letter-spacing:.8px;font-weight:800;color:#8A9BB0;margin-bottom:5px}.article-title,.video-title{font-size:17px;line-height:1.3;font-weight:800;color:#252B39;margin:0}.article-description,.video-description{font-size:14px;line-height:1.55;color:#5C6F87;background:#F5F7FA;border-radius:10px;padding:13px;margin:0 0 15px}.article-footer{display:flex;align-items:center;justify-content:space-between;gap:10px}.author-info{display:flex;align-items:center;gap:9px}.author-avatar{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#6798F5,#9ABAF8);display:grid;place-items:center;color:white;font-weight:700;flex-shrink:0}.author-name{font-size:13px;font-weight:600;color:#252B39}.article-btn,.watch-btn,.load-more{border:0;border-radius:9px;padding:10px 13px;font-size:13px;font-weight:700;color:#6798F5;background:#EFF4FF;cursor:pointer}.article-btn i{margin-left:6px}.video-section-title{margin-top:28px}.video-cover{width:100%;height:190px;border:0;border-radius:11px;background:#E8EEFC;display:grid;place-items:center;position:relative;margin-bottom:12px;cursor:pointer;overflow:hidden}.video-cover-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.video-play-icon{position:relative;z-index:1;width:54px;height:54px;border-radius:50%;background:#6798F5;color:#fff;display:grid;place-items:center;font-size:18px}.video-duration{position:absolute;z-index:1;right:11px;bottom:10px;background:rgba(37,43,57,.78);color:#fff;padding:5px 8px;border-radius:6px;font-size:11px}.watch-btn{background:#6798F5;color:#fff;padding:10px 17px}.load-sentinel{height:2px}.load-status{text-align:center;color:#8190A4;font-size:13px;padding:12px}.error-state{display:flex;justify-content:center;align-items:center;gap:12px;color:#B64A4A}.load-more{display:block;margin:0 auto 18px;background:#6798F5;color:#fff;padding:12px 22px}.video-modal{position:fixed;inset:0;background:rgba(18,25,39,.78);z-index:1000;display:grid;place-items:center;padding:18px}.video-dialog{position:relative;width:min(100%,650px);background:#fff;border-radius:16px;padding:16px;color:#252B39}.close-video{position:absolute;right:10px;top:6px;border:0;background:#EFF2F7;border-radius:50%;width:34px;height:34px;font-size:24px;z-index:2;cursor:pointer}.video-frame{aspect-ratio:16/9;margin:28px 0 12px}.video-frame iframe{width:100%;height:100%;border:0;border-radius:10px}.video-dialog h3{margin:8px 0;font-size:18px}.video-dialog p{font-size:13px;color:#68788D}
</style>
