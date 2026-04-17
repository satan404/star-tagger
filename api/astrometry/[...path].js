import http from 'http';

// 停用 Vercel 預設的 Body Parser，確保圖片上傳等二進制數據完整轉發
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  // 從 Vercel 動態路由獲取路徑陣列
  // 例如 /api/astrometry/jobs/123/ 請求，path 會是 ["jobs", "123"]
  const { path: pathArray } = req.query;
  
  // 將陣列重新組合成 Astrometry.net 所需的路徑
  // 並確保保留原本請求的結構（包含結尾斜線的處理）
  const apiPath = Array.isArray(pathArray) ? pathArray.join('/') : (pathArray || '');
  
  // 核心策略：改回 HTTP 協定以獲得更高的對端相容性，並手動組裝路徑
  // 注意：我們在結尾補上 / 是因為 Astrometry API 對結尾斜線非常敏感
  const destination = `http://nova.astrometry.net/api/${apiPath}${req.url.endsWith('/') ? '/' : ''}`;

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

  // 官方規範：下載文件與數據時必須夾帶 Referer
  if (apiPath.includes('jobs') || apiPath.includes('annotations')) {
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
