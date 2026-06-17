import { prismaCliente } from '../config/prisma';

export interface EntradaLogAuditoria {
  correlationId: string;
  severidade: string;
  autorId?: string;
  autorTipo: string;
  operacao: string;
  recurso: string;
  recursoId?: string;
  ipOrigem?: string;
  payloadResumo?: Record<string, unknown>;
  lgpdMetadados?: Record<string, unknown>;
}

export class LogAuditoriaRepository {
  async registrar(entrada: EntradaLogAuditoria): Promise<void> {
    await prismaCliente.logAuditoria.create({
      data: {
        correlationId: entrada.correlationId,
        severidade: entrada.severidade,
        autorId: entrada.autorId,
        autorTipo: entrada.autorTipo,
        operacao: entrada.operacao,
        recurso: entrada.recurso,
        recursoId: entrada.recursoId,
        ipOrigem: entrada.ipOrigem,
        payloadResumo: entrada.payloadResumo ?? {},
        lgpdMetadados: entrada.lgpdMetadados ?? {},
      },
    });
  }
}
