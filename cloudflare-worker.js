/**
 * Cloudflare Workers 反向代理 - 市场活动管理系统
 *
 * 作用：代理腾讯云 COS，自动去掉 Content-Disposition: attachment，
 *       让 index.html / admin.html 能在浏览器正常打开而不触发下载。
 *       同时处理数据文件（data.json / sys_config.json）的 CORS 跨域。
 *
 * ============ 部署步骤 ============
 *
 * 1. 登录 Cloudflare：https://dash.cloudflare.com
 *
 * 2. 进入 Workers & Pages → Create application → Create Worker
 *    Worker 名称：mcm-cos-proxy（或任意名称）
 *    把本文件全部内容粘贴进去，点 Deploy
 *
 * 3. 进入 Worker → Settings → Variables，添加环境变量：
 *
 *    COS_BUCKET   = nnqgcvte2026-1414699807
 *    COS_REGION   = ap-guangzhou
 *    COS_SECRET_ID  = AKIDS3QaXHxPcbQ1NTLzlJc2DAtOegT0Mmlz   (勾选 Encrypt)
 *    COS_SECRET_KEY = HEzWpwd7XqX2V9jEdtwkgYDdpmUWJrAE       (勾选 Encrypt)
 *
 * 4. Worker 部署后地址类似：
 *    https://mcm-cos-proxy.<your-subdomain>.workers.dev
 *
 * 5. 【重要】把 index.html 和 admin.html 里所有 COS 请求域名改为 Worker 地址：
 *    原来：https://nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com/xxx
 *    改为：https://mcm-cos-proxy.<subdomain>.workers.dev/xxx
 *
 *    数据读写（PUT/GET data.json）也改为 Worker 地址，不需要改代码逻辑，
 *    Worker 会自动带上 COS 签名转发。
 *
 * ===================================
 *
 * 路由说明：
 *   GET  /index.html   → 代理到 COS，删掉 Content-Disposition，正常显示页面
 *   GET  /admin.html   → 同上
 *   GET  /data.json    → 代理到 COS，允许跨域
 *   PUT  /data.json    → 带签名上传到 COS
 *   GET  /sys_config.json → 代理到 COS
 *   PUT  /sys_config.json → 带签名上传到 COS
 *   GET  /channels.json   → 代理到 COS
 *   PUT  /channels.json   → 带签名上传到 COS
 *   ...所有路径均被代理
 */

export default {
  async fetch(request, env) {
    const bucket    = env.COS_BUCKET    || 'nnqgcvte2026-1414699807';
    const region    = env.COS_REGION    || 'ap-guangzhou';
    const secretId  = env.COS_SECRET_ID;
    const secretKey = env.COS_SECRET_KEY;

    const cosHost = `${bucket}.cos.${region}.myqcloud.com`;
    const url = new URL(request.url);
    const cosPath = url.pathname || '/';
    const cosQuery = url.search || '';

    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // 构造 COS 请求 URL
    const cosUrl = `https://${cosHost}${cosPath}${cosQuery}`;

    // 构造签名（仅写操作需要，读操作 COS 是公有读）
    let authHeader = '';
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (!secretId || !secretKey) {
        return new Response(JSON.stringify({ error: '缺少 COS 密钥配置' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });
      }
      authHeader = await makeAuth(request.method, cosPath, cosQuery, cosHost, secretId, secretKey);
    }

    // 转发请求到 COS
    const cosHeaders = new Headers();
    cosHeaders.set('Host', cosHost);
    if (authHeader) {
      cosHeaders.set('Authorization', authHeader);
    }

    // 透传 Content-Type（PUT 上传时需要）
    const ct = request.headers.get('Content-Type');
    if (ct) cosHeaders.set('Content-Type', ct);

    let body = null;
    if (request.method === 'PUT' || request.method === 'POST') {
      body = await request.arrayBuffer();
    }

    let cosResp;
    try {
      cosResp = await fetch(cosUrl, {
        method: request.method,
        headers: cosHeaders,
        body: body,
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: `代理请求失败: ${e.message}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }

    // 构造响应头，删掉强制下载
    const respHeaders = new Headers();
    for (const [k, v] of cosResp.headers.entries()) {
      const lower = k.toLowerCase();
      // 跳过这两个头，不透传
      if (lower === 'content-disposition') continue;
      if (lower === 'x-cos-force-download') continue;
      respHeaders.set(k, v);
    }

    // 根据文件扩展名设置正确的 Content-Type
    const ext = cosPath.split('.').pop().toLowerCase();
    const mimeMap = {
      'html': 'text/html; charset=utf-8',
      'htm':  'text/html; charset=utf-8',
      'js':   'application/javascript; charset=utf-8',
      'css':  'text/css; charset=utf-8',
      'json': 'application/json; charset=utf-8',
      'png':  'image/png',
      'jpg':  'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif':  'image/gif',
      'svg':  'image/svg+xml',
      'ico':  'image/x-icon',
      'woff': 'font/woff',
      'woff2':'font/woff2',
    };
    if (mimeMap[ext]) {
      respHeaders.set('Content-Type', mimeMap[ext]);
    }

    // 添加 CORS 头（数据接口需要）
    const corsH = corsHeaders();
    for (const [k, v] of Object.entries(corsH)) {
      respHeaders.set(k, v);
    }

    return new Response(cosResp.body, {
      status: cosResp.status,
      statusText: cosResp.statusText,
      headers: respHeaders,
    });
  }
};

// ===== CORS 头 =====
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Expose-Headers': 'ETag, x-cos-request-id',
  };
}

// ===== 生成腾讯云 COS 签名 =====
async function makeAuth(method, path, queryString, host, secretId, secretKey) {
  const now = Math.floor(Date.now() / 1000);
  const signTime = `${now};${now + 3600}`;

  // 规范化 header
  const headersToSign = { host };
  const headerKeys = Object.keys(headersToSign).map(k => k.toLowerCase()).sort();
  const headerList = headerKeys.join(';');
  const headersStr = headerKeys.map(k => `${k}=${encodeURIComponent(headersToSign[k])}`).join('&');

  // 规范化 query
  const qStr = queryString.replace(/^\?/, '');
  const queryList = qStr ? qStr.split('&').map(p => {
    const [k, v=''] = p.split('=');
    return `${k.toLowerCase()}=${v}`;
  }).sort().join('&') : '';
  const paramList = qStr ? qStr.split('&').map(p => p.split('=')[0].toLowerCase()).sort().join(';') : '';

  // HTTP 字符串
  const httpString = [
    method.toLowerCase(),
    path,
    queryList,
    headersStr,
    '',
  ].join('\n');

  // 签名字符串
  const httpStringHash = await sha1Hex(httpString);
  const stringToSign = `sha1\n${signTime}\n${httpStringHash}\n`;

  // 密钥
  const signKey = await hmacSha1Hex(secretKey, signTime);
  const signature = await hmacSha1Hex(signKey, stringToSign);

  return [
    'q-sign-algorithm=sha1',
    `q-ak=${secretId}`,
    `q-sign-time=${signTime}`,
    `q-key-time=${signTime}`,
    `q-header-list=${headerList}`,
    `q-url-param-list=${paramList}`,
    `q-signature=${signature}`,
  ].join('&');
}

async function sha1Hex(message) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-1', enc.encode(message));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha1Hex(key, message) {
  const enc = new TextEncoder();
  const keyBuf = typeof key === 'string' ? enc.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBuf, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}
