<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../lib/api'
import ProgressRing from '../components/ProgressRing.vue'
import Modal from '../components/Modal.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Задачи пользователя: каждая выполненная задача приносит ровно 1 балл.
interface Task { id:number; points:number; text:string }
const tasks = ref<Task[]>([])
const isTaskModalOpen = ref(false)
const newTask = ref({ text: '' })
onMounted(async()=>{try{tasks.value=await api<Task[]>('/tasks')}catch(e){console.error('Не удалось загрузить задачи',e)}})
const toggleTask = async (taskId:number) => {
  try { await api(`/tasks/${taskId}/complete`,{method:'POST'}); tasks.value=tasks.value.filter(item=>item.id!==taskId) }
  catch(e:any){console.error(e);alert(e.message||'Не удалось выполнить задачу')}
}
const openTaskModal = () => { newTask.value={text:''}; isTaskModalOpen.value=true }
const closeTaskModal = () => { isTaskModalOpen.value=false }
const addTask = async () => {
  const text=newTask.value.text.trim(); if(!text)return
  try { const task=await api<Task>('/tasks',{method:'POST',body:JSON.stringify({text})}); tasks.value.push(task); closeTaskModal() }
  catch(e:any){alert(e.message||'Не удалось добавить задачу')}
}
const removeTask = async (taskId:number) => {
  try { await api(`/tasks/${taskId}`,{method:'DELETE'}); tasks.value=tasks.value.filter(task=>task.id!==taskId) }
  catch(e:any){alert(e.message||'Не удалось удалить задачу')}
}

// Stats
const steps = ref(5700)
const stepsGoal = ref(10000)
const waterLiters = ref(1.0)
const waterGoal = ref(2.0)
const sleepHours = ref(8.5)
const sleepGoal = ref(10.0)
const calories = ref(1000)
const caloriesGoal = ref(1500)

// Progress ring logic
</script>

<template>
  <div class="app-container">
    <div class="header">
      <div class="logo">NovFit</div>
      <div class="profile-icon" @click="router.push('/profile')">...</div>
    </div>

    <div class="tasks-wrapper">
      <div class="section-title">Задачи дня</div>
      <div class="tasks-section">
        <div class="tasks-toolbar">
          <span class="tasks-hint">Отмечай выполненные задачи и получай баллы</span>
          <button class="task-add-button" type="button" @click="openTaskModal"><i class="fa-solid fa-plus"></i> Добавить</button>
        </div>
        <div class="tasks-list">
          <div
            v-for="task in tasks"
            :key="task.id"
            :class="['task-item', 'pending']"
            @click="toggleTask(task.id)"
            role="button"
            tabindex="0"
            @keydown.enter="toggleTask(task.id)"
            @keydown.space.prevent="toggleTask(task.id)"
          >
            <div class="task-checkbox"><i class="fa-regular fa-circle"></i></div>
            <div class="task-text">{{ task.text }}</div>
            <div class="task-points">+ 1 балл</div>
            <button class="task-delete" type="button" aria-label="Удалить задачу" @click.stop="removeTask(task.id)"><i class="fa-regular fa-trash-can"></i></button>
          </div>
          <div v-if="tasks.length === 0" class="tasks-empty">Пока нет задач. Добавь первую!</div>
        </div>
      </div>
    </div>

    <div class="average-title">Средние показатели</div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">Шаги</div>
        <div class="steps-content">
          <div class="steps-stats">
            <div class="steps-number">{{ steps }}</div>
            <div class="steps-details">156 / 180 ккал • 3,46 км</div>
          </div>
          <div class="steps-ring">
            <ProgressRing 
              :value="steps" 
              :goal="stepsGoal" 
              color="blue" 
            />
          </div>
        </div>
      </div>

      <div class="two-columns">
        <div class="stat-card">
          <div class="stat-title">вода</div>
          <div class="circular-progress">
            <ProgressRing 
              :value="waterLiters" 
              :goal="waterGoal" 
              color="#9ABAF8" 
            />
          </div>
          <div class="stat-goal">/ {{ waterGoal.toFixed(1) }} л</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">СОН</div>
          <div class="circular-progress">
            <ProgressRing 
              :value="sleepHours" 
              :goal="sleepGoal" 
              color="#FBEACC" 
            />
          </div>
          <div class="stat-goal">/ {{ sleepGoal.toFixed(1) }} ч</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-title">Питание</div>
        <div class="nutrition-content">
          <div class="macros-list">
            <div class="macro-item"><span class="macro-label">белки</span><span class="macro-value">77.53г</span></div>
            <div class="macro-item"><span class="macro-label">жиры</span><span class="macro-value">68.91г</span></div>
            <div class="macro-item"><span class="macro-label">углеводы</span><span class="macro-value">284.29г</span></div>
          </div>
          <div class="calories-circle">
            <ProgressRing 
              :value="calories" 
              :goal="caloriesGoal" 
              :size="90" 
              :stroke="6" 
              color="blue" 
            />
            <div class="calories-text">{{ calories }} / {{ caloriesGoal }} ккал</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Modal :open="isTaskModalOpen" @close="closeTaskModal" title="Добавить задачу">
    <div class="modal-field">
      <label class="modal-label" for="progress-task-name">Название задачи</label>
      <input id="progress-task-name" v-model="newTask.text" class="modal-input" type="text" placeholder="Например: Прогулка 30 минут" @keydown.enter="addTask">
    </div>
    <div class="modal-field">
    </div>
    <div class="modal-buttons">
      <button class="modal-btn modal-btn-primary" type="button" @click="addTask">Добавить</button>
      <button class="modal-btn modal-btn-secondary" type="button" @click="closeTaskModal">Отмена</button>
    </div>
  </Modal>
</template>

<style scoped>
/* (Стили из оригинального progress.html, адаптированные под scoped) */
.app-container { padding: 18px 16px 100px; background-color: #F3F4F5; }
.header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
.logo { font-size: 68px; font-weight: 800; letter-spacing: -1px; background: linear-gradient(135deg, #252B39, #3A4455); background-clip: text; -webkit-background-clip: text; color: transparent; }
.profile-icon { background: #FFFFFF; width: 48px; height: 48px; border-radius: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.05); border: 1px solid #E0E4EA; transition: all .2s; color: #6798F5; font-size: 24px; }
.profile-icon:active { transform: scale(.95); }
.tasks-wrapper { margin-bottom: 24px; }
.section-title { font-size: 22px; font-weight: 700; color: #252B39; margin-bottom: 16px; padding-left: 4px; }
.tasks-section { background: #FFFFFF; border-radius: 14px; padding: 14px; border: 1px solid #E0E4EA; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03); }
.tasks-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.tasks-hint { color: #8A9BB0; font-size: 12px; line-height: 1.35; }
.task-add-button { display: inline-flex; align-items: center; gap: 7px; flex: 0 0 auto; border: 0; border-radius: 9px; padding: 9px 11px; background: #EFF4FF; color: #6798F5; font-size: 12px; font-weight: 700; }
.tasks-list { display: flex; flex-direction: column; gap: 12px; }
.task-item { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto 28px; align-items: center; gap: 10px; min-width: 0; padding: 13px 12px; border: 0; border-radius: 10px; transition: background .2s, transform .2s; cursor: pointer; }
.task-item.completed { background: #FFF9E6; }
.task-item.pending { background: #EFF4FF; }
.task-item:active { transform: scale(0.98); }
.task-checkbox { width: 28px; height: 28px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; flex-shrink: 0; transition: all 0.2s; }
.task-item.completed .task-checkbox { background: #F4C165; color: white; }
.task-item.pending .task-checkbox { background: #FFFFFF; border: 2px solid #6798F5; color: #6798F5; }
.task-delete { width: 28px; height: 28px; display: grid; place-items: center; border: 0; border-radius: 8px; background: transparent; color: #A0AABC; font-size: 14px; cursor: pointer; }
.task-delete:hover { background: #FDECEC; color: #E05A5A; }
.tasks-empty { padding: 18px 8px; color: #8A9BB0; text-align: center; font-size: 13px; }
.task-text { min-width: 0; font-size: 14px; line-height: 1.35; font-weight: 600; color: #252B39; overflow-wrap: anywhere; }
.task-points { display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; flex-shrink: 0; font-size: 12px; line-height: 1.2; font-weight: 700; padding: 7px 9px; border-radius: 7px; }
.task-item.completed .task-points { background: #FCE6A4; color: #C97E00; }
.task-item.pending .task-points { background: #E0ECFE; color: #6798F5; }
.average-title { font-size: 22px; font-weight: 700; color: #252B39; margin-bottom: 16px; margin-top: 8px; padding-left: 4px; }
.stats-grid { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
.stat-card { background: #FFFFFF; border-radius: 32px; padding: 20px; border: 1px solid #E0E4EA; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03); }
.stat-title { font-size: 20px; font-weight: 700; color: #252B39; margin-bottom: 16px; }
.steps-content { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
.steps-stats { flex: 1; }
.steps-number { font-size: 44px; font-weight: 800; color: #252B39; }
.steps-details { margin-top: 12px; display: flex; gap: 16px; font-size: 13px; color: #8A9BB0; }
.steps-ring { flex-shrink: 0; }
.progress-ring-container { position: relative; width: 100px; height: 100px; }
.progress-ring-svg { transform: rotate(-90deg); }
.progress-ring-bg { stroke: #E0E4EA; stroke-width: 8; fill: none; }
.progress-ring-fill { stroke-width: 8; fill: none; stroke-linecap: round; transition: stroke-dashoffset 0.3s ease; }
.progress-ring-fill.blue { stroke: #6798F5; }
.progress-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 20px; font-weight: 800; color: #252B39; }
.two-columns { display: flex; gap: 16px; flex-wrap: wrap; }
.two-columns .stat-card { flex: 1; min-width: 140px; }
.circular-progress { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 8px; }
.stat-goal { font-size: 14px; color: #8A9BB0; }
.nutrition-content { display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; align-items: center; }
.macros-list { flex: 1; display: flex; flex-direction: column; gap: 12px; }
.macro-item { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 0; border-bottom: 1px solid #F0F2F5; }
.macro-label { font-size: 14px; font-weight: 500; color: #8A9BB0; }
.macro-value { font-size: 15px; font-weight: 700; color: #6798F5; }
.calories-circle { flex-shrink: 0; text-align: center; }
.calories-text { margin-top: 8px; font-size: 14px; font-weight: 600; color: #252B39; }

.tasks-section,.stat-card{border-radius:14px}
.task-item{border-radius:10px;padding:12px 10px}
.task-checkbox{border-radius:8px;font-size:13px}
.task-points{border-radius:7px}
@media (max-width: 380px) {
  .task-item { grid-template-columns: 26px minmax(0, 1fr) auto 24px; gap: 7px; padding: 11px 9px; }
  .task-text { font-size: 13px; }
  .task-points { font-size: 11px; padding: 6px 7px; }
  .tasks-hint { max-width: 155px; }
}
@media (max-width: 330px) {
  .task-item { grid-template-columns: 26px minmax(0, 1fr) 24px; }
  .task-points { grid-column: 2; justify-self: start; }
  .task-delete { grid-column: 3; grid-row: 1 / span 2; }
}
:deep(.progress-ring-container) { flex: 0 0 auto; }
:deep(.progress-value) { max-width: 82px; white-space: nowrap; font-size: clamp(15px, 4vw, 20px); text-align: center; }
</style>
