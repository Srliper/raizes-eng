import { Request, Response, NextFunction } from 'express';
import { AnonimizarClienteService } from '../services/AnonimizarClienteService';

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
