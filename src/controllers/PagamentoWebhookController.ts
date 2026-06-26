import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProcessarWebhookPagamentoService } from '../services/ProcessarWebhookPagamentoService';

/**
 * @openapi
 * /api/v1/payments/webhook:
 *   post:
 *     tags: [Pagamentos]
 *     summary: Webhook de confirmação de pagamento
 *     description: |
 *       Recebe notificações assíncronas do gateway mock.
 *       A assinatura HMAC-SHA256 é validada antes do processamento.
 *       Use GET /api/v1/dev/webhook-assinatura para gerar assinatura de teste.
 *     parameters:
 *       - $ref: '#/components/parameters/CorrelationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WebhookPagamentoEntrada'
 *           example:
 *             gatewayRef: mock-gateway-20260617-001
 *             status: APPROVED
 *             assinatura: a1b2c3d4e5f6...
 *     responses:
 *       200:
 *         description: Webhook reconhecido e processado
 *         content:
 *           application/json:
 *             example:
 *               mensagem: Webhook reconhecido
 *       400:
 *         description: Assinatura inválida ou payload incorreto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroApi'
 *       409:
 *         description: Webhook já processado anteriormente (idempotência)
 *         content:
 *           application/json:
 *             example:
 *               mensagem: Webhook já processado anteriormente
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroApi'
 */

const webhookSchema = z.object({
  gatewayRef: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED']),
  assinatura: z.string().min(1),
});

export class PagamentoWebhookController {
  constructor(
    private readonly webhookService = new ProcessarWebhookPagamentoService(),
  ) {}

  receber = async (
    requisicao: Request,
    resposta: Response,
    proximo: NextFunction,
  ): Promise<void> => {
    try {
      const corpo = webhookSchema.parse(requisicao.body);
      const resultado = await this.webhookService.executar({
        ...corpo,
        correlationId: requisicao.correlationId,
      });

      if (!resultado.reconhecido) {
        resposta.status(409).json({ mensagem: 'Webhook já processado anteriormente' });
        return;
      }

      resposta.status(200).json({ mensagem: 'Webhook reconhecido' });
    } catch (erro) {
      proximo(erro);
    }
  };
}
