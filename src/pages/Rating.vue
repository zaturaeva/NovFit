<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../lib/api'
const router=useRouter()
const myRank=ref(24),myPoints=ref(51),weeklyProgress=ref('+10 баллов')
interface FriendItem {
  id: number
  name: string
  points: string
  avatar: string
}
interface FriendApiRow {
  id: number
  name: string
  points: number
}
interface LeaderboardItem {
  rank: number
  name: string
  points: number
  isMe?: boolean
}
const friends = ref<FriendItem[]>([])
const leaderboard = ref<LeaderboardItem[]>([])
const expanded = ref(false)
const openFriends=()=>router.push('/friends')
const showMore=()=>{expanded.value=!expanded.value}
onMounted(async()=>{try{const [data,friendRows]=await Promise.all([api<{rank:number;points:number;leaderboard:LeaderboardItem[]}>('/rating'),api<FriendApiRow[]>('/friends')]);myRank.value=data.rank;myPoints.value=data.points;leaderboard.value=data.leaderboard;friends.value=friendRows.map(f=>({id:f.id,name:f.name,points:`${f.points||0} бал.`,avatar:(f.name||'?').charAt(0)}));}catch(e){console.warn('Не удалось загрузить рейтинг или друзей',e)}})
</script>
<template>
  <div class="app-container">
    <div class="header"><div class="logo">NovFit</div><div class="profile-icon" @click="router.push('/profile')">...</div></div>
    <div class="rating-header-card"><div class="my-rank-title">Моё место</div><div class="rank-main-row"><div class="rank-left"><div class="weekly-progress">Прогресс за неделю: {{ weeklyProgress }}</div><div class="total-points">{{ myPoints }} <span>баллов</span></div></div><div class="rank-position-card"><div class="rank-number-large">#{{ myRank }}</div><div class="rank-label">место</div></div></div></div>
    <div class="friends-section"><div class="section-heading"><div class="section-title">Друзья</div><button class="friends-link" type="button" @click="openFriends">Все друзья <i class="fa-solid fa-arrow-right"></i></button></div><div class="friends-scroll"><div class="friend-card" v-for="friend in friends" :key="friend.id"><div class="friend-avatar">{{friend.avatar}}</div><div class="friend-name">{{friend.name}}</div><div class="friend-points">{{friend.points}}</div></div></div></div>
    <div class="leaderboard-section"><div class="section-title">Общий рейтинг</div><div class="leaderboard-list"><div v-for="item in (expanded?leaderboard:leaderboard.slice(0,5))" :key="item.rank" :class="['leaderboard-item',`rank-${item.rank}`]"><div class="leaderboard-rank"><span>{{item.rank}}</span></div><div class="leaderboard-avatar">{{item.name.split(' ').map(x=>x[0]).join('').slice(0,2)}}</div><div class="leaderboard-info"><div class="leaderboard-name"><span v-if="item.rank<=3" class="name-crown" :class="`crown-${item.rank}`">👑</span>{{item.name}} <span v-if="item.isMe">(вы)</span></div><div class="leaderboard-points"><strong>{{item.points}}</strong> баллов</div></div></div></div><button class="show-more-btn" @click="showMore">{{expanded?'Скрыть':'Показать больше'}}</button></div>
  </div>
</template>
<style scoped>
/* (Стили из оригинального rating.html) */
.app-container { padding: 18px 16px 100px; background-color: #F3F4F5; }
.header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
.logo { font-size: 68px; font-weight: 800; letter-spacing: -1px; background: linear-gradient(135deg, #252B39, #3A4455); background-clip: text; -webkit-background-clip: text; color: transparent; }
.profile-icon { background: #FFFFFF; width: 48px; height: 48px; border-radius: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.05); border: 1px solid #E0E4EA; transition: all .2s; color: #6798F5; font-size: 24px; }
.profile-icon:active { transform: scale(.95); }
.rating-header-card { background: #FFFFFF; border-radius: 32px; padding: 18px 24px 24px; margin-bottom: 20px; border: 1px solid #E0E4EA; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03); }
.my-rank-title { font-size: 20px; font-weight: 700; color: #252B39; margin-bottom: 8px; }
.rank-main-row { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.rank-left { flex: 1; }
.weekly-progress { font-size: 14px; color: #8A9BB0; margin-bottom: 5px; }
.total-points { font-size: 32px; font-weight: 800; color: #6798F5; }
.total-points span { font-size: 14px; font-weight: 500; color: #8F9EB0; }
.rank-position-card { background: linear-gradient(90deg, #CCDDFC 0%, #F4F5F3 100%); border-radius: 28px; padding: 16px 24px; text-align: center; min-width: 100px; }
.rank-number-large { font-size: 48px; font-weight: 800; color: #252B39; line-height: 1; }
.rank-label { font-size: 14px; color: #5C6F87; margin-top: 4px; }
.friends-section { background: #FFFFFF; border-radius: 32px; padding: 24px; margin-bottom: 20px; border: 1px solid #E0E4EA; }
.section-title { font-size: 20px; font-weight: 700; color: #252B39; margin-bottom: 14px; }
.section-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}
.friends-link{border:0;background:transparent;color:#6798F5;font-size:12px;font-weight:700;padding:4px 0;margin-bottom:14px}
.friends-link i{margin-left:4px}
.friends-scroll { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 24px; scrollbar-width: thin; }
.friends-scroll::-webkit-scrollbar { height: 4px; }
.friends-scroll::-webkit-scrollbar-track { background: #F0F2F5; border-radius: 4px; }
.friends-scroll::-webkit-scrollbar-thumb { background: #6798F5; border-radius: 4px; }
.friend-card { background: #F9FAFC; border-radius: 24px; padding: 16px; min-width: 85px; text-align: center; border: 1px solid #E0E4EA; }
.friend-avatar { width: 48px; height: 48px; background: linear-gradient(135deg, #6798F5, #9ABAF8); border-radius: 30px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 20px; font-weight: 700; color: white; }
.friend-name { font-size: 16px; font-weight: 700; color: #252B39; margin-bottom: 4px; }
.friend-points { font-size: 12px; font-weight: 600; color: #6798F5; }
.leaderboard-section { background: #FFFFFF; border-radius: 32px; padding: 24px; margin-bottom: 20px; border: 1px solid #E0E4EA; }
.leaderboard-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.leaderboard-item { display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: #F9FAFC; border-radius: 24px; transition: all 0.2s; }
.leaderboard-item.rank-1,
.leaderboard-item.rank-2,
.leaderboard-item.rank-3 { background: #F9FAFC; border-left: 0; }
.leaderboard-rank { width: 48px; min-height:32px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; font-size: 17px; font-weight: 800; text-align: center; }
.name-crown{display:inline-block;font-size:15px;margin-right:4px;vertical-align:1px}.name-crown.crown-1{filter:drop-shadow(0 1px 1px #f4c165)}.name-crown.crown-2{filter:grayscale(.35)}.name-crown.crown-3{filter:saturate(.75)}
.leaderboard-rank.rank-1 { color: #F4C165; }
.leaderboard-rank.rank-2 { color: #8A9BB0; }
.leaderboard-rank.rank-3 { color: #E0B07F; }
.leaderboard-avatar { width: 48px; height: 48px; background: #EFF4FF; border-radius: 30px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; color: #6798F5; }
.leaderboard-item.rank-1 .leaderboard-avatar,
.leaderboard-item.rank-2 .leaderboard-avatar,
.leaderboard-item.rank-3 .leaderboard-avatar { background: #EFF4FF; color: #6798F5; }
.leaderboard-info { flex: 1; }
.leaderboard-name { font-size: 16px; font-weight: 700; color: #252B39; margin-bottom: 4px; }
.leaderboard-points { font-size: 13px; color: #8A9BB0; }
.leaderboard-points strong { color: #6798F5; font-weight: 700; }
.show-more-btn { width: 100%; background: #EFF4FF; border: none; padding: 14px; border-radius: 30px; font-size: 14px; font-weight: 600; color: #6798F5; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
.show-more-btn:active { transform: scale(0.98); background: #E8ECF2; }

.rating-header-card,.friends-section,.leaderboard-section{border-radius:14px;box-shadow:0 3px 12px rgba(37,43,57,.035)}
.rank-position-card{border-radius:10px}
.friend-card{border-radius:10px;padding:13px}
.friend-avatar,.leaderboard-avatar{border-radius:10px}
.leaderboard-item{border-radius:10px;padding:13px 14px;border-left:0}
.show-more-btn{border-radius:9px;box-shadow:none}
</style>

/* Компактный блок личного места и короны призёров */
.rank-main-row{align-items:flex-start}
.rank-left{padding-top:2px}
.rank-position-card{background:linear-gradient(90deg,#CCDDFC 0%,#F4F5F3 100%)}
.leaderboard-rank{line-height:1.05;flex-direction:row}
