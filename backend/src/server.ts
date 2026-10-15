import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HelpPaln SaaS Backend'
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Servidor HelpPaln Backend rodando na porta ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`📡 Webhook Evolution: http://localhost:${PORT}/api/webhook/evolution`);
  console.log(`===============================================`);
});
