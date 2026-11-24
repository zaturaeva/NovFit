<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../lib/api'
import { useRouter } from 'vue-router'
import ProgressRing from '../components/ProgressRing.vue'
import Modal from '../components/Modal.vue'
const router=useRouter()
const dateKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const selectedDay=ref(dateKey(new Date()))
const visibleWeekStart=ref((()=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d})())
const monthValue=ref(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`)
const monthLabel=computed(()=>new Date(`${monthValue.value}-02T12:00:00`).toLocaleDateString('ru-RU',{month:'long',year:'numeric'}))
const days=computed(()=>Array.from({length:7},(_,i)=>{const d=new Date(visibleWeekStart.value);d.setDate(d.getDate()+i);return {id:dateKey(d),name:['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'][i],number:d.getDate()}}))
function shiftWeek(delta:number){const d=new Date(visibleWeekStart.value);d.setDate(d.getDate()+delta*7);visibleWeekStart.value=d;selectedDay.value=dateKey(d);monthValue.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;refresh()}
function chooseMonth(value:string){if(!value)return;monthValue.value=value;const [y,m]=value.split('-').map(Number);const first=new Date(y,m-1,1,12);first.setDate(first.getDate()-((first.getDay()+6)%7));visibleWeekStart.value=first;selectedDay.value=dateKey(new Date(y,m-1,1,12));refresh()}
function selectDay(id:string){selectedDay.value=id;refresh()}
const totalCalories=ref(0),caloriesGoal=1500
const totalProtein=ref(0),totalFat=ref(0),totalCarbs=ref(0)
const meals=ref([{id:'breakfast',name:'завтрак',calories:0,percent:0},{id:'lunch',name:'обед',calories:0,percent:0},{id:'dinner',name:'ужин',calories:0,percent:0},{id:'other',name:'другое',calories:0,percent:0}])
const caloriesPercent=computed(()=>Math.round(totalCalories.value/caloriesGoal*100))
const caloriesCircumference=2*Math.PI*42
const caloriesDashOffset=computed(()=>caloriesCircumference*(1-Math.min(totalCalories.value/caloriesGoal,1)))
const totalBurned=ref(0),activityMinutes=ref(0)
const exercises=ref<any[]>([])
const isMealModalOpen=ref(false),isExerciseModalOpen=ref(false)
const newMeal=ref({type:'breakfast',calories:null as number|null,protein:0,fat:0,carbs:0})
const newExercise=ref({name:'',duration:null as number|null,calories:null as number|null})
const stepsCircumference=2*Math.PI*36
const stepsDashOffset=computed(()=>stepsCircumference*(1-Math.min(activityMinutes.value/60,1)))
const stepsPercent=computed(()=>Math.min(100,Math.round(activityMinutes.value/60*100)))
function category(title:string){const t=title.toLowerCase();if(t.includes('завтрак')||t.includes('breakfast'))return 'breakfast';if(t.includes('обед')||t.includes('lunch'))return 'lunch';if(t.includes('ужин')||t.includes('dinner'))return 'dinner';return 'other'}
async function refresh(){const data=await api<any>(`/dashboard?date=${selectedDay.value}`);totalCalories.value=data.calories;totalProtein.value=data.protein||0;totalFat.value=data.fat||0;totalCarbs.value=data.carbs||0;totalBurned.value=data.burned;activityMinutes.value=data.activityMinutes||0;meals.value.forEach(m=>m.calories=0);for(const log of data.logs.filter((x:any)=>x.type==='meal')){const key=category(log.title||'');const item=meals.value.find(m=>m.id===key)!;item.calories+=Number(log.calories??log.amount)}const sum=meals.value.reduce((a,m)=>a+m.calories,0);meals.value.forEach(m=>m.percent=sum?Math.round(m.calories/sum*100):0);exercises.value=data.activities||[]}
const showAddMealModal=()=>{newMeal.value={type:'breakfast',calories:null,protein:0,fat:0,carbs:0};isMealModalOpen.value=true}
const closeMealModal=()=>{isMealModalOpen.value=false}
async function saveMeal(){const calories=Number(newMeal.value.calories);if(!calories||calories<=0){alert('Введите корректное количество калорий');return}try{await api('/logs',{method:'POST',body:JSON.stringify({type:'meal',amount:calories,calories,title:newMeal.value.type,protein:newMeal.value.protein,fat:newMeal.value.fat,carbs:newMeal.value.carbs,date:selectedDay.value})});closeMealModal();await refresh()}catch(e:any){alert(e.message||'Не удалось сохранить')}}
const showAddExerciseModal=()=>{newExercise.value={name:'',duration:null,calories:null};isExerciseModalOpen.value=true}
const closeExerciseModal=()=>{isExerciseModalOpen.value=false}
async function saveExercise(){const name=newExercise.value.name.trim(),duration=Number(newExercise.value.duration),calories=Number(newExercise.value.calories);if(!name||duration<=0||calories<=0){alert('Заполните все поля');return}try{await api('/logs',{method:'POST',body:JSON.stringify({type:'activity',amount:calories,calories,duration,title:name,date:selectedDay.value})});closeExerciseModal();await refresh()}catch(e:any){alert(e.message||'Не удалось сохранить')}}
onMounted(()=>refresh().catch(e=>console.warn('Не удалось загрузить дневник',e)))
</script>

<template>
  <div class="app-container">
    <div class="header">
      <div class="logo">NovFit</div>
      <div class="profile-icon" @click="router.push('/profile')">...</div>
    </div>

    <div class="calendar-panel">
      <div class="calendar-month"><button aria-label="Предыдущая неделя" @click="shiftWeek(-1)">‹</button><label>{{ monthLabel }}<input type="month" :value="monthValue" @change="chooseMonth(($event.target as HTMLInputElement).value)" /></label><button aria-label="Следующая неделя" @click="shiftWeek(1)">›</button></div>
      <div class="week-row"><div v-for="day in days" :key="day.id" class="day-cell" :class="{ active: selectedDay === day.id }" @click="selectDay(day.id)"><div class="day-name">{{ day.name }}</div><div class="day-number">{{ day.number }}</div></div></div>
    </div>



    <div class="nutrition-card">
      <div class="nutrition-header">
        <div class="section-title">Питание</div>
        <button class="add-btn" @click="showAddMealModal">+</button>
      </div>
      <div class="macros-row">
        <div class="macro-item">
          <div class="macro-value">{{ Math.round(totalProtein) }} г</div>
          <div class="macro-label">белки</div>
        </div>
        <div class="macro-item">
          <div class="macro-value">{{ Math.round(totalFat) }} г</div>
          <div class="macro-label">жиры</div>
        </div>
        <div class="macro-item">
          <div class="macro-value">{{ Math.round(totalCarbs) }} г</div>
          <div class="macro-label">углеводы</div>
        </div>
      </div>
      <div class="calories-row">
        <div class="calories-left">
          <span class="calories-current">{{ totalCalories }}</span>
          <span class="calories-target">/ {{ caloriesGoal }} ккал</span>
        </div>
        <div class="yellow-ring">
          <ProgressRing 
            :value="totalCalories" 
            :goal="caloriesGoal" 
            :size="112" 
            :stroke="7" valueFontSize="17px" 
            color="calories" 
          />
        </div>
      </div>
      <div class="meals-grid">
        <div v-for="meal in meals" :key="meal.id" class="meal-item" :data-meal="meal.id">
          <div class="meal-name">{{ meal.name }}</div>
          <div class="meal-percent">{{ meal.percent }}%</div>
          <div class="meal-calories">{{ meal.calories }} ккал</div>
        </div>
      </div>
    </div>

    <div class="activity-card">
      <div class="section-title">Активность</div>
      <div class="steps-row">
        <div class="steps-info">
          <div class="steps-value">{{ activityMinutes }} мин</div>
          <div class="steps-details">{{ totalBurned }} ккал за день</div>
        </div>
        <div class="steps-ring">
          <div class="progress-ring-small" id="stepsRingSmall">
            <svg width="70" height="70" viewBox="0 0 84 84" class="progress-ring-svg-small">
              <circle cx="42" cy="42" r="36" class="progress-ring-bg-small" stroke-width="6" fill="none"/>
              <circle cx="42" cy="42" r="36" class="progress-ring-fill-small" stroke-width="6" fill="none" stroke-linecap="round" :stroke-dasharray="stepsCircumference" :stroke-dashoffset="stepsDashOffset"/>
            </svg>
            <div class="progress-value-small">{{ stepsPercent }}%</div>
          </div>
        </div>
      </div>
      <div class="exercises-header">
        <div class="exercises-title">упражнения</div>
        <button class="add-btn" @click="showAddExerciseModal">+</button>
      </div>
      <div v-for="(exercise, index) in exercises" :key="exercise.id" :id="index === 0 ? 'exerciseList' : undefined">
        <div>
          <div class="exercise-name">{{ exercise.title || exercise.name }}</div>
          <div class="exercise-duration">{{ exercise.duration }} мин</div>
        </div>
        <div class="exercise-calories">{{ exercise.calories }}</div>
      </div>
      <div class="activity-summary">
        <span class="progress-label">Всего сожжено:</span>
        <span class="summary-value">{{ totalBurned }} ккал</span>
      </div>
    </div>
  </div>

  <!-- Modals -->
  <Modal :open="isMealModalOpen" @close="closeMealModal" title="Добавить приём пищи">
    <div class="modal-field">
      <label class="modal-label">Тип приёма пищи</label>
      <div class="meal-radio-group" role="radiogroup" aria-label="Тип приёма пищи">
        <label v-for="mealType in [{ value: 'breakfast', label: 'Завтрак', icon: 'fa-mug-hot' }, { value: 'lunch', label: 'Обед', icon: 'fa-bowl-food' }, { value: 'dinner', label: 'Ужин', icon: 'fa-moon' }, { value: 'other', label: 'Другое', icon: 'fa-utensils' }]" :key="mealType.value" class="meal-radio" :class="{ selected: newMeal.type === mealType.value }">
          <input type="radio" name="meal-type" :value="mealType.value" v-model="newMeal.type">
          <i class="fa-solid" :class="mealType.icon"></i><span>{{ mealType.label }}</span><i v-if="newMeal.type === mealType.value" class="fa-solid fa-circle-check selected-check"></i>
        </label>
      </div>
    </div>
    <div class="modal-field">
      <label class="modal-label">Количество калорий</label>
      <input type="number" class="modal-input" v-model.number="newMeal.calories" placeholder="ккал" min="1">
    </div>
    <div class="modal-field">
      <label class="modal-label">Белки (г)</label><input type="number" class="modal-input" v-model.number="newMeal.protein" min="0" placeholder="0">
      <label class="modal-label">Жиры (г)</label><input type="number" class="modal-input" v-model.number="newMeal.fat" min="0" placeholder="0">
      <label class="modal-label">Углеводы (г)</label><input type="number" class="modal-input" v-model.number="newMeal.carbs" min="0" placeholder="0">
    </div>
    <div class="modal-buttons">
      <button class="modal-btn modal-btn-primary" @click="saveMeal">Добавить</button>
      <button class="modal-btn modal-btn-secondary" @click="closeMealModal">Отмена</button>
    </div>
  </Modal>

  <Modal :open="isExerciseModalOpen" @close="closeExerciseModal" title="Добавить упражнение">
    <div class="modal-field">
      <label class="modal-label">Название</label>
      <input type="text" class="modal-input" v-model="newExercise.name" placeholder="Например: Пилатес">
    </div>
    <div class="modal-field">
      <label class="modal-label">Длительность (мин)</label>
      <input type="number" class="modal-input" v-model.number="newExercise.duration" placeholder="мин" min="1">
    </div>
    <div class="modal-field">
      <label class="modal-label">Сожжено калорий</label>
      <input type="number" class="modal-input" v-model.number="newExercise.calories" placeholder="ккал" min="1">
    </div>
    <div class="modal-buttons">
      <button class="modal-btn modal-btn-primary" @click="saveExercise">Добавить</button>
      <button class="modal-btn modal-btn-secondary" @click="closeExerciseModal">Отмена</button>
    </div>
  </Modal>
</template>

<style scoped>
.app-container { padding: 18px 16px 100px; background-color: #F3F4F5; }
.header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
.logo { font-size: 68px; font-weight: 800; letter-spacing: -1px; background: linear-gradient(135deg, #252B39, #3A4455); background-clip: text; -webkit-background-clip: text; color: transparent; }
.profile-icon { background: #FFFFFF; width: 48px; height: 48px; border-radius: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.05); border: 1px solid #E0E4EA; transition: all .2s; color: #6798F5; font-size: 24px; }
.profile-icon:active { transform: scale(.95); }
.calendar-panel { margin-bottom: 28px; } .calendar-month { display:flex; align-items:center; justify-content:space-between; margin:0 8px 10px; color:#252B39; font-size:17px; font-weight:750; text-transform:capitalize; } .calendar-month button { border:0; border-radius:10px; background:#fff; color:#6798F5; width:36px; height:34px; font-size:26px; line-height:1; cursor:pointer; } .calendar-month label { position:relative; } .calendar-month input { position:absolute; inset:0; opacity:0; width:100%; cursor:pointer; } .week-row { display: flex; justify-content: space-between; background: #FFFFFF; border-radius: 28px; padding: 12px 8px; box-shadow: 0 2px 8px rgba(0,0,0,.03); border: 1px solid #E0E4EA; margin-bottom: 0; }
.day-cell { display: flex; flex-direction: column; align-items: center; flex: 1; cursor: pointer; }
.day-name { font-size: 13px; font-weight: 600; color: #6C7A8E; margin-bottom: 6px; }
.day-number { font-size: 18px; font-weight: 700; color: #252B39; background: #F0F2F5; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 30px; transition: all .2s; }
.day-cell.active .day-number { background: #F4C165; color: #252B39; box-shadow: 0 2px 8px rgba(244,193,101,.3); }
.day-cell.active .day-name { color: #F4C165; font-weight: 700; }
.weight-card { background: #FFFFFF; border-radius: 32px; padding: 24px; margin-bottom: 20px; border: 1px solid #E0E4EA; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03); }
.section-title { font-size: 22px; font-weight: 700; color: #252B39; margin-bottom: 16px; padding-left: 4px; }
.current-weight-blue { background: linear-gradient(135deg, #6798F5, #9ABAF8); border-radius: 28px; padding: 24px; color: white; margin-bottom: 20px; }
.weight-value-large { font-size: 64px; font-weight: 800; }
.weight-unit { font-size: 24px; font-weight: 500; color: #B3D0FF; }
.last-weigh { font-size: 14px; color: #D0E0FF; margin-top: 8px; }
.weight-stats { display: flex; gap: 24px; margin-top: 20px; }
.weight-stat-item { flex: 1; text-align: center; }
.weight-stat-label { font-size: 14px; color: #A0B4C8; margin-bottom: 4px; }
.weight-stat-value { font-size: 20px; font-weight: 700; color: #FFFFFF; }
.progress-lost { margin-top: 24px; }
.progress-row { display: flex; justify-content: space-between; font-size: 14px; color: #8A9BB0; margin-bottom: 8px; }
.progress-value { font-weight: 600; color: #6798F5; }
.progress-bar { background: #E0E4EA; height: 8px; border-radius: 10px; overflow: hidden; }
.progress-fill { background: #6798F5; height: 100%; }
.nutrition-card { background: #FFFFFF; border-radius: 32px; padding: 20px; margin-bottom: 28px; border: 1px solid #E0E4EA; box-shadow: 0 2px 8px rgba(0,0,0,.03); }
.nutrition-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.nutrition-title { font-size: 22px; font-weight: 700; color: #252B39; }
.add-btn { background: #EFF4FF; border: none; padding: 10px 16px; border-radius: 30px; font-size: 16px; font-weight: 600; color: #6798F5; cursor: pointer; transition: all .2s; }
.add-btn:active { transform: scale(.96); }
.macros-row { display: flex; gap: 20px; margin-bottom: 20px; }
.macro-item { flex: 1; text-align: center; }
.macro-value { font-size: 24px; font-weight: 800; color: #252B39; margin-bottom: 8px; }
.macro-label { font-size: 14px; color: #8A9BB0; }
.calories-row { display: flex; justify-content: space-between; align-items: center; }
.calories-left { display: flex; flex-direction: column; align-items: flex-start; margin-left: 8px; }
.calories-current { font-size: 32px; font-weight: 800; color: #252B39; }
.calories-target { font-size: 16px; color: #8A9BB0; margin-top: 4px; }
.yellow-ring { position: relative; }
.progress-value-ring { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 18px; font-weight: 700; color: #252B39; }
.meals-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
.meal-item { background: #F9FAFC; border-radius: 24px; padding: 12px; text-align: center; border: 1px solid #E0E4EA; }
.meal-name { font-size: 14px; font-weight: 600; color: #252B39; margin-bottom: 6px; }
.meal-percent { font-size: 12px; color: #8A9BB0; margin-bottom: 4px; }
.meal-calories { font-size: 14px; font-weight: 700; color: #6798F5; }
.activity-card { background: #FFFFFF; border-radius: 32px; padding: 20px; margin-bottom: 28px; border: 1px solid #E0E4EA; box-shadow: 0 2px 8px rgba(0,0,0,.03); }
.steps-row { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.steps-info { flex: 1; }
.steps-value { font-size: 28px; font-weight: 800; color: #252B39; }
.steps-details { font-size: 13px; color: #8A9BB0; }
.steps-ring { flex-shrink: 0; }
.progress-ring-small { position: relative; width: 70px; height: 70px; }
.progress-ring-svg-small { transform: rotate(-90deg); }
.progress-ring-bg-small { stroke: #E0E4EA; stroke-width: 6; fill: none; }
.progress-ring-fill-small { stroke: #6798F5; stroke-width: 6; fill: none; stroke-linecap: round; transition: stroke-dashoffset 0.3s ease; }
.progress-value-small { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 16px; font-weight: 800; color: #252B39; }
.exercises-header { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; margin-bottom: 16px; }
.exercises-title { font-size: 18px; font-weight: 700; color: #252B39; }
.add-btn { background: #EFF4FF; border: none; padding: 8px 16px; border-radius: 30px; font-size: 14px; font-weight: 600; color: #6798F5; cursor: pointer; }
.exercise-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #F0F2F5; }
.exercise-item:last-child { border-bottom: none; }
.exercise-name { font-size: 16px; font-weight: 500; color: #252B39; }
.exercise-duration { font-size: 12px; color: #8A9BB0; }
.exercise-calories { font-size: 16px; font-weight: 700; color: #6798F5; }
.activity-summary { display: flex; justify-content: space-between; margin-top: 20px; font-size: 16px; color: #252B39; }
.summary-value { font-weight: 700; color: #6798F5; }

/* Обновлённые элементы дневника */
.current-weight-blue{border-radius:14px;padding:20px;background:linear-gradient(135deg,#6798F5,#9ABAF8);box-shadow:0 8px 18px rgba(103,152,245,.16)}
.weight-topline,.weight-scale{display:flex;justify-content:space-between;align-items:center}
.weight-kicker{font-size:10px;font-weight:800;letter-spacing:1px;color:#EAF1FF}
.weight-status{font-size:12px;font-weight:700;color:#fff;background:rgba(255,255,255,.18);padding:6px 9px;border-radius:7px}
.weight-main{display:flex;align-items:baseline;gap:8px;margin:8px 0 2px}.weight-value-large{font-size:56px;line-height:1;font-weight:800}.weight-unit{font-size:17px;color:#EAF1FF}
.last-weigh{font-size:12px;color:#EAF1FF;margin-top:8px}.last-weigh i{margin-right:5px}
.weight-mini-track{height:6px;border-radius:6px;background:rgba(255,255,255,.28);margin-top:19px;overflow:hidden}.weight-mini-track span{display:block;width:60%;height:100%;border-radius:6px;background:#fff}
.weight-scale{font-size:11px;color:#EAF1FF;margin-top:7px}
.meal-radio-group{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:8px}
.meal-radio{position:relative;display:flex;align-items:center;gap:9px;padding:13px 11px;border:1px solid #E0E4EA;border-radius:10px;background:#F9FAFC;color:#5C6F87;font-size:13px;font-weight:650;cursor:pointer;transition:.18s}
.meal-radio input{position:absolute;opacity:0;pointer-events:none}.meal-radio>i:first-of-type{font-size:16px;color:#8A9BB0}
.meal-radio.selected{border-color:#6798F5;background:#EFF4FF;color:#252B39;box-shadow:inset 0 0 0 1px #6798F5}
.meal-radio.selected>i:first-of-type{color:#6798F5}.meal-radio .selected-check{margin-left:auto;color:#6798F5;font-size:14px}

</style>
