/*  import { Request, Response, NextFunction } from 'express';
import { ConsultarCatalogoUnidadeService } from '../services/ConsultarCatalogoUnidadeService';

export class CatalogoUnidadeController {
  constructor(
    private readonly catalogoService = new ConsultarCatalogoUnidadeService(),
  ) {}

  consultar = async (
    requisicao: Request,
    resposta: Response,
    proximo: NextFunction,
  ): Promise<void> => {
    try {
      const catalogo = await this.catalogoService.executar(
        requisicao.params.unitId,
        requisicao.correlationId,
      );
      resposta.status(200).json(catalogo);
    } catch (erro) {
      proximo(erro);
    }
  };
}
*/
import { Request, Response, NextFunction } from 'express';

export class CatalogoUnidadeController {
  async consultarCatalogo(
    requisicao: Request,
    resposta: Response,
    proximo: NextFunction,
  ): Promise<void> {
    try {
      const { unitId } = requisicao.params;

      // Resposta temporária (mock) - depois você integra com o service
      resposta.status(200).json({
        success: true,
        data: {
          unidadeId: unitId,
          produtos: [
            {
              produtoId: '00000000-0000-4000-8000-000000000010',
              nome: 'Baião de Dois Regional',
              descricao: 'Prato típico com queijo coalho e bacon',
              precoRegional: 34.90,
              disponivel: true,
              estoque: 50,
            },
          ],
          fromCache: false,
        },
        correlationId: requisicao.correlationId || 'temp-id',
      });
    } catch (erro) {
      proximo(erro);
    }
  }
}