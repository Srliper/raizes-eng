import { Request, Response, NextFunction } from 'express';
import { ConsultarPedidoMulticanalService } from '../services/ConsultarPedidoMulticanalService';

/**
 * @openapi
 * /api/v1/orders/{orderId}:
 *   get:
 *     tags: [Pedidos]
 *     summary: Consultar pedido por ID público
 *     description: Retorna detalhes do pedido, itens e status da transação de pagamento.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador público do pedido (ex. RN-20260617-001)
 *         example: RN-20260617-001
 *       - $ref: '#/components/parameters/CorrelationId'
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *         content:
 *           application/json:
 *             example:
 *               publicOrderId: RN-20260617-001
 *               status: PAID
 *               canal: APP
 *               unidadeId: 00000000-0000-4000-8000-000000000001
 *               valorTotal: 112.3
 *               itens:
 *                 - produtoId: 00000000-0000-4000-8000-000000000010
 *                   quantidade: 2
 *                   precoUnitario: 34.9
 *               transacao:
 *                 gatewayRef: mock-gateway-20260617-001
 *                 status: APPROVED
 *               criadoEm: '2026-06-17T12:00:00.000Z'
 *               atualizadoEm: '2026-06-17T12:05:00.000Z'
 *       404:
 *         description: Pedido não encontrado
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

export class ConsultarPedidoController {
  constructor(
    private readonly consultarPedidoService = new ConsultarPedidoMulticanalService(),
  ) {}

  consultar = async (
    requisicao: Request,
    resposta: Response,
    proximo: NextFunction,
  ): Promise<void> => {
    try {
      const pedido = await this.consultarPedidoService.executar(requisicao.params.orderId);
      resposta.status(200).json(pedido);
    } catch (erro) {
      proximo(erro);
    }
  };
}
