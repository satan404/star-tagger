<script setup>
import { ref, reactive, computed } from 'vue'
import Sidebar from './components/Sidebar.vue'
import StarCanvas from './components/StarCanvas.vue'
import DetailPanel from './components/DetailPanel.vue'

const imageSrc = ref(null)
const galaxies = ref([])
const selectedGalaxyId = ref(null)
const isScanning = ref(false)
const scanStatus = ref('')
const userApiKey = ref('')

const activeGalaxy = computed(() => 
  galaxies.value.find(g => g.id === selectedGalaxyId.value)
)

const handleImageUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    imageSrc.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const addGalaxy = (name) => {
  const newGalaxy = {
    id: Date.now().toString(),
    name,
    x: null,
    y: null,
    isPlaced: false
  }
  galaxies.value.push(newGalaxy)
  selectedGalaxyId.value = newGalaxy.id
}

const removeGalaxy = (id) => {
  galaxies.value = galaxies.value.filter(g => g.id !== id)
  if (selectedGalaxyId.value === id) {
    selectedGalaxyId.value = null
  }
}

const placeGalaxy = ({ x, y }) => {
  if (selectedGalaxyId.value) {
    const galaxy = galaxies.value.find(g => g.id === selectedGalaxyId.value)
    if (galaxy) {
      galaxy.x = x
      galaxy.y = y
      galaxy.isPlaced = true
    }
  }
}

const scanImage = async () => {
  if (!imageSrc.value || !userApiKey.value) {
    alert(!userApiKey.value ? '請先輸入 API Key' : '尚未上傳圖片')
    return
  }
  
  isScanning.value = true
  scanStatus.value = '登入服務中...'
  
  try {
    // 1. Login
    const loginRes = await fetch('/api/astrometry/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `request-json=${encodeURIComponent(JSON.stringify({ apikey: userApiKey.value }))}`
    })
    
    if (!loginRes.ok) {
      const text = await loginRes.text()
      console.error('Login error response:', text)
      throw new Error(`登入伺服器回應異常 (${loginRes.status})`)
    }

    const loginData = await loginRes.json()
    if (loginData.status !== 'success') throw new Error('登入失敗，請檢查 API Key')
    const session = loginData.session

    // 2. Upload Image
    scanStatus.value = '圖片上傳中...'
    const binaryRes = await fetch(imageSrc.value)
    const blob = await binaryRes.blob()
    
    const formData = new FormData()
    formData.append('request-json', JSON.stringify({ session }))
    formData.append('file', blob)

    const uploadRes = await fetch('/api/astrometry/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!uploadRes.ok) {
      const text = await uploadRes.text()
      console.error('Upload error response:', text)
      throw new Error(`上傳伺服器回應異常 (${uploadRes.status})`)
    }

    const uploadData = await uploadRes.json()
    if (uploadData.status !== 'success') throw new Error('上傳失敗')
    const subId = uploadData.subid

    // 3. Polling Submission Status
    let jobId = null
    scanStatus.value = '排隊辨識中 (這可能需要 30-60 秒)...'
    
    for (let i = 0; i < 40; i++) { // Max 200s
      await new Promise(r => setTimeout(r, 5000))
      const subRes = await fetch(`/api/astrometry/submissions/${subId}`)
      if (!subRes.ok) continue
      
      const subStatus = await subRes.json()
      
      if (subStatus.job_calibrations && subStatus.job_calibrations.length > 0) {
        jobId = subStatus.jobs[0]
        break
      }
      scanStatus.value = `辨識進度: 佇列處理中... (${(i+1)*5}s)`
    }

    if (!jobId) throw new Error('辨識逾時')

    // 4. Wait for Job Final Result
    scanStatus.value = '解析天體名稱中...'
    
    // 預先取得圖片尺寸供座標轉換
    const img = new Image()
    img.src = imageSrc.value
    await new Promise(r => img.onload = r)
    const imgWidth = img.width
    const imgHeight = img.height

    let retryJob = 0
    while (retryJob < 5) {
      const jobRes = await fetch(`/api/astrometry/jobs/${jobId}/annotations/`)
      const annotations = await jobRes.json()
      
      if (annotations.annotations && annotations.annotations.length > 0) {
        // 將辨識結果轉換為標記
        annotations.annotations.forEach((ann, idx) => {
          galaxies.value.push({
            id: `astro-${Date.now()}-${idx}`,
            name: ann.names[0] || ann.type,
            x: ann.pixelx / imgWidth,
            y: ann.pixely / imgHeight,
            isPlaced: true
          })
        })
        break
      }
      retryJob++
      await new Promise(r => setTimeout(r, 2000))
    }

    scanStatus.value = '辨識完成！'
  } catch (err) {
    console.error(err)
    alert(`辨識出錯: ${err.message}`)
  } finally {
    isScanning.value = false
    scanStatus.value = ''
  }
}

const exportImage = async () => {
  if (!imageSrc.value) return
  
  const img = new Image()
  img.src = imageSrc.value
  await new Promise(resolve => img.onload = resolve)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  // 使用原始圖片尺寸
  canvas.width = img.width
  canvas.height = img.height
  
  // 繪製背景圖
  ctx.drawImage(img, 0, 0)
  
  // 繪製標記
  galaxies.value.forEach(g => {
    if (!g.isPlaced) return
    
    const x = g.x * canvas.width
    const y = g.y * canvas.height
    
    // 1. 繪製標靶圓圈 (藍色)
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#646cff'
    ctx.shadowBlur = 10
    ctx.shadowColor = '#646cff'
    ctx.fill()
    ctx.shadowBlur = 0 // 重設陰影
    
    ctx.beginPath()
    ctx.arc(x, y, 12, 0, Math.PI * 2)
    ctx.strokeStyle = '#646cff'
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([]) // 重設虛線
    
    // 2. 繪製指示線 (白色)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 30, y - 30) // 指示線轉折點
    ctx.lineTo(x + 100, y - 30) // 標籤底部橫線
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.8
    ctx.stroke()
    ctx.globalAlpha = 1.0
    
    // 3. 繪製文字標籤
    ctx.font = 'bold 24px Inter, system-ui'
    ctx.fillStyle = 'white'
    // 加上黑邊提升可讀性
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 4
    ctx.strokeText(g.name, x + 105, y - 30)
    ctx.fillText(g.name, x + 105, y - 30)
  })
  
  // 下載圖片
  const link = document.createElement('a')
  link.download = `star-tagger-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
</script>

<template>
  <aside class="sidebar">
    <Sidebar 
      :galaxies="galaxies" 
      :selectedId="selectedGalaxyId"
      :isScanning="isScanning"
      :scanStatus="scanStatus"
      @add="addGalaxy"
      @remove="removeGalaxy"
      @select="id => selectedGalaxyId = id"
      @upload="handleImageUpload"
      @scan="scanImage"
      @updateApiKey="key => userApiKey = key"
    />
  </aside>

  <header class="header">
    <div class="header-title">
      <h1 style="margin: 0; font-size: 1.2rem; color: #646cff;">Star Tagger</h1>
    </div>
    <div class="header-actions">
      <button v-if="imageSrc" @click="exportImage" class="primary">匯出圖片</button>
    </div>
  </header>

  <main class="main">
    <div v-if="!imageSrc" class="welcome-screen">
      <div class="card" style="text-align: center; max-width: 400px;">
        <h2>歡迎使用星空標記系統</h2>
        <p>上傳一張星空照片來開始標記您的星系</p>
        <button @click="$refs.fileInput.click()" class="primary">上傳照片</button>
        <input 
          type="file" 
          ref="fileInput" 
          style="display: none" 
          accept="image/*" 
          @change="e => handleImageUpload(e.target.files[0])"
        />
      </div>
    </div>
    
    <StarCanvas 
      v-else
      :imageSrc="imageSrc"
      :galaxies="galaxies"
      :selectedId="selectedGalaxyId"
      @place="placeGalaxy"
    />

    <DetailPanel 
      :galaxy="activeGalaxy" 
      @close="selectedGalaxyId = null"
    />
  </main>
</template>

<style scoped>
.welcome-screen {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
}

.header-title h1 {
  font-weight: 800;
  letter-spacing: -0.02em;
}
</style>
