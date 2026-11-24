<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import ProgressRing from '../components/ProgressRing.vue'
import { api, getToken } from '../lib/api'
const router=useRouter()
const dateKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const monday=new Date(); monday.setHours(12,0,0,0); monday.setDate(monday.getDate()-((monday.getDay()+6)%7))
const days=['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map((name,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return {id:dateKey(d),name,number:d.getDate()}})
const selectedDay=ref(dateKey(new Date()))
const steps=ref(0),stepsGoal=ref(60),stepsKcal=ref(0),stepsKm=ref('0,00')
const waterLiters=ref(0),waterGoal=ref(2),sleepHours=ref(0),sleepGoal=ref(8),calories=ref(0),caloriesGoal=ref(1500),burned=ref(0),activityGoal=ref(500),activityMinutes=ref(0)
const protein=ref(0),fat=ref(0),carbs=ref(0),ratingRank=ref('—'),ratingPoints=ref(0)
const modal=ref<'water'|'sleep'|'calories'|'activity'|'goal'|null>(null),amount=ref<number|null>(null),goalWater=ref(2),goalSleep=ref(8),error=ref(''),mealMacros=ref({protein:0,fat:0,carbs:0})
async function refresh(){const d=await api<any>(`/dashboard?date=${selectedDay.value}`);waterLiters.value=d.water;waterGoal.value=d.waterGoal;sleepHours.value=d.sleep;sleepGoal.value=d.sleepGoal;calories.value=d.calories;protein.value=d.protein||0;fat.value=d.fat||0;carbs.value=d.carbs||0;burned.value=d.burned;activityMinutes.value=d.activityMinutes||0;steps.value=activityMinutes.value;stepsKcal.value=d.burned;stepsKm.value=(activityMinutes.value*0.06).toFixed(2).replace('.',',')}
onMounted(async()=>{if(!getToken()){router.replace('/auth');return}try{await refresh();const r=await api<any>('/rating');ratingRank.value=r.rank;ratingPoints.value=r.points}catch{router.replace('/auth')}})
function open(type:'water'|'sleep'|'calories'|'activity'|'goal'){modal.value=type;error.value='';amount.value=null;goalWater.value=waterGoal.value;goalSleep.value=sleepGoal.value;mealMacros.value={protein:0,fat:0,carbs:0}}
async function save(){error.value='';try{if(modal.value==='goal')await api('/goals',{method:'PATCH',body:JSON.stringify({waterGoal:goalWater.value,sleepGoal:goalSleep.value,date:selectedDay.value})});else{const entered=Number(amount.value);if(!entered||entered<=0)throw new Error('Введите значение больше нуля');const type=modal.value==='water'?'water':modal.value==='sleep'?'sleep':modal.value==='activity'?'activity':'meal';const n=type==='water'?entered/1000:entered;await api('/logs',{method:'POST',body:JSON.stringify({type,amount:n,goal:type==='water'?waterGoal.value:type==='sleep'?sleepGoal.value:null,title:type==='meal'?'Приём пищи':type==='water'?'Вода':type==='activity'?'Тренировка':'Сон',calories:(type==='meal'||type==='activity')?n:null,protein:type==='meal'?Number(mealMacros.value.protein)||0:0,fat:type==='meal'?Number(mealMacros.value.fat)||0:0,carbs:type==='meal'?Number(mealMacros.value.carbs)||0:0,duration:type==='activity'?30:null,date:selectedDay.value})})}modal.value=null;await refresh()}catch(e:any){error.value=e.message}}
</script>
<template>
 <div class="app-container">
  <div class="header"><div class="logo">NovFit</div><div class="profile-icon" @click="router.push('/profile')"><i class="fa-solid fa-user"></i></div></div>
  <div class="week-row"><div v-for="day in days" :key="day.id" class="day-cell" :class="{active:selectedDay===day.id}" @click="selectedDay=day.id;refresh()"><div class="day-name">{{day.name}}</div><div class="day-number">{{day.number}}</div></div></div>
  <div class="rating-section" @click="router.push('/rating')"><div class="rating-left"><div class="section-title">Рейтинг</div><div class="rating-points-small">{{ratingPoints}} <span>баллов</span></div><button class="view-rating-btn" @click.stop="router.push('/rating')">просмотреть</button></div><div class="rating-right"><div class="rank-number">{{ratingRank}}</div><div style="font-size:12px;color:#5C6F87">место</div></div></div>
  <div class="steps-full-card"><div class="steps-header"><div class="steps-title">Активность</div></div><div class="steps-content"><div class="steps-stats"><div class="steps-number-large">{{steps}} мин</div><div class="steps-goal">минут активности за день</div><div class="steps-details-row"><span>{{stepsKcal}}</span> ккал · {{stepsKm}} км (оценка)</div></div><div class="steps-ring-area"><ProgressRing :value="steps" :goal="stepsGoal" :size="104" color="steps"/></div></div></div>
  <div class="stats-grid">
   <div class="stat-card"><div class="card-header"><div class="stat-title">Вода</div><div style="display:flex;gap:4px"><button class="settings-icon" aria-label="Изменить цели" @click="open('goal')"><i class="fa-solid fa-gear"></i></button><button class="add-btn" aria-label="Добавить воду" @click="open('water')">+</button></div></div><div class="stat-progress-area"><ProgressRing :value="waterLiters" :goal="waterGoal" :size="104" color="#9ABAF8"/><div class="stat-goal">{{waterLiters.toFixed(2)}} / {{waterGoal.toFixed(2)}} л</div></div></div>
   <div class="stat-card"><div class="card-header"><div class="stat-title">Сон</div><div style="display:flex;gap:4px"><button class="settings-icon" aria-label="Изменить цели" @click="open('goal')"><i class="fa-solid fa-gear"></i></button><button class="add-btn" aria-label="Добавить сон" @click="open('sleep')">+</button></div></div><div class="stat-progress-area"><ProgressRing :value="sleepHours" :goal="sleepGoal" :size="104" color="#F4C165"/><div class="stat-goal">{{sleepHours.toFixed(1)}} / {{sleepGoal.toFixed(1)}} ч</div></div></div>
  </div>
  <div class="activity-home-card"><div class="nutrition-header"><div class="nutrition-title">Активность</div><button class="add-btn" @click="open('activity')">+</button></div><div class="activity-home-content"><ProgressRing :value="burned" :goal="activityGoal" :size="90" color="#F4C165"/><div><strong>{{burned}} ккал</strong><p>цель {{activityGoal}} ккал</p></div></div></div>
  <div class="nutrition-card"><div class="nutrition-header"><div class="nutrition-title">Питание</div><button class="add-btn" @click="open('calories')">+</button></div><div class="nutrition-content"><div class="macros"><div class="macro-item"><span class="macro-label">белки</span><span class="macro-value">{{Math.round(protein)}} г</span></div><div class="macro-item"><span class="macro-label">жиры</span><span class="macro-value">{{Math.round(fat)}} г</span></div><div class="macro-item"><span class="macro-label">углеводы</span><span class="macro-value">{{Math.round(carbs)}} г</span></div></div><div class="calories-circle"><ProgressRing :value="calories" :goal="caloriesGoal" :size="90" :stroke="6" valueFontSize="11px" color="calories"/><div class="calories-text"><span class="calories-current">{{calories}}</span> / {{caloriesGoal}} ккал</div></div></div></div>
 </div>
 <div v-if="modal" class="home-modal-backdrop" @click.self="modal=null"><section class="home-modal"><button class="home-modal-close" @click="modal=null">×</button><h2>{{modal==='water'?'Добавить воду':modal==='sleep'?'Добавить сон':modal==='calories'?'Добавить калории':modal==='activity'?'Добавить активность':'Цели на день'}}</h2>
  <template v-if="modal==='calories'"><label>Белки (г)<input v-model.number="mealMacros.protein" type="number" min="0" step="1" placeholder="Например, 25"></label><label>Жиры (г)<input v-model.number="mealMacros.fat" type="number" min="0" step="1" placeholder="Например, 15"></label><label>Углеводы (г)<input v-model.number="mealMacros.carbs" type="number" min="0" step="1" placeholder="Например, 40"></label></template><template v-if="modal==='goal'"><label>Цель воды (л)<input v-model.number="goalWater" type="number" min=".1" step=".1"></label><label>Цель сна (ч)<input v-model.number="goalSleep" type="number" min=".1" step=".5"></label></template>
  <template v-else><label>{{modal==='water'?'Количество воды (мл)':modal==='sleep'?'Продолжительность сна (ч)':modal==='activity'?'Сожжено калорий':'Калории (ккал)'}}<input v-model.number="amount" type="number" min="1" :step="modal==='water'?50:0.1" :placeholder="modal==='water'?'250':modal==='sleep'?'7.5':'350'"></label><div v-if="modal==='water'" class="quick-values"><button v-for="v in [250,350,500,750]" :key="v" @click="amount=v">{{v}} мл</button></div><div v-if="modal==='sleep'" class="quick-values"><button v-for="v in [6,7,7.5,8,9]" :key="v" @click="amount=v">{{v}} ч</button></div></template>
  <p v-if="error" class="home-modal-error">{{error}}</p><button class="home-modal-save" @click="save">Сохранить</button>
 </section></div>
</template>
<style scoped>
.app-container {
  max-width: 480px;
  margin: 0 auto;
  padding: 18px 16px 100px;
  background-color: #F3F4F5;
}
.header {
  margin-bottom: 32px;
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
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
  border: 1px solid #E0E4EA;
  transition: all .2s;
}
.profile-icon:active {
  transform: scale(.95);
}
.week-row {
  display: flex;
  justify-content: space-between;
  background: #FFFFFF;
  border-radius: 28px;
  padding: 12px 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,.03);
  border: 1px solid #E0E4EA;
  margin-bottom: 32px;
}
.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  cursor: pointer;
}
.day-name {
  font-size: 13px;
  font-weight: 600;
  color: #6C7A8E;
  margin-bottom: 6px;
}
.day-number {
  font-size: 18px;
  font-weight: 700;
  color: #252B39;
  background: #F0F2F5;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 30px;
  transition: all .2s;
}
.day-cell.active .day-number {
  background: #F4C165;
  color: #252B39;
  box-shadow: 0 2px 8px rgba(244,193,101,.3);
}
.day-cell.active .day-name {
  color: #F4C165;
  font-weight: 700;
}
.rating-section {
  background: #FFFFFF;
  border-radius: 32px;
  padding: 20px 24px;
  margin-bottom: 20px;
  border: 1px solid #E0E4EA;
  box-shadow: 0 2px 8px rgba(0,0,0,.02);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all .2s;
}
.rating-section:active {
  transform: scale(.98);
  background: #FAFAFC;
}
.rating-left {
  flex: 1;
}
.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #252B39;
  margin-bottom: 12px;
}
.rating-points-small {
  font-size: 24px;
  font-weight: 800;
  color: #6798F5;
  margin-bottom: 6px;
}
.rating-points-small span {
  font-size: 14px;
  font-weight: 500;
  color: #8F9EB0;
}
.view-rating-btn {
  background: #F0F2F5;
  border: none;
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  color: #6798F5;
  cursor: pointer;
  transition: all .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
}
.view-rating-btn:active {
  transform: scale(.96);
}
.rating-right {
  background: linear-gradient(135deg,#EFF4FF 0%,#E8EEFC 100%);
  border-radius: 28px;
  padding: 12px 20px;
  text-align: center;
  min-width: 90px;
}
.rank-number {
  font-size: 42px;
  font-weight: 800;
  color: #252B39;
  line-height: 1;
}
.steps-full-card {
  background: #FFFFFF;
  border-radius: 32px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #E0E4EA;
  box-shadow: 0 2px 8px rgba(0,0,0,.03);
}
.steps-header {
  margin-bottom: 16px;
}
.steps-title {
  font-size: 22px;
  font-weight: 700;
  color: #252B39;
}
.steps-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}
.steps-stats {
  flex: 1;
}
.steps-number-large {
  font-size: 34px;
  font-weight: 800;
  color: #252B39;
}
.steps-goal {
  font-size: 13px;
  color: #8A9BB0;
  margin-top: 4px;
}
.steps-details-row {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 13px;
  color: #6C7F92;
}
.steps-ring-area {
  flex-shrink: 0;
}
.stats-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: #FFFFFF;
  border-radius: 28px;
  padding: 18px 16px;
  flex: 1;
  min-width: 130px;
  border: 1px solid #E0E4EA;
  box-shadow: 0 2px 8px rgba(0,0,0,.03);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.stat-title {
  font-size: 22px;
  font-weight: 700;
  color: #252B39;
}
.add-btn {
  background: #F0F2F5;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 30px;
  font-size: 22px;
  font-weight: 500;
  color: #6798F5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .2s;
  box-shadow: 0 2px 6px rgba(0,0,0,.08);
}
.add-btn:active {
  transform: scale(.94);
}
.settings-icon {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  margin-right: 4px;
  padding: 4px;
  opacity: .6;
}
.stat-progress-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.stat-goal {
  font-size: 13px;
  color: #8A9BB0;
}
.nutrition-card {
  background: #FFFFFF;
  border-radius: 32px;
  padding: 20px;
  margin-bottom: 28px;
  border: 1px solid #E0E4EA;
  box-shadow: 0 2px 8px rgba(0,0,0,.03);
}
.nutrition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.nutrition-title {
  font-size: 22px;
  font-weight: 700;
  color: #252B39;
}
.nutrition-content {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
}
.macros {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.macro-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 0;
  border-bottom: 1px solid #F0F2F5;
}
.macro-label {
  font-size: 13px;
  font-weight: 500;
  color: #8D9EB0;
}
.macro-value {
  font-size: 15px;
  font-weight: 700;
  color: #6798F5;
}
.calories-circle {
  flex-shrink: 0;
}
.calories-text {
  text-align: center;
  margin-top: 8px;
}
.calories-current {
  font-size: 20px;
  font-weight: 800;
  color: #252B39;
}

/* Питание: компактная карточка с отдельными показателями */
.nutrition-card{border:1px solid #E0E4EA;border-radius:14px;padding:18px;box-shadow:0 3px 12px rgba(37,43,57,.035)}
.nutrition-header{margin-bottom:16px}
.nutrition-title{font-size:20px;letter-spacing:-.3px}
.nutrition-content{display:flex;flex-direction:column;gap:16px}
.macros{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%}
.macro-item{display:flex;flex-direction:column;gap:6px;align-items:flex-start;text-align:left;background:#F8FAFD;border:1px solid #EEF1F5;border-radius:9px;padding:11px 9px}
.macro-label{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#8A9BB0}
.macro-value{font-size:14px;font-weight:750;color:#252B39}
.calories-circle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#EFF4FF;border-radius:10px;padding:12px}
.calories-text{font-size:13px;color:#5C6F87;text-align:right}
.calories-current{font-size:24px;font-weight:800;color:#252B39}
.add-btn,.settings-icon{border-radius:9px}
</style>
<style scoped>
.activity-home-card{background:#fff;border:1px solid #E0E4EA;border-radius:20px;padding:18px;margin-bottom:22px}.activity-home-content{display:flex;align-items:center;gap:18px}.activity-home-content strong{font-size:22px;color:#252B39}.activity-home-content p{font-size:13px;color:#8A9BB0;margin:5px 0}.home-modal-backdrop{position:fixed;inset:0;background:#18243b66;z-index:1000;display:grid;place-items:center;padding:18px}.home-modal{position:relative;background:#fff;border-radius:20px;padding:24px;width:min(100%,360px);display:grid;gap:14px;box-shadow:0 12px 40px #18243b33;color:#465675}.home-modal h2{font-size:21px;margin:0 28px 4px 0}.home-modal label{display:grid;gap:7px;font-size:13px}.home-modal input{border:1px solid #dce3ee;border-radius:9px;padding:12px;font:inherit;color:#465675}.home-modal-close{position:absolute;right:14px;top:10px;border:0;background:none;font-size:28px;color:#8090a8}.home-modal-save{border:0;border-radius:10px;background:#6798f5;color:white;padding:12px;font-weight:600}.home-modal-error{margin:0;color:#c65b5b;font-size:12px}.quick-values{display:flex;gap:8px;flex-wrap:wrap}.quick-values button{border:0;border-radius:8px;padding:8px 12px;background:#eff4ff;color:#547dc4}
</style>
