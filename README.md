# 🌌 星空標記系統 (Stellar Star Tagger)

這是一款專為天文愛好者設計的 Web 應用程式，結合了 **Astrometry.net** 專業辨識技術與 **Wikipedia** 雲端知識庫，讓您能輕鬆標註並探索星空照片中的奧秘。

![Preview](https://raw.githubusercontent.com/your-username/star-tagger/main/preview.png) *(請替換為實際預錄圖)*

## ✨ 核心特色

- 🔭 **專業天體解析**：整合 Astrometry.net API，自動辨識照片中的星系、星雲與恆星。
- 📚 **雲端百科全書**：選取天體後，自動從維基百科（中英雙語）抓取詳細科學背景與實拍縮圖。
- 🖋️ **互動標註**：支援手動與 AI 自動標記，具備優雅的引線標籤與脈衝定位特效。
- 🖼️ **成品匯出**：一鍵將標記後的圖片合成並下載為高品質 PNG。
- 🌚 **深色模式**：專為夜間觀測設計的 Stellar Dark 主題。

## 🚀 快速開始

### 本地開發

1. **安裝依賴**
   ```bash
   npm install
   ```

2. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

3. **配置 API Key**
   開啟網頁後，在側邊欄填入您的 [Astrometry.net API Key](https://nova.astrometry.net/api_help)。

### 部署到 Vercel (支援 Proxy)

本專案已配置好 `vercel.json`，支援部署後的 API 重寫功能：
1. 將此專案推送到您的 GitHub。
2. 在 Vercel 儀表板點選 **Import Project**。
3. 部署完成後，即可在您的專屬網址上使用完整功能。

## 🛠️ 技術棧

- **前端框架**: Vue 3 (Composition API)
- **構建工具**: Vite
- **圖示庫**: Lucide Vue Next
- **API 串接**: Astrometry.net (影像辨識), Wikipedia (知識提取)
- **部署**: Vercel (支援 Server-side Rewrites)

## 📄 授權協議

MIT License - 歡迎自由使用與擴充！💡
