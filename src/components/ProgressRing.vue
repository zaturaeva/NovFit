<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  value: { type: Number, required: true },
  goal: { type: Number, required: true },
  size: { type: Number, default: 100 },
  stroke: { type: Number, default: 8 },
  color: { type: String, default: 'blue' }, // 'blue', 'calories', или HEX
  valueFontSize: { type: String, default: '' }
})

const radius = computed(() => props.size / 2 - props.stroke / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const percent = computed(() => Math.min(1, props.value / props.goal))
const dashOffset = computed(() => circumference.value * (1 - percent.value))

// Цвета для стандартных состояний
const strokeColor = computed(() => {
  if (props.color === 'blue') return '#6798F5'
  if (props.color === 'calories') return '#6798F5'
  if (props.color === 'steps') return '#6798F5'
  return props.color
})
</script>

<template>
  <div class="progress-ring-container" :style="{ width: size + 'px', height: size + 'px' }">
    <svg width="100%" height="100%" viewBox="0 0 120 120" class="progress-ring-svg">
      <circle cx="60" cy="60" :r="radius" class="progress-ring-bg" :stroke-width="stroke" fill="none" stroke="#E0E4EA" />
      <circle 
        cx="60" cy="60" :r="radius" 
        :class="['progress-ring-fill', color]" 
        :stroke-width="stroke" 
        fill="none" 
        stroke-linecap="round" 
        :stroke-dasharray="circumference" 
        :stroke-dashoffset="dashOffset" 
        :stroke="strokeColor" 
      />
    </svg>
    <div class="progress-value" :style="valueFontSize ? { fontSize: valueFontSize } : {}">
      <slot>
        {{ Math.round(percent * 100) }}%
      </slot>
    </div>
  </div>
</template>

<style scoped>
.progress-ring-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}
.progress-ring-svg {
  transform: rotate(-90deg);
  display: block;
  overflow: visible;
}
.progress-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  text-align: center;
  white-space: nowrap;
  line-height: 1;
  font-size: clamp(14px, 4vw, 20px);
  font-weight: 800;
  color: #252B39;
  pointer-events: none;
}
.progress-ring-fill.blue { stroke: #6798F5; }
.progress-ring-fill.calories { stroke: #6798F5; }
.progress-ring-fill.steps { stroke: #6798F5; }
</style>