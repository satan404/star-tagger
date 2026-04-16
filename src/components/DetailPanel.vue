<script setup>
import { ref, computed, watch } from 'vue'
import { Info, Map, Rocket, Maximize, Target, X, ExternalLink, Globe, Loader2 } from 'lucide-vue-next'
import { getObjectInfo } from '../data/astronomyDB'

const props = defineProps(['galaxy'])
const emit = defineEmits(['close'])

const wikiData = ref(null)
const isFetching = ref(false)

const info = computed(() => {
  if (!props.galaxy) return null
  return getObjectInfo(props.galaxy.name)
})

const fetchWikiData = async (name) => {
  if (!name) return
  isFetching.value = true
  wikiData.value = null
  
  // 移除括號內容（例如 "M31 (NGC 224)" -> "M31"）
  const cleanName = name.split('(')[0].trim()
  
  try {
    // [第一階段] 搜尋條目名稱
    let searchRes = await fetch(`https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanName)}&format=json&origin=*`)
    let searchData = await searchRes.json()
    
    let targetTitle = null
    let lang = 'zh'
    
    if (searchData.query?.search?.length > 0) {
      targetTitle = searchData.query.search[0].title
    } else {
      // 如果中文搜尋不到，嘗試英文
      searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanName)}&format=json&origin=*`)
      searchData = await searchRes.json()
      if (searchData.query?.search?.length > 0) {
        targetTitle = searchData.query.search[0].title
        lang = 'en'
      }
    }
    
    // [第二階段] 抓取條目摘要與縮圖
    if (targetTitle) {
      const summaryRes = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(targetTitle)}?origin=*`)
      const summaryData = await summaryRes.json()
      if (summaryData.extract) {
        wikiData.value = summaryData
      }
    }
  } catch (err) {
    console.error('Wiki fetch error:', err)
  } finally {
    isFetching.value = false
  }
}

watch(() => props.galaxy?.name, (newName) => {
  if (newName) fetchWikiData(newName)
}, { immediate: true })
</script>

<template>
  <Transition name="slide">
    <div v-if="galaxy" class="detail-panel">
      <div class="panel-header">
        <h2 class="panel-title">天體詳情</h2>
        <button @click="emit('close')" class="close-btn">
          <X :size="20" />
        </button>
      </div>

      <div class="panel-body">
        <!-- 維基百科縮圖 -->
        <div v-if="wikiData?.thumbnail" class="wiki-thumbnail">
          <img :src="wikiData.thumbnail.original" :alt="galaxy.name" />
          <div class="image-source">Source: Wikipedia</div>
        </div>

        <div class="info-card main-info">
          <h1 class="object-name">{{ info?.name || galaxy.name }}</h1>
          <p v-if="info" class="object-type">
            <Target :size="14" /> {{ info.type }}
          </p>
          <p v-else class="object-type">
            <Target :size="14" /> {{ wikiData?.description || '未分類天體' }}
          </p>
        </div>

        <div v-if="info" class="details-grid">
          <div class="detail-item">
            <span class="label"><Rocket :size="14" /> 距離</span>
            <span class="value">{{ info.distance }}</span>
          </div>
          <div class="detail-item">
            <span class="label"><Maximize :size="14" /> 尺寸</span>
            <span class="value">{{ info.size }}</span>
          </div>
          <div class="detail-item">
            <span class="label"><Info :size="14" /> 視星等</span>
            <span class="value">{{ info.magnitude }}</span>
          </div>
        </div>

        <div class="description-section">
          <div class="section-header">
            <h3 class="section-subtitle">特性介紹</h3>
            <span v-if="isFetching" class="loading-badge">
              <Loader2 :size="12" class="spin" /> 雲端抓取中...
            </span>
            <span v-else-if="wikiData" class="wiki-badge">
              <Globe :size="12" /> 維基百科
            </span>
          </div>

          <p class="description">
            {{ wikiData?.extract || info?.description || '目前資料庫中尚無此天體的詳細特性介紹。正在嘗試從星系深處搜尋訊號...' }}
          </p>

          <a v-if="wikiData" :href="wikiData.content_urls.desktop.page" target="_blank" class="more-link">
            在維基百科閱讀更多 <ExternalLink :size="12" />
          </a>
        </div>

        <div v-if="!info" class="hint-card">
          <p>💡 提示：雖然資料庫中沒有詳細資訊，但您依然可以手動編輯名稱或將標記位置導出。</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.detail-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  bottom: 20px;
  width: 320px;
  background: rgba(15, 15, 25, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  margin: 0;
  font-size: 0.9rem;
  color: #646cff;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  padding: 4px;
}

.close-btn:hover {
  color: white;
}

.panel-body {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.object-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.2;
}

.object-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin: 0;
  text-transform: capitalize;
}

.wiki-thumbnail {
  width: calc(100% + 3rem);
  margin-left: -1.5rem;
  margin-top: -1.5rem;
  margin-bottom: 1.5rem;
  height: 200px;
  position: relative;
  overflow: hidden;
  background: #000;
}

.wiki-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.wiki-thumbnail:hover img {
  opacity: 1;
}

.image-source {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.detail-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.75rem 1rem;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item .label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}

.detail-item .value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #a855f7;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.section-subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.loading-badge, .wiki-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}

.wiki-badge {
  background: rgba(100, 108, 255, 0.2);
  color: #a855f7;
}

.description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.more-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #646cff;
  text-decoration: none;
  font-weight: 500;
}

.more-link:hover {
  text-decoration: underline;
}

.hint-card {
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(100, 108, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(100, 108, 255, 0.2);
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
