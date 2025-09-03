const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🧪 Testing basic server setup...');
console.log('📊 Environment variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT);
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set ✅' : 'Not set ❌');

try {
  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(cors());
  app.use(express.json());

  app.get('/test', (req, res) => {
    res.json({ message: 'Test successful!' });
  });

  app.listen(PORT, () => {
    console.log(`✅ Test server running on port ${PORT}`);
    console.log(`🔗 Test URL: http://localhost:${PORT}/test`);
  });
} catch (error) {
  console.error('❌ Error starting test server:', error);
}