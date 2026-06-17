import { Router } from 'express';
import { PagamentoWebhookController } from '../controllers/PagamentoWebhookController';

const rotasPagamentos = Router();
const webhookController = new PagamentoWebhookController();

rotasPagamentos.post('/webhook', webhookController.receber);

export { rotasPagamentos };
