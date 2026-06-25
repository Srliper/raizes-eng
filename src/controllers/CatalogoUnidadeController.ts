import { Request, Response, NextFunction } from 'express';
import { ConsultarCatalogoUnidadeService } from '../services/ConsultarCatalogoUnidadeService';

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
