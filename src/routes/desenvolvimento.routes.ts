import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { configuracaoAmbiente } from '../config/ambiente';
import { GatewayPagamentoMockService } from '../services/GatewayPagamentoMockService';

const rotasDesenvolvimento = Router();
const simuladorPagamento = new GatewayPagamentoMockService();

/** Lista todos os endpoints disponíveis para testes no Postman/Insomnia. */
rotasDesenvolvimento.get('/endpoints', (_requisicao: Request, resposta: Response): void => {
  resposta.status(200).json({
    baseUrl: `http://${process.env.PUBLIC_HOST ?? 'localhost'}:${process.env.PORT ?? 3210}`,
    endpoints: [
      { metodo: 'GET', rota: '/health', descricao: 'Health check' },
      { metodo: 'GET', rota: '/ready', descricao: 'Readiness (PostgreSQL + Redis)' },
      { metodo: 'GET', rota: '/api/v1/catalog/:unitId', descricao: 'Cardápio da unidade' },
      { metodo: 'POST', rota: '/api/v1/orders', descricao: 'Criar pedido (header idempotency-key)' },
      { metodo: 'GET', rota: '/api/v1/orders/:orderId', descricao: 'Consultar pedido por publicOrderId' },
      { metodo: 'POST', rota: '/api/v1/payments/webhook', descricao: 'Webhook mock de pagamento' },
      { metodo: 'POST', rota: '/api/v1/privacy/consent', descricao: 'Registrar consentimento LGPD' },
      { metodo: 'DELETE', rota: '/api/v1/users/:clientId/anonymize', descricao: 'Anonimizar cliente (JWT)' },
      { metodo: 'POST', rota: '/api/v1/dev/token', descricao: 'Gerar JWT de teste' },
      { metodo: 'GET', rota: '/api/v1/dev/webhook-assinatura', descricao: 'Gerar assinatura HMAC do webhook' },
      { metodo: 'POST', rota: '/api/v1/dev/simular-timeout', descricao: 'CT09 — simular timeout do gateway mock' },
    ],
    idsSeed: {
      unidadeId: '00000000-0000-4000-8000-000000000001',
      clienteId: '00000000-0000-4000-8000-000000000100',
      produtoId: '00000000-0000-4000-8000-000000000010',
      publicOrderId: 'RN-20260617-001',
      gatewayRef: 'mock-gateway-20260617-001',
    },
  });
});

/** Gera JWT para testes no Postman/Insomnia (somente desenvolvimento). */
rotasDesenvolvimento.post('/token', (requisicao: Request, resposta: Response): void => {
  const clienteId =
    (requisicao.body?.clienteId as string | undefined) ??
    '00000000-0000-4000-8000-000000000100';

  const token = jwt.sign(
    { sub: clienteId, role: 'cliente' },
    configuracaoAmbiente.jwt.secret,
    { expiresIn: configuracaoAmbiente.jwt.expiresIn },
  );

  resposta.status(200).json({
    token,
    tipo: 'Bearer',
    clienteId,
    uso: 'Authorization: Bearer <token>',
  });
});

/** Gera assinatura HMAC para testar POST /api/v1/payments/webhook. */
rotasDesenvolvimento.get('/webhook-assinatura', (requisicao: Request, resposta: Response): void => {
  const gatewayRef =
    (requisicao.query.gatewayRef as string | undefined) ?? 'mock-gateway-20260617-001';
  const status = (requisicao.query.status as string | undefined) ?? 'APPROVED';

  if (status !== 'APPROVED' && status !== 'REJECTED') {
    resposta.status(400).json({ erro: 'status deve ser APPROVED ou REJECTED' });
    return;
  }

  const assinatura = simuladorPagamento.gerarAssinaturaHmac(gatewayRef, status);

  resposta.status(200).json({
    gatewayRef,
    status,
    assinatura,
    payload: { gatewayRef, status, assinatura },
  });
});

/**
 * CT09 — Timeout do Gateway de Pagamento Mock (cenário negativo).
 * Agenda expiração sem enviar webhook; pedido permanece em PENDING_PAYMENT.
 */
rotasDesenvolvimento.post('/simular-timeout', (requisicao: Request, resposta: Response): void => {
  const gatewayRef =
    (requisicao.body?.gatewayRef as string | undefined) ?? 'timeout-test-001';
  const timeoutMs = Number(requisicao.body?.timeoutMs ?? 10000);

  if (!gatewayRef.trim()) {
    resposta.status(400).json({ erro: 'gatewayRef é obrigatório' });
    return;
  }

  if (Number.isNaN(timeoutMs) || timeoutMs < 0) {
    resposta.status(400).json({ erro: 'timeoutMs deve ser um número >= 0' });
    return;
  }

  simuladorPagamento.agendarTimeoutSemWebhook({
    gatewayRef,
    timeoutMs,
    correlationId: requisicao.correlationId,
  });

  resposta.status(202).json({
    success: true,
    mensagem: 'Simulação de timeout do gateway mock agendada',
    gatewayRef,
    timeoutMs,
    correlationId: requisicao.correlationId,
    comportamentoEsperado: {
      webhookEnviado: false,
      statusPedido: 'PENDING_PAYMENT',
      acaoRecomendada: 'retry com backoff exponencial',
    },
  });
});

export { rotasDesenvolvimento };
