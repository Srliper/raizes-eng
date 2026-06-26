import { Request, Response, NextFunction } from 'express';
import { AnonimizarClienteService } from '../services/AnonimizarClienteService';

/**
 * @openapi
 * /api/v1/users/{clientId}/anonymize:
 *   delete:
 *     tags: [LGPD / Privacidade]
 *     summary: Solicitar anonimização de dados do cliente
 *     description: |
 *       Agenda a anonimização irreversível dos dados pessoais (direito ao esquecimento — LGPD Art. 18).
 *       Requer JWT válido com permissão adequada.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 00000000-0000-4000-8000-000000000100
 *       - $ref: '#/components/parameters/CorrelationId'
 *     responses:
 *       202:
 *         description: Anonimização agendada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnonimizacaoResposta'
 *             example:
 *               status: ANONYMIZATION_SCHEDULED
 *               clientId: 00000000-0000-4000-8000-000000000100
 *               conclusaoPrevista: '2026-06-18T12:00:00.000Z'
 *       401:
 *         description: Token JWT ausente ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroApi'
 *       403:
 *         description: Sem permissão para anonimizar este cliente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroApi'
 *       404:
 *         description: Cliente não encontrado
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

export class AnonimizacaoClienteController {
  constructor(private readonly anonimizarService = new AnonimizarClienteService()) {}

  anonimizar = async (
    requisicao: Request,
    resposta: Response,
    proximo: NextFunction,
  ): Promise<void> => {
    try {
      const resultado = await this.anonimizarService.executar({
        clienteId: requisicao.params.clientId,
        solicitanteId: requisicao.usuarioAutenticado?.id ?? 'sistema',
        ipOrigem: requisicao.ip,
        correlationId: requisicao.correlationId,
      });

      resposta.status(202).json(resultado);
    } catch (erro) {
      proximo(erro);
    }
  };
}
