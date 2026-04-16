<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps(['imageSrc', 'galaxies', 'selectedId'])
const emit = defineEmits(['place'])

const container = ref(null)
const imageEl = ref(null)
const imageSize = ref({ w: 0, h: 0 })

const updateImageSize = () => {
  if (imageEl.value) {
    imageSize.value = {
      w: imageEl.value.clientWidth,
      h: imageEl.value.clientHeight
    }
  }
}

onMounted(() => {
  window.addEventListener('resize', updateImageSize)
})

const handleImageLoad = () => {
  updateImageSize()
}

const handleClick = (e) => {
  if (!props.selectedId) return

  const rect = imageEl.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height

  emit('place', { x, y })
}

// Logic for calculating leader line paths
// For simplicity, the label will be placed at a fixed offset from the point
// unless we implement dragging.
const getLabelPos = (g) => {
  const x = g.x * imageSize.value.w
  const y = g.y * imageSize.value.h
  // Default offset: 40px right, 40px up
  return { x: x + 60, y: y - 40 }
}
</script>

<template>
  <div class="canvas-container" ref="container">
    <div class="image-wrapper" @click="handleClick">
      <img 
        :src="imageSrc" 
        ref="imageEl" 
        @load="handleImageLoad" 
        class="star-image"
      />
      
      <!-- SVG Overlay for labels and lines -->
      <svg 
        v-if="imageSize.w > 0"
        class="overlay-svg"
        :style="{ width: imageSize.w + 'px', height: imageSize.h + 'px' }"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g v-for="g in galaxies" :key="g.id">
          <template v-if="g.isPlaced">
            <!-- Target point -->
            <circle 
              :cx="g.x * imageSize.w" 
              :cy="g.y * imageSize.h" 
              r="4" 
              fill="#646cff" 
              filter="url(#glow)"
            />
            <circle 
              :cx="g.x * imageSize.w" 
              :cy="g.y * imageSize.h" 
              r="8" 
              fill="none" 
              stroke="#646cff" 
              stroke-width="1"
              stroke-dasharray="2 2"
              :class="{ 'selected-target': selectedId === g.id }"
            />

            <!-- Leader Line -->
            <path 
              :d="`M ${g.x * imageSize.w} ${g.y * imageSize.h} 
                   L ${g.x * imageSize.w + 20} ${g.y * imageSize.h - 20}
                   L ${g.x * imageSize.w + 60} ${g.y * imageSize.h - 20}`"
              fill="none"
              stroke="white"
              stroke-width="1.5"
              opacity="0.8"
            />

            <!-- Label -->
            <text 
              :x="g.x * imageSize.w + 65" 
              :y="g.y * imageSize.h - 20"
              fill="white"
              stroke="black"
              stroke-width="3"
              paint-order="stroke"
              dominant-baseline="middle"
              class="galaxy-label"
              :class="{ 'selected-label': selectedId === g.id }"
            >
              {{ g.name }}
            </text>
          </template>
        </g>
      </svg>

      <!-- Selection Cursor Indicator -->
      <div 
        v-if="selectedId && galaxies.find(g => g.id === selectedId)"
        class="placement-hint"
      >
        請在圖片上點擊以標記「{{ galaxies.find(g => g.id === selectedId).name }}」
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.image-wrapper {
  position: relative;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  cursor: crosshair;
}

.star-image {
  display: block;
  max-width: 90vw;
  max-height: 80vh;
  user-select: none;
}

.overlay-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.galaxy-label {
  font-size: 14px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  transition: all 0.2s;
}

.selected-label {
  fill: #646cff;
  font-weight: 700;
  font-size: 16px;
}

.selected-target {
  stroke-width: 2;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { r: 8; opacity: 1; }
  100% { r: 20; opacity: 0; }
}

.placement-hint {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(100, 108, 255, 0.9);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  white-space: nowrap;
  pointer-events: none;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translate(-50%, 0); }
  50% { transform: translate(-50%, -5px); }
}
</style>
