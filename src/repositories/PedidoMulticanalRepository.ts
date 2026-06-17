import { prismaCliente } from '../config/prisma';
import { PedidoMulticanal, Prisma } from '@prisma/client';

export class PedidoMulticanalRepository {
  async buscarPorIdempotencyKey(idempotencyKey: string): Promise<PedidoMulticanal | null> {
    return prismaCliente.pedidoMulticanal.findUnique({
      where: { idempotencyKey },
      include: { itens: true, transacao: true },
    });
  }

  async buscarPorPublicOrderId(publicOrderId: string): Promise<PedidoMulticanal | null> {
    return prismaCliente.pedidoMulticanal.findUnique({
      where: { publicOrderId },
      include: { itens: true, transacao: true, unidade: true },
    });
  }

  async criarComTransacao(
    dadosPedido: Prisma.PedidoMulticanalCreateInput,
    itens: Prisma.ItemDoPedidoCreateWithoutPedidoInput[],
    transacao: Prisma.TransacaoPagamentoCreateWithoutPedidoInput,
  ): Promise<PedidoMulticanal> {
    return prismaCliente.$transaction(async (tx) => {
      const pedido = await tx.pedidoMulticanal.create({
        data: {
          ...dadosPedido,
          itens: { create: itens },
          transacao: { create: transacao },
        },
        include: { itens: true, transacao: true },
      });
      return pedido;
    });
  }

  async atualizarStatus(
    pedidoId: string,
    status: Prisma.PedidoMulticanalUpdateInput['status'],
  ): Promise<PedidoMulticanal> {
    return prismaCliente.pedidoMulticanal.update({
      where: { id: pedidoId },
      data: { status },
    });
  }
}
