import { Router } from 'express';
import { SaudeSistemaController } from '../controllers/SaudeSistemaController';

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health Check]
 *     summary: Health check da API
 *     description: Verifica se o processo da API está em execução.
 *     responses:
 *       200:
 *         description: API operacional
 *         content:
 *           application/json:
 *             example:
 *               status: ok
 *               servico: raizes-backend-api
 *               porta: 3210
 *               url: http://localhost:3210
 *               timestamp: '2026-06-17T08:00:00.000Z'
 *
 * /ready:
 *   get:
 *     tags: [Health Check]
 *     summary: Readiness check
 *     description: Verifica conectividade com PostgreSQL e Redis.
 *     responses:
 *       200:
 *         description: Todas as dependências disponíveis
 *         content:
 *           application/json:
 *             example:
 *               status: ready
 *               dependencias:
 *                 postgresql: true
 *                 redis: true
 *               timestamp: '2026-06-17T08:00:00.000Z'
 *       503:
 *         description: Uma ou mais dependências indisponíveis
 *         content:
 *           application/json:
 *             example:
 *               status: degraded
 *               dependencias:
 *                 postgresql: true
 *                 redis: false
 *               timestamp: '2026-06-17T08:00:00.000Z'
 */

const rotasSaude = Router();
const saudeController = new SaudeSistemaController();

rotasSaude.get('/health', saudeController.health);
rotasSaude.get('/ready', saudeController.ready);

export { rotasSaude };
