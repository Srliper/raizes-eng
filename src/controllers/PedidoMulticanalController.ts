import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CriarPedidoMulticanalService } from '../services/CriarPedidoMulticanalService';
import { AppError } from '../utils/AppError';

/**
 * @openapi
 * /api/v1/orders:
 *   post:
 *     tags: [Pedidos]
 *     summary: Criar pedido multicanal
 *     description: |
 *       Cria um novo pedido com idempotência via cabeçalho `idempotency-key`.
 *       Quando `clienteId` é informado, exige consentimento LGPD vigente.
 *     parameters:
 *       - $ref: '#/components/parameters/IdempotencyKey'
 *       - $ref: '#/components/parameters/CorrelationId'
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CriarPedidoEntrada'
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PedidoCriadoResposta'
 *             example:
 *               publicOrderId: RN-20260617-002
 *               status: PENDING_PAYMENT
 *               valorTotal: 69.8
 *               canal: APP
 *               unidadeId: 00000000-0000-4000-8000-000000000001
 *       400:
 *         description: Cabeçalho idempotency-key ausente ou payload inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroApi'
 *       403:
 *         description: Consentimento LGPD ausente ou revogado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroApi'
 *       422:
 *         description: Erro de validação Zod
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroApi'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroApi'
 */

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
