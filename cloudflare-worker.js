/**
 * Cloudflare Workers 代理 - 市场活动管理系统
 *
 * 作用：把 jsonbin.io 的 Master Key 存放在 Worker 的环境变量里，
 *       前端只需调用这个 Worker，不再直接持有敏感密钥。
 *
 * ============ 部署步骤 ============
 *
 * 1. 注册/登录 Cloudflare：https://dash.cloudflare.com
 *
 * 2. 进入 Workers & Pages → Create application → Create Worker
 *    把本文件全部内容粘贴进去，Worker 名称建议：mcm-api-proxy
 *
 * 3. 部署后，进入 Worker → Settings → Variables → 添加环境变量：
 *    变量名：JSONBIN_MASTER_KEY
 *    变量值：$2a$10$qPXYw8sncxMpyTyfamrf2.uiMaK9BwgDig//LaW9NSYySggFytYde
 *    (勾选 Encrypt)
 *
 *    变量名：JSONBIN_BIN_ID
 *    变量值：69bd20d6b7ec241ddc86e1c2
 *
 *    变量名：ALLOWED_ORIGIN
 *    变量值：https://ray-nng.github.io
 *
 * 4. 部署完成后，Worker 的访问地址类似：
 *    https://mcm-api-proxy.<your-subdomain>.workers.dev
 *    把这个地址填入 index.html 和 admin.html 的 PROXY_API 变量中。
 *
 * 5. 完成后，从 index.html / admin.html 中删除 JSONBIN_MASTER_KEY 明文。
 *
 * ===================================
 */

export default {
  async fetch(request, env) {
    // ===== CORS 预检处理 =====
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowedOrigin),
      });
    }

    const url = new URL(request.url);
    const path = url.pathname; // e.g. /data  or /data/latest

    // ===== 只允许 /data 路径 =====
    if (!path.startsWith('/data')) {
      return jsonError(404, '路径不存在', allowedOrigin);
    }

    const BIN_ID    = env.JSONBIN_BIN_ID;
    const MASTER_KEY = env.JSONBIN_MASTER_KEY;

    if (!BIN_ID || !MASTER_KEY) {
      return jsonError(500, '服务器配置错误：缺少环境变量', allowedOrigin);
    }

    // ===== 来源校验（可选但推荐）=====
    const origin = request.headers.get('Origin') || '';
    if (allowedOrigin !== '*' && origin && !origin.startsWith(allowedOrigin)) {
      return jsonError(403, '来源不被允许', allowedOrigin);
    }

    // ===== 路由分发 =====
    // GET /data/latest  → 读最新数据
    if (request.method === 'GET' && path === '/data/latest') {
      return await proxyGet(BIN_ID, MASTER_KEY, allowedOrigin);
    }

    // PUT /data  → 写数据
    if (request.method === 'PUT' && path === '/data') {
      return await proxyPut(request, BIN_ID, MASTER_KEY, allowedOrigin);
    }

    return jsonError(405, '不支持的请求方式', allowedOrigin);
  }
};

// ===== 读取数据 =====
async function proxyGet(binId, masterKey, allowedOrigin) {
  const upstream = `https://api.jsonbin.io/v3/b/${binId}/latest`;
  const res = await fetch(upstream, {
    headers: { 'X-Master-Key': masterKey }
  });

  const body = await res.text();

  return new Response(body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(allowedOrigin),
    }
  });
}

// ===== 写入数据 =====
async function proxyPut(request, binId, masterKey, allowedOrigin) {
  let body;
  try {
    body = await request.text();
  } catch {
    return jsonError(400, '请求体无效', allowedOrigin);
  }

  // 将客户端传来的版本号转发
  const clientVersion = request.headers.get('X-Bin-Version');
  const upstreamHeaders = {
    'Content-Type': 'application/json',
    'X-Master-Key': masterKey,
  };
  if (clientVersion) {
    upstreamHeaders['X-Bin-Version'] = clientVersion;
  }

  const upstream = `https://api.jsonbin.io/v3/b/${binId}`;
  const res = await fetch(upstream, {
    method: 'PUT',
    headers: upstreamHeaders,
    body: body,
  });

  const resBody = await res.text();

  return new Response(resBody, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(allowedOrigin),
    }
  });
}

// ===== 工具函数 =====
function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Bin-Version',
  };
}

function jsonError(status, message, origin) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    }
  });
}
