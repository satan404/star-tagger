import http from 'http';

// 停用 Vercel 預設的 Body Parser，確保圖片上傳等二進制數據完整轉發
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  // 從查詢參數獲取路徑
  const { path: apiPath } = req.query;
  // 核心策略：切換回 HTTP 協定，避開對端伺服器可能的 SSL/SNI 處理異常
  const destination = `http://nova.astrometry.net/api/${apiPath || ''}`;

  // 核心策略：極致簡化標頭，移除所有 Vercel 加入的 x-vercel-*, x-forwarded-* 等標頭
  // 這些非標準標頭常導致舊型 Apache/Django 伺服器報錯 (500)
  const allowedHeaders = ['content-type', 'content-length', 'accept'];
  const filteredHeaders = {};
  
  // 只保留必要標頭
  allowedHeaders.forEach(h => {
    if (req.headers[h]) {
      filteredHeaders[h] = req.headers[h];
    }
  });

  // 固定使用標準瀏覽器 User-Agent，避免被判定為機器人 (503)
  filteredHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  const options = {
    method: req.method,
    headers: filteredHeaders
  };

  const proxyReq = http.request(destination, options, (proxyRes) => {
    // 轉發回應狀態與標頭
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    // 串流轉發回應內容
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    console.error('Proxy Request Error:', e);
    // 如果連 HTTP 都失敗，嘗試顯示更多資訊
    const errorMsg = e.message || 'Unknown proxy error';
    res.status(500).json({ error: 'Proxy failed', message: errorMsg, dest: destination });
  });

  // 串流轉發請求體
  req.pipe(proxyReq);
}
