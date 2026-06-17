import { PedidoMulticanalRepository } from '../repositories/PedidoMulticanalRepository';
import { AppError } from '../utils/AppError';

export class ConsultarPedidoMulticanalService {
  constructor(private readonly pedidoRepository = new PedidoMulticanalRepository()) {}

  async executar(publicOrderId: string) {
    const pedido = await this.pedidoRepository.buscarPorPublicOrderId(publicOrderId);
    if (!pedido) {
      throw new AppError('Pedido não encontrado', 404);
    }

    return {
      publicOrderId: pedido.publicOrderId,
      status: pedido.status,
      canal: pedido.canal,
      unidadeId: pedido.unidadeId,
      valorTotal: Number(pedido.valorTotal),
      itens: pedido.itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: Number(item.precoUnitario),
      })),
      transacao: pedido.transacao
        ? {
            gatewayRef: pedido.transacao.gatewayRef,
            status: pedido.transacao.status,
          }
        : null,
      criadoEm: pedido.criadoEm,
      atualizadoEm: pedido.atualizadoEm,
    };
  }
}
