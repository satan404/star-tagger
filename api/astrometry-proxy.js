import http from 'http';

// 停用 Vercel 預設的 Body Parser，確保圖片上傳等二進制數據完整轉發
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  // 從查詢參數獲取路徑
  let { path: apiPath } = req.query;
  
  // 關鍵修正：Vercel 會自動對 query 參數進行編碼 (例如 / 變成 %2F)
  // 如果不手動解碼，轉發給 Astrometry.net 的 URL 會變成無效路徑，導致 404
  if (apiPath) {
    apiPath = decodeURIComponent(apiPath);
  }

  const destination = `http://nova.astrometry.net/api/${apiPath || ''}`;

  const allowedHeaders = ['content-type', 'content-length', 'accept'];
  const filteredHeaders = {};
  
  // 只保留必要標頭
  allowedHeaders.forEach(h => {
    if (req.headers[h]) {
      filteredHeaders[h] = req.headers[h];
    }
  });

  // 固定使用標準瀏覽器 User-Agent
  filteredHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  // 關鍵策略：官方文件規定，下載文件與標籤數據 (annotations) 時必須夾帶 Referer
  if (apiPath && (apiPath.includes('jobs') || apiPath.includes('annotations'))) {
    filteredHeaders['Referer'] = 'https://nova.astrometry.net/api/login';
  }

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
    res.status(500).json({ error: 'Proxy failed', message: e.message, dest: destination });
  });

  // 串流轉發請求體
  req.pipe(proxyReq);
}
