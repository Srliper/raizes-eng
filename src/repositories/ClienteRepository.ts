import { prismaCliente } from '../config/prisma';
import { Cliente, ConsentimentoLGPD } from '@prisma/client';

export class ClienteRepository {
  async buscarPorId(clienteId: string): Promise<Cliente | null> {
    return prismaCliente.cliente.findUnique({ where: { id: clienteId } });
  }

  async registrarConsentimento(
    clienteId: string,
    versaoTermo: string,
    aceito: boolean,
    canal: 'APP' | 'TOTEM' | 'BALCAO' | 'WEB',
    finalidades: string[],
  ): Promise<ConsentimentoLGPD> {
    return prismaCliente.$transaction(async (tx) => {
      await tx.cliente.update({
        where: { id: clienteId },
        data: {
          consentimentoAtivo: aceito,
          versaoTermoConsentimento: versaoTermo,
        },
      });

      return tx.consentimentoLGPD.create({
        data: {
          clienteId,
          versaoTermo,
          aceito,
          canal,
          finalidades,
        },
      });
    });
  }

  async anonimizar(clienteId: string): Promise<Cliente> {
    const hashSubstituto = `anon_${Date.now()}`;
    return prismaCliente.cliente.update({
      where: { id: clienteId },
      data: {
        nomeSocial: 'ANONIMIZADO',
        emailMascarado: 'a***@***.com',
        telefoneMascarado: '***-0000',
        cpfHash: hashSubstituto,
        consentimentoAtivo: false,
        anonimizado: true,
      },
    });
  }
}
