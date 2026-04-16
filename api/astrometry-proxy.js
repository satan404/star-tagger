import https from 'https';

// 停用 Vercel 預設的 Body Parser，這對處理圖片上傳（multipart/form-data）至關重要
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  // 從查詢參數獲取路徑（配合 vercel.json 的 rewrite）
  const { path: apiPath } = req.query;
  const destination = `https://nova.astrometry.net/api/${apiPath || ''}`;

  const options = {
    method: req.method,
    headers: {
      // 轉發瀏覽器的 User-Agent，避免被 Apache/Cloudflare 判定為 Bot 而回傳 503
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': req.headers['accept'] || 'application/json',
      // 其他必要標頭
      ...Object.fromEntries(
        Object.entries(req.headers).filter(([key]) => 
          !['host', 'referer', 'user-agent', 'accept', 'cookie'].includes(key.toLowerCase())
        )
      )
    }
  };

  const proxyReq = https.request(destination, options, (proxyRes) => {
    // 轉發回應狀態與標頭
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    // 串流轉發回應內容
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    console.error('Proxy Request Error:', e);
    res.status(500).json({ error: 'Proxy failed', message: e.message });
  });

  // 串流轉發請求內容 (確保圖片上傳等二進制數據完整)
  req.pipe(proxyReq);
}
