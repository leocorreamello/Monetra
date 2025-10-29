// Health check endpoint
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    status: 'ok',
    service: 'Monetra API',
    timestamp: new Date().toISOString()
  });
};

