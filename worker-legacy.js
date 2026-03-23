addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request).catch(err => {
    console.error('Worker error:', err)
    return jsonError(500, 'Worker 处理错误: ' + err.message)
  }))
})

const allowedOrigin = 'https://ray-nng.github.io'

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }

  const url = new URL(request.url)
  const path = url.pathname

  if (!path.startsWith('/data')) {
    return jsonError(404, '路径不存在')
  }

  if (request.method === 'GET' && path === '/data/latest') {
    return await proxyGet()
  }

  if (request.method === 'PUT' && path === '/data') {
    return await proxyPut(request)
  }

  return jsonError(405, '不支持的请求方式')
}

async function proxyGet() {
  const binId = '69bd20d6b7ec241ddc86e1c2'
  const masterKey = '$2a$10$qPXYw8sncxMpyTyfamrf2.uiMaK9BwgDig//LaW9NSYySggFytYde'
  
  const upstream = `https://api.jsonbin.io/v3/b/${binId}/latest`
  
  // 设置较长的超时（30秒）
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  
  try {
    const res = await fetch(upstream, {
      headers: { 'X-Master-Key': masterKey },
      signal: controller.signal,
    })
    
    const body = await res.text()

    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      }
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function proxyPut(request) {
  const binId = '69bd20d6b7ec241ddc86e1c2'
  const masterKey = '$2a$10$qPXYw8sncxMpyTyfamrf2.uiMaK9BwgDig//LaW9NSYySggFytYde'
  
  let body
  try {
    // 增加请求体读取超时（这是关键步骤）
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
      body = await request.text()
    } finally {
      clearTimeout(timeout)
    }
  } catch (err) {
    console.error('Read body error:', err.message)
    return jsonError(400, '读取请求体失败: ' + err.message)
  }

  if (!body) {
    return jsonError(400, '请求体为空')
  }

  const clientVersion = request.headers.get('X-Bin-Version')
  const upstreamHeaders = {
    'Content-Type': 'application/json',
    'X-Master-Key': masterKey,
  }
  if (clientVersion) {
    upstreamHeaders['X-Bin-Version'] = clientVersion
  }

  const upstream = `https://api.jsonbin.io/v3/b/${binId}`
  
  // 转发请求时设置较长超时（45秒）
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 45000)
  
  try {
    const res = await fetch(upstream, {
      method: 'PUT',
      headers: upstreamHeaders,
      body: body,
      signal: controller.signal,
    })

    const resBody = await res.text()

    return new Response(resBody, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      }
    })
  } finally {
    clearTimeout(timeout)
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Bin-Version',
  }
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    }
  })
}
