import https from 'https';

// 停用 Vercel 預設的 Body Parser，確保圖片上傳等二進制數據完整轉發
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  // 從查詢參數獲取路徑
  let { path: apiPath } = req.query;
  
  // 核心修正：解碼並清理路徑，去除可能導致 404 的重複斜線
  if (apiPath) {
    apiPath = decodeURIComponent(apiPath).replace(/^\/+/, '');
  }

  // 核心策略：恢復使用 HTTPS 協定，確保與現代 API 端口 (443) 的通訊穩定
  const destination = `https://nova.astrometry.net/api/${apiPath || ''}`;

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

  // 下載數據時必須夾帶 Referer (官方規範)
  if (apiPath && (apiPath.includes('jobs') || apiPath.includes('annotations'))) {
    filteredHeaders['Referer'] = 'https://nova.astrometry.net/api/login';
  }

  const options = {
    method: req.method,
    headers: filteredHeaders
  };

  const proxyReq = https.request(destination, options, (proxyRes) => {
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
