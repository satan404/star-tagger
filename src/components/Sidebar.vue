<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Trash2, Upload, MapPin, Sparkles, Loader2, Key, ExternalLink } from 'lucide-vue-next'

const props = defineProps(['galaxies', 'selectedId', 'isScanning', 'scanStatus'])
const emit = defineEmits(['add', 'remove', 'select', 'upload', 'scan', 'updateApiKey'])

const newName = ref('')
const apiKey = ref('')
const fileInput = ref(null)

onMounted(() => {
  apiKey.value = localStorage.getItem('astrometry_api_key') || ''
  if (apiKey.value) emit('updateApiKey', apiKey.value)
})

const handleApiKeyUpdate = () => {
  localStorage.setItem('astrometry_api_key', apiKey.value)
  emit('updateApiKey', apiKey.value)
}

const handleAdd = () => {
  if (newName.value.trim()) {
    emit('add', newName.value.trim())
    newName.value = ''
  }
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    emit('upload', file)
  }
}
</script>

<template>
  <div class="sidebar-content">
    <div class="section">
      <h3 class="section-title">
        <Upload :size="18" /> 圖片操作
      </h3>
      <button @click="fileInput.click()" class="upload-btn">
        <Upload :size="16" /> 更換星空照片
      </button>
      <input 
        type="file" 
        ref="fileInput" 
        style="display: none" 
        accept="image/*" 
        @change="handleFileChange"
      />
    </div>

    <div class="section">
      <h3 class="section-title">
        <Key :size="18" /> API 設定
      </h3>
      <div class="api-key-group">
        <input 
          type="password" 
          v-model="apiKey" 
          placeholder="Astrometry.net API Key" 
          @change="handleApiKeyUpdate"
        />
        <a 
          href="https://nova.astrometry.net/api_help" 
          target="_blank" 
          class="api-link"
        >
          <ExternalLink :size="12" /> 申請 API Key
        </a>
      </div>
      <p class="api-hint">辨識星系名稱需要 API Key</p>
    </div>

    <div class="section">
      <h3 class="section-title">
        <Sparkles :size="18" /> AI 輔助
      </h3>
      <button 
        @click="emit('scan')" 
        class="ai-btn" 
        :disabled="isScanning"
      >
        <template v-if="isScanning">
          <Loader2 :size="16" class="spin" /> 辨識中...
        </template>
        <template v-else>
          <Sparkles :size="16" /> 真實星系辨識
        </template>
      </button>
      <div v-if="isScanning && scanStatus" class="scan-status-info">
        {{ scanStatus }}
      </div>
    </div>

    <div class="section">
      <h3 class="section-title">
        <Plus :size="18" /> 新增星系
      </h3>
      <div class="input-group">
        <input 
          type="text" 
          v-model="newName" 
          placeholder="輸入星系名稱..." 
          @keyup.enter="handleAdd"
        />
        <button @click="handleAdd" class="add-btn">
          <Plus :size="20" />
        </button>
      </div>
    </div>

    <div class="section galaxy-list-section">
      <h3 class="section-title">
        <MapPin :size="18" /> 已列出的星系 ({{ galaxies.length }})
      </h3>
      <div class="galaxy-list">
        <div 
          v-for="galaxy in galaxies" 
          :key="galaxy.id"
          class="galaxy-item"
          :class="{ active: selectedId === galaxy.id, placed: galaxy.isPlaced }"
          @click="emit('select', galaxy.id)"
        >
          <div class="galaxy-info">
            <span class="status-dot"></span>
            <span class="galaxy-name">{{ galaxy.name }}</span>
          </div>
          <button @click.stop="emit('remove', galaxy.id)" class="delete-btn">
            <Trash2 :size="14" />
          </button>
        </div>
        <div v-if="galaxies.length === 0" class="empty-state">
          目前尚未新增星系
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.section {
  margin-bottom: 2rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.upload-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #2a2a4a;
  margin-bottom: 0.5rem;
}

.ai-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  font-weight: 600;
}

.ai-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.api-key-group input {
  font-size: 0.8rem;
  padding: 0.5rem;
  margin-bottom: 0.25rem;
}

.api-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #646cff;
  text-decoration: none;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.api-link:hover {
  text-decoration: underline;
}

.api-hint {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.scan-status-info {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #a855f7;
  text-align: center;
  font-style: italic;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.input-group input {
  margin-bottom: 0;
}

.add-btn {
  padding: 0 1rem;
  background: #646cff;
}

.galaxy-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.galaxy-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.galaxy-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.galaxy-item.active {
  background: rgba(100, 108, 255, 0.15);
  border-color: rgba(100, 108, 255, 0.5);
}

.galaxy-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.placed .status-dot {
  background: #4ade80;
  box-shadow: 0 0 8px #4ade80;
}

.galaxy-name {
  font-size: 0.95rem;
}

.delete-btn {
  padding: 0.25rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.3);
}

.delete-btn:hover {
  color: #ff4d4d;
  background: rgba(255, 77, 77, 0.1);
}

.empty-state {
  text-align: center;
  padding: 2rem 0;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.9rem;
  font-style: italic;
}
</style>
