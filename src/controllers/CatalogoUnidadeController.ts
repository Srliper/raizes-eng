import { Request, Response, NextFunction } from 'express';
import { ConsultarCatalogoUnidadeService } from '../services/ConsultarCatalogoUnidadeService';

/**
 * @openapi
 * /api/v1/catalog/{unitId}:
 *   get:
 *     tags: [Catálogo]
 *     summary: Consultar cardápio por unidade
 *     description: |
 *       Retorna produtos disponíveis na unidade com preços regionais, estoque e flag sazonal.
 *       Resposta cacheada em Redis por unidade.
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 00000000-0000-4000-8000-000000000001
 *       - $ref: '#/components/parameters/CorrelationId'
 *     responses:
 *       200:
 *         description: Catálogo da unidade
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CatalogoResposta'
 *             example:
 *               success: true
 *               data:
 *                 unidadeId: 00000000-0000-4000-8000-000000000001
 *                 correlationId: f7a3c8e1-4b2d-4f9a-8c3e-1d5a7b9c2e4f
 *                 produtos:
 *                   - produtoId: 00000000-0000-4000-8000-000000000010
 *                     nome: Baião de Dois Regional
 *                     descricao: Arroz, feijão verde e queijo coalho
 *                     precoRegional: 34.9
 *                     disponivel: true
 *                     estoque: 50
 *                     tagsRegionais: [nordeste, tradicional]
 *                     sazonal: false
 *                 cacheadoEm: '2026-06-17T10:00:00.000Z'
 *       404:
 *         description: Unidade não encontrada
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

export class CatalogoUnidadeController {
  constructor(
    private readonly catalogoService = new ConsultarCatalogoUnidadeService(),
  ) {}

  consultarCatalogo = async (
    requisicao: Request,
    resposta: Response,
    proximo: NextFunction,
  ): Promise<void> => {
    try {
      const catalogo = await this.catalogoService.executar(
        requisicao.params.unitId,
        requisicao.correlationId,
      );

      resposta.status(200).json({
        success: true,
        data: catalogo,
      });
    } catch (erro) {
      proximo(erro);
    }
  };
}
