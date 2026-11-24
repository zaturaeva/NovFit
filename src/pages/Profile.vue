<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Modal from '../components/Modal.vue'
import { useRouter } from 'vue-router'
import { clearSession, getUser, api } from '../lib/api'

const router = useRouter()
const logout = () => { clearSession(); router.replace('/auth') }


const userData = ref({
  name: getUser()?.name || 'Пользователь',
  age: 17,
  gender: 'жен',
  weight: 55,
  bmi: 21.6,
  fat: 16.5,
  goal: 'снизить вес',
  activity: 'минимальная'
})
onMounted(async () => { try { const user = await api('/me'); userData.value.name = user.name } catch {} })

const updateCalculations = () => {
  const heightM = 1.6
  userData.value.bmi = Math.round((userData.value.weight / (heightM * heightM)) * 10) / 10
  if (userData.value.gender === 'жен') {
    userData.value.fat = Math.round((24 + (userData.value.weight - 55) * 0.3) * 10) / 10
  } else {
    userData.value.fat = Math.round((18 + (userData.value.weight - 70) * 0.2) * 10) / 10
  }
  userData.value.fat = Math.min(35, Math.max(10, userData.value.fat))
}

const norms = ref({ kcal: 1325, water: 1155, bju: '20/30/50' })

const isEditModalOpen = ref(false)
const isPaymentModalOpen = ref(false)
const activePreference = ref<'goal' | 'activity' | null>(null)
const selectedCardType = ref<'debit' | 'credit'>('debit')
const goalOptions = [
  { value: 'снизить вес', title: 'Снизить вес', detail: 'Постепенно уменьшать массу тела' },
  { value: 'поддержать вес', title: 'Поддерживать вес', detail: 'Сохранять текущую форму' },
  { value: 'набрать массу', title: 'Набрать массу', detail: 'Увеличивать массу и силу' }
]
const activityOptions = [
  { value: 'минимальная', title: 'Минимальная', detail: 'В основном сидячий образ жизни' },
  { value: 'низкая', title: 'Низкая', detail: 'Лёгкая активность 1–3 раза в неделю' },
  { value: 'средняя', title: 'Средняя', detail: 'Тренировки или активность 3–5 раз в неделю' },
  { value: 'высокая', title: 'Высокая', detail: 'Интенсивные нагрузки почти каждый день' }
]

const openEdit = () => { isEditModalOpen.value = true }
const closeEdit = () => { isEditModalOpen.value = false; updateCalculations() }
const openPayment = () => { isPaymentModalOpen.value = true }
const closePayment = () => { isPaymentModalOpen.value = false }
const openPreference = (preference: 'goal' | 'activity') => { activePreference.value = preference }
const closePreference = () => { activePreference.value = null }
</script>

<template>
  <div class="profile-page">
    <header class="profile-topbar"><div class="brand">NovFit</div><div class="profile-actions"><button class="edit-profile" @click="openEdit" aria-label="Редактировать профиль"><i class="fa-solid fa-pen"></i></button><button class="logout-button" type="button" @click="logout"><i class="fa-solid fa-arrow-right-from-bracket"></i><span>Выйти</span></button></div></header>

    <section class="identity-card">
      <div class="identity-head"><div class="avatar">{{ userData.name.charAt(0) }}</div><div><h1>{{ userData.name }}</h1><p>{{ userData.age }} лет · {{ userData.gender === 'жен' ? 'Женский' : 'Мужской' }}</p></div></div>
      <div class="metrics-row">
        <div class="metric"><strong>{{ userData.weight }}<small> кг</small></strong><span>Вес</span></div>
        <div class="metric"><strong>{{ userData.bmi }}</strong><span>ИМТ</span></div>
        <div class="metric"><strong>{{ userData.fat }}<small>%</small></strong><span>Жир</span></div>
      </div>
      <div class="profile-preferences">
        <button class="preference-row" type="button" @click="openPreference('goal')"><span class="preference-icon"><i class="fa-solid fa-bullseye"></i></span><span class="preference-label">Цель</span><strong>{{ userData.goal }}</strong><i class="fa-solid fa-chevron-right"></i></button>
        <button class="preference-row" type="button" @click="openPreference('activity')"><span class="preference-icon"><i class="fa-solid fa-person-walking"></i></span><span class="preference-label">Активность</span><strong>{{ userData.activity }}</strong><i class="fa-solid fa-chevron-right"></i></button>
      </div>
    </section>

    <section class="norms-card">
      <h2>Рекомендуемые нормы</h2>
      <div class="norms-grid">
        <div><strong>{{ norms.kcal }}</strong><span>ккал</span></div>
        <div><strong>{{ norms.water }} мл</strong><span>вода</span></div>
        <div><strong>{{ norms.bju }}</strong><span>БЖУ</span></div>
      </div>
    </section>

    <section class="offers-section">
      <div class="offers-heading"><div><span class="eyebrow">СПЕЦИАЛЬНЫЕ ПРЕДЛОЖЕНИЯ</span><h2>Акции</h2></div><i class="fa-solid fa-tag"></i></div>
      <article class="offer-card premium-offer">
        <div class="offer-icon"><i class="fa-solid fa-crown"></i></div>
        <div class="offer-copy"><span class="offer-label">NOVFIT PREMIUM</span><h3>Больше возможностей</h3><p>Привычки, расширенная библиотека статей и видео, дополнительные баллы.</p></div>
        <button class="offer-action" @click="openPayment">Оформить <i class="fa-solid fa-arrow-right"></i></button>
      </article>
      <article class="offer-card student-offer">
        <div class="offer-icon"><i class="fa-solid fa-graduation-cap"></i></div>
        <div class="offer-copy"><span class="offer-label">ДЛЯ СТУДЕНТОВ НОВГУ</span><h3>Специальная цена</h3><p>Студенческая скидка на NovFit.</p><strong class="student-price">500 ₽</strong></div>
        <button class="offer-action" @click="openPayment">Регистрация <i class="fa-solid fa-arrow-right"></i></button>
      </article>
    </section>
  </div>

  <Modal :open="isEditModalOpen" @close="closeEdit" title="Редактировать профиль">
    <div class="modal-field"><label class="modal-label">Имя</label><input type="text" class="modal-input" v-model="userData.name"></div>
    <div class="row-fields">
      <div class="modal-field"><label class="modal-label">Возраст</label><input type="number" class="modal-input" v-model.number="userData.age"></div>
      <div class="modal-field"><label class="modal-label">Пол</label><select class="modal-input" v-model="userData.gender"><option value="жен">Женский</option><option value="муж">Мужской</option></select></div>
    </div>
    <div class="row-fields">
      <div class="modal-field"><label class="modal-label">Вес (кг)</label><input type="number" step="0.1" class="modal-input" v-model.number="userData.weight"></div>
      <div class="modal-field"><label class="modal-label">Цель</label><select class="modal-input" v-model="userData.goal"><option value="снизить вес">снизить вес</option><option value="поддержать вес">поддержать вес</option><option value="набрать массу">набрать массу</option></select></div>
    </div>
    <div class="modal-field"><label class="modal-label">Активность</label><select class="modal-input" v-model="userData.activity"><option value="минимальная">минимальная</option><option value="низкая">низкая</option><option value="средняя">средняя</option><option value="высокая">высокая</option></select></div>
  </Modal>

  <Modal :open="activePreference !== null" @close="closePreference" :title="activePreference === 'goal' ? 'Выберите цель' : 'Уровень активности'">
    <div v-if="activePreference === 'goal'" class="choice-list">
      <button v-for="option in goalOptions" :key="option.value" type="button" class="choice-option" :class="{ selected: userData.goal === option.value }" @click="userData.goal = option.value; closePreference()">
        <span class="choice-radio"><i v-if="userData.goal === option.value" class="fa-solid fa-check"></i></span>
        <span class="choice-copy"><strong>{{ option.title }}</strong><small>{{ option.detail }}</small></span>
      </button>
    </div>
    <div v-else class="choice-list">
      <button v-for="option in activityOptions" :key="option.value" type="button" class="choice-option" :class="{ selected: userData.activity === option.value }" @click="userData.activity = option.value; closePreference()">
        <span class="choice-radio"><i v-if="userData.activity === option.value" class="fa-solid fa-check"></i></span>
        <span class="choice-copy"><strong>{{ option.title }}</strong><small>{{ option.detail }}</small></span>
      </button>
    </div>
    <button class="modal-btn modal-btn-secondary preference-cancel" type="button" @click="closePreference">Отмена</button>
  </Modal>

  <Modal :open="isPaymentModalOpen" @close="closePayment" title="Оформление предложения">
    <p class="payment-intro">Выберите тип карты для продолжения</p>
    <div class="card-type-options" role="radiogroup" aria-label="Тип карты">
      <label class="card-type-option" :class="{ selected: selectedCardType === 'debit' }">
        <input v-model="selectedCardType" type="radio" value="debit" name="cardType">
        <span class="card-type-icon"><i class="fa-solid fa-credit-card"></i></span>
        <span class="card-type-copy"><strong>Дебетовая</strong><small>Оплата собственными средствами</small></span>
        <span class="choice-radio"><i v-if="selectedCardType === 'debit'" class="fa-solid fa-check"></i></span>
      </label>
      <label class="card-type-option" :class="{ selected: selectedCardType === 'credit' }">
        <input v-model="selectedCardType" type="radio" value="credit" name="cardType">
        <span class="card-type-icon"><i class="fa-solid fa-wallet"></i></span>
        <span class="card-type-copy"><strong>Кредитная</strong><small>Оплата кредитными средствами</small></span>
        <span class="choice-radio"><i v-if="selectedCardType === 'credit'" class="fa-solid fa-check"></i></span>
      </label>
    </div>
    <div class="payment-note"><i class="fa-solid fa-lock"></i><span>Данные карты пока не запрашиваются. Выбор типа карты сохранится в этом окне.</span></div>
    <div class="modal-buttons"><button class="modal-btn modal-btn-primary" type="button" @click="closePayment">Продолжить</button><button class="modal-btn modal-btn-secondary" type="button" @click="closePayment">Отмена</button></div>
  </Modal>
</template>

<style>
/* Глобальные стили для модальных окон */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-content { background: white; border-radius: 32px; padding: 24px; max-width: 340px; width: 90%; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2); }
.modal-title { font-size: 22px; font-weight: 700; margin-bottom: 20px; color: #252B39; text-align: center; }
.modal-field { margin-bottom: 16px; }
.modal-label { font-size: 14px; font-weight: 600; color: #5C6F87; margin-bottom: 6px; display: block; }
.modal-input { width: 100%; padding: 12px; border: 1px solid #E0E4EA; border-radius: 24px; font-size: 15px; font-family: inherit; background: #F9FAFC; }
.modal-input:focus { outline: none; border-color: #6798F5; }
.row-fields { display: flex; gap: 12px; }
.row-fields .modal-field { flex: 1; }
.modal-buttons { display: flex; gap: 12px; margin-top: 24px; }
.modal-btn { flex: 1; padding: 12px; border: none; border-radius: 30px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.modal-btn-primary { background: #6798F5; color: white; }
.modal-btn-secondary { background: #F0F2F5; color: #7A8C9E; }

.payment-card { background: #F9FAFC; border-radius: 24px; padding: 20px; margin-bottom: 20px; }
.card-type { font-size: 16px; font-weight: 700; color: #252B39; margin-bottom: 16px; display: flex; gap: 16px; }
.card-type span { padding: 4px 12px; border-radius: 20px; background: #EFF4FF; color: #6798F5; }
.card-number { font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #252B39; margin-bottom: 16px; }
.payment-row { display: flex; gap: 16px; margin-bottom: 16px; }
.payment-field { flex: 1; }
.payment-label { font-size: 12px; color: #8A9BB0; margin-bottom: 4px; }
.payment-value { font-size: 16px; font-weight: 600; color: #252B39; }
.add-card-btn { width: 100%; background: #6798F5; border: none; padding: 14px; border-radius: 30px; font-size: 16px; font-weight: 700; color: white; cursor: pointer; margin-top: 8px; }

.profile-page{max-width:480px;margin:auto;padding:18px 16px 100px;color:#252B39}
.profile-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
.brand{font-size:48px;font-weight:800;letter-spacing:-2px;background:linear-gradient(135deg,#252B39,#3A4455);background-clip:text;-webkit-background-clip:text;color:transparent}
.edit-profile{width:42px;height:42px;border:1px solid #E0E4EA;border-radius:10px;background:#fff;color:#6798F5}
.identity-card,.norms-card,.offers-section{background:#fff;border:1px solid #E0E4EA;border-radius:14px;padding:18px;margin-bottom:16px;box-shadow:0 3px 12px rgba(37,43,57,.035)}
.identity-head{display:flex;align-items:center;gap:12px}.avatar{width:54px;height:54px;border-radius:12px;background:linear-gradient(135deg,#6798F5,#9ABAF8);display:grid;place-items:center;color:#fff;font-size:23px;font-weight:800}
.identity-head h1{font-size:19px;margin:0 0 4px}.identity-head p{font-size:12px;color:#8A9BB0;margin:0}
.metrics-row{display:grid;grid-template-columns:repeat(3,1fr);margin:19px 0 15px;padding:15px 0;border-top:1px solid #F0F2F5;border-bottom:1px solid #F0F2F5}
.metric{display:flex;flex-direction:column;gap:5px;text-align:center;border-right:1px solid #F0F2F5}.metric:last-child{border:0}.metric strong{font-size:22px;color:#252B39}.metric strong small{font-size:12px}.metric span{font-size:11px;color:#8A9BB0}
.profile-preferences{display:grid;gap:8px}.preference-row{display:flex;align-items:center;gap:10px;background:#F8FAFD;padding:11px;border-radius:9px}.preference-icon{width:30px;height:30px;border-radius:8px;background:#EFF4FF;color:#6798F5;display:grid;place-items:center}.preference-label{font-size:12px;color:#8A9BB0;min-width:68px}.preference-row strong{font-size:13px;font-weight:650;flex:1}.preference-row>i{font-size:10px;color:#AAB5C3}
.norms-card h2,.offers-heading h2{font-size:18px;margin:0 0 15px}.norms-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.norms-grid>div{display:flex;flex-direction:column;gap:5px;text-align:center;padding:12px 5px;background:#F8FAFD;border-radius:9px}.norms-grid strong{font-size:17px;color:#252B39}.norms-grid span{font-size:11px;color:#8A9BB0}
.offers-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.offers-heading h2{margin:3px 0 0}.offers-heading>i{width:36px;height:36px;display:grid;place-items:center;background:#EFF4FF;color:#6798F5;border-radius:9px}.eyebrow,.offer-label{font-size:9px;letter-spacing:1px;font-weight:800;color:#8A9BB0}
.offer-card{display:grid;grid-template-columns:40px 1fr;gap:12px;padding:14px;border:1px solid #E0E4EA;border-radius:11px;margin-top:10px;background:#F9FAFC}
.offer-icon{width:38px;height:38px;border-radius:9px;background:#FCE6A4;color:#C97E00;display:grid;place-items:center;font-size:16px}.student-offer .offer-icon{background:#EFF4FF;color:#6798F5}
.offer-copy h3{font-size:15px;margin:5px 0;color:#252B39}.offer-copy p{font-size:12px;line-height:1.45;color:#8A9BB0;margin:0 0 8px}.student-price{font-size:17px;color:#6798F5}
.offer-action{grid-column:2;border:0;border-radius:8px;background:#6798F5;color:#fff;font-size:12px;font-weight:700;padding:10px 12px;text-align:left;justify-self:start}.offer-action i{margin-left:8px}

/* Выбор цели и активности */
.preference-row{width:100%;border:0;text-align:left;font:inherit;cursor:pointer;color:inherit;transition:background .18s,transform .18s}
.preference-row:hover{background:#EFF4FF}.preference-row:active{transform:scale(.99)}
.choice-list{display:grid;gap:10px}
.choice-option{display:flex;align-items:center;gap:12px;width:100%;padding:13px;border:1px solid #E0E4EA;border-radius:12px;background:#F9FAFC;text-align:left;cursor:pointer;color:#252B39;transition:border-color .18s,background .18s}
.choice-option.selected{border-color:#6798F5;background:#EFF4FF}
.choice-radio{width:21px;height:21px;flex:0 0 21px;border:1.5px solid #B8C5D6;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:10px}
.choice-option.selected .choice-radio,.card-type-option.selected .choice-radio{background:#6798F5;border-color:#6798F5}
.choice-copy,.card-type-copy{display:grid;gap:4px;min-width:0}
.choice-copy strong,.card-type-copy strong{font-size:14px;font-weight:700}
.choice-copy small,.card-type-copy small{font-size:11px;line-height:1.35;color:#8A9BB0}
.preference-cancel{width:100%;margin-top:14px}
.payment-intro{font-size:13px;color:#8A9BB0;line-height:1.45;margin:-6px 0 15px;text-align:center}
.card-type-options{display:grid;gap:10px}
.card-type-option{position:relative;display:flex;align-items:center;gap:11px;padding:14px;border:1px solid #E0E4EA;border-radius:12px;background:#F9FAFC;cursor:pointer;transition:border-color .18s,background .18s}
.card-type-option.selected{border-color:#6798F5;background:#EFF4FF}
.card-type-option input{position:absolute;opacity:0;pointer-events:none}
.card-type-icon{width:38px;height:38px;flex:0 0 38px;display:grid;place-items:center;border-radius:10px;background:#fff;color:#6798F5;font-size:16px}
.card-type-copy{flex:1}
.payment-note{display:flex;align-items:flex-start;gap:8px;margin-top:14px;padding:11px;border-radius:9px;background:#F3F6FA;color:#8A9BB0;font-size:11px;line-height:1.4}
.payment-note i{color:#6798F5;margin-top:1px}
.modal-buttons{margin-top:18px}
@media(max-width:380px){.row-fields{gap:8px}.modal-content{padding:18px}}
</style>

<style>
.profile-actions{display:flex;align-items:center;gap:8px}.logout-button{display:flex;align-items:center;gap:7px;padding:10px 12px;border:1px solid #E0E4EA;border-radius:10px;background:#fff;color:#5C6F87;font-size:12px;font-weight:700}.logout-button:hover{background:#EFF4FF;color:#6798F5}
</style>
