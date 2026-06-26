import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RegistrarConsentimentoLGPDService } from '../services/RegistrarConsentimentoLGPDService';

/**
 * @openapi
 * /api/v1/privacy/consent:
 *   post:
 *     tags: [LGPD / Privacidade]
 *     summary: Registrar consentimento LGPD
 *     description: Registra aceite ou recusa do termo de privacidade por canal e finalidade.
 *     parameters:
 *       - $ref: '#/components/parameters/CorrelationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConsentimentoEntrada'
 *           example:
 *             clienteId: 00000000-0000-4000-8000-000000000100
 *             versaoTermo: v2.1-2024-Nordeste
 *             aceito: true
 *             canal: APP
 *             finalidades: [pedidos, fidelizacao]
 *     responses:
 *       201:
 *         description: Consentimento registrado
 *         content:
 *           application/json:
 *             example:
 *               consentimentoId: 00000000-0000-4000-8000-000000000200
 *               clienteId: 00000000-0000-4000-8000-000000000100
 *               versaoTermo: v2.1-2024-Nordeste
 *               aceito: true
 *               registradoEm: '2026-06-17T09:00:00.000Z'
 *       400:
 *         description: Payload inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErroApi'
 *       422:
 *         description: Erro de validação
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

const consentimentoSchema = z.object({
  clienteId: z.string().uuid(),
  versaoTermo: z.string().min(1),
  aceito: z.boolean(),
  canal: z.enum(['APP', 'TOTEM', 'BALCAO', 'WEB']),
  finalidades: z.array(z.string()).min(1),
});

export class ConsentimentoLGPDController {
  constructor(
    private readonly consentimentoService = new RegistrarConsentimentoLGPDService(),
  ) {}

  registrar = async (
    requisicao: Request,
    resposta: Response,
    proximo: NextFunction,
  ): Promise<void> => {
    try {
      const corpo = consentimentoSchema.parse(requisicao.body);
      const resultado = await this.consentimentoService.executar({
        ...corpo,
        correlationId: requisicao.correlationId,
      });
      resposta.status(201).json(resultado);
    } catch (erro) {
      proximo(erro);
    }
  };
}
