import { AppError } from '../utils/AppError';
import { ClienteRepository } from '../repositories/ClienteRepository';
import { LogAuditoriaRepository } from '../repositories/LogAuditoriaRepository';
import { AnonimizarClienteEntrada } from '../types/dominio';

/**
 * Anonimização irreversível preserva pedidos históricos — exigência fiscal
 * impede exclusão física de transações já consolidadas.
 */
export class AnonimizarClienteService {
  constructor(
    private readonly clienteRepository = new ClienteRepository(),
    private readonly logAuditoriaRepository = new LogAuditoriaRepository(),
  ) {}

  async executar(entrada: AnonimizarClienteEntrada) {
    const cliente = await this.clienteRepository.buscarPorId(entrada.clienteId);
    if (!cliente) {
      throw new AppError('Cliente não encontrado', 404);
    }

    if (cliente.anonimizado) {
      throw new AppError('Cliente já foi anonimizado', 409);
    }

    await this.logAuditoriaRepository.registrar({
      correlationId: entrada.correlationId,
      severidade: 'INFO',
      autorId: entrada.solicitanteId,
      autorTipo: 'USER',
      operacao: 'ANONYMIZE',
      recurso: 'clientes',
      recursoId: entrada.clienteId,
      ipOrigem: entrada.ipOrigem,
      lgpdMetadados: {
        legalBasis: 'legal_obligation',
        purpose: 'lgpd_compliance',
        containsPII: true,
      },
    });

    await this.clienteRepository.anonimizar(entrada.clienteId);

    return {
      status: 'ANONYMIZATION_SCHEDULED',
      clientId: entrada.clienteId,
      conclusaoPrevista: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }
}
