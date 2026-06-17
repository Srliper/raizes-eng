import { prismaCliente } from '../config/prisma';

export class UnidadeFranqueadaRepository {
  async buscarPorId(unidadeId: string) {
    return prismaCliente.unidadeFranqueada.findUnique({ where: { id: unidadeId } });
  }
}
