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
      // 移除可能導致 CSRF 報錯的 Referer (只限 API 呼叫時)
      // 使用簡潔的 API 用戶端識別，避免被判定為偽造的瀏覽器表單
      'User-Agent': 'StellarTagger/1.0 (https://star-tagger.vercel.app)',
      'Accept': 'application/json',
      // 轉發原始請求的所有其他 Headers (包含 Content-Type, Content-Length)
      ...Object.fromEntries(
        Object.entries(req.headers).filter(([key]) => 
          !['host', 'referer', 'user-agent', 'cookie'].includes(key.toLowerCase())
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
