import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProcessarWebhookPagamentoService } from '../services/ProcessarWebhookPagamentoService';

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
