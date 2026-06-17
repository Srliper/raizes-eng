import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CriarPedidoMulticanalService } from '../services/CriarPedidoMulticanalService';
import { AppError } from '../utils/AppError';

const itemPedidoSchema = z.object({
  produtoId: z.string().uuid(),
  quantidade: z.number().int().positive(),
  observacoes: z.string().optional(),
});

const criarPedidoSchema = z.object({
  unidadeId: z.string().uuid(),
  canal: z.enum(['APP', 'TOTEM', 'BALCAO', 'PICKUP']),
  clienteId: z.string().uuid().optional(),
  itens: z.array(itemPedidoSchema).min(1),
});

export class PedidoMulticanalController {
  constructor(private readonly criarPedidoService = new CriarPedidoMulticanalService()) {}

  criar = async (requisicao: Request, resposta: Response, proximo: NextFunction): Promise<void> => {
    try {
      const idempotencyKey = requisicao.headers['idempotency-key'];
      if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length === 0) {
        throw new AppError('Cabeçalho idempotency-key é obrigatório', 400);
      }

      const corpo = criarPedidoSchema.parse(requisicao.body);

      const pedido = await this.criarPedidoService.executar({
        ...corpo,
        idempotencyKey,
        correlationId: requisicao.correlationId,
      });

      resposta.status(201).json(pedido);
    } catch (erro) {
      proximo(erro);
    }
  };
}
