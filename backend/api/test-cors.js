// Endpoint de teste para diagnóstico de CORS
module.exports = async (req, res) => {
  // Log completo da requisição
  console.log('=== CORS TEST ===');
  console.log('Method:', req.method);
  console.log('Origin:', req.headers.origin);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  const origin = req.headers.origin || '*';
  
  // Configurar TODOS os headers CORS possíveis
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Content-Type', 'application/json');
  
  // Se for OPTIONS, retornar 204 No Content
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight');
    return res.status(204).end();
  }
  
  // Para outros métodos, retornar informações
  return res.status(200).json({
    success: true,
    message: 'CORS test successful',
    method: req.method,
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
};
