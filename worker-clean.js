export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowedOrigin),
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (!path.startsWith('/data')) {
      return jsonError(404, '路径不存在', allowedOrigin);
    }

    const BIN_ID    = env.JSONBIN_BIN_ID;
    const MASTER_KEY = env.JSONBIN_MASTER_KEY;

    if (!BIN_ID || !MASTER_KEY) {
      return jsonError(500, '服务器配置错误：缺少环境变量', allowedOrigin);
    }

    const origin = request.headers.get('Origin') || '';
    if (allowedOrigin !== '*' && origin && !origin.startsWith(allowedOrigin)) {
      return jsonError(403, '来源不被允许', allowedOrigin);
    }

    if (request.method === 'GET' && path === '/data/latest') {
      return await proxyGet(BIN_ID, MASTER_KEY, allowedOrigin);
    }

    if (request.method === 'PUT' && path === '/data') {
      return await proxyPut(request, BIN_ID, MASTER_KEY, allowedOrigin);
    }

    return jsonError(405, '不支持的请求方式', allowedOrigin);
  }
};

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

async function proxyPut(request, binId, masterKey, allowedOrigin) {
  let body;
  try {
    body = await request.text();
  } catch {
    return jsonError(400, '请求体无效', allowedOrigin);
  }

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
