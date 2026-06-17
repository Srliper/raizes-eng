import { Request, Response, NextFunction } from 'express';
import { ConsultarPedidoMulticanalService } from '../services/ConsultarPedidoMulticanalService';

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
