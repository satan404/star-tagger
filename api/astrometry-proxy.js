// api/astrometry-proxy.js
// 這是 Vercel 的 Serverless Function，用於代理 Astrometry.net API 並加入安全標頭。

export default async function handler(req, res) {
  // 從查詢參數或路徑獲取目標路徑
  // 注意：我們將轉發所有的 path 與 query
  const targetUrl = new URL(req.url, `http://${req.headers.host}`);
  const apiPath = targetUrl.pathname.replace('/api/astrometry-proxy', '');
  const destination = `https://nova.astrometry.net/api${apiPath}${targetUrl.search}`;

  const headers = {
    'Referer': 'https://nova.astrometry.net/api/login',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
  };

  // 複製原始請求的 Content-Type (用於上傳)
  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    // 如果有 Body，轉發 Body
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // 在 Vercel 中，req 已經被解析過，但我們可以直接轉發
      // 對於 FormData 上傳，我們可能需要特殊處理，
      // 但簡單起見，我們先嘗試轉發。
      fetchOptions.body = req.body;
      
      // 注意：如果 req.body 是物件，需要轉為字串
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        // 特別處理 Astrometry 的 x-www-form-urlencoded 要求
        if (headers['Content-Type']?.includes('application/x-www-form-urlencoded')) {
          const params = new URLSearchParams();
          for (const key in req.body) {
            params.append(key, req.body[key]);
          }
          fetchOptions.body = params.toString();
        } else {
          fetchOptions.body = JSON.stringify(req.body);
        }
      }
    }

    const response = await fetch(destination, fetchOptions);
    const data = await response.text();

    res.status(response.status).send(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
}
