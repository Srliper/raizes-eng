import { AppError } from '../utils/AppError';
import { ClienteRepository } from '../repositories/ClienteRepository';
import { LogAuditoriaRepository } from '../repositories/LogAuditoriaRepository';
import { RegistrarConsentimentoEntrada } from '../types/dominio';

export class RegistrarConsentimentoLGPDService {
  constructor(
    private readonly clienteRepository = new ClienteRepository(),
    private readonly logAuditoriaRepository = new LogAuditoriaRepository(),
  ) {}

  async executar(entrada: RegistrarConsentimentoEntrada) {
    const cliente = await this.clienteRepository.buscarPorId(entrada.clienteId);
    if (!cliente) {
      throw new AppError('Cliente não encontrado', 404);
    }

    const consentimento = await this.clienteRepository.registrarConsentimento(
      entrada.clienteId,
      entrada.versaoTermo,
      entrada.aceito,
      entrada.canal,
      entrada.finalidades,
    );

    await this.logAuditoriaRepository.registrar({
      correlationId: entrada.correlationId,
      severidade: 'INFO',
      autorId: entrada.clienteId,
      autorTipo: 'USER',
      operacao: entrada.aceito ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
      recurso: 'consentimentos_lgpd',
      recursoId: consentimento.id,
      lgpdMetadados: {
        legalBasis: 'consent',
        purpose: 'lgpd_compliance',
        containsPII: true,
        versaoTermo: entrada.versaoTermo,
      },
    });

    return {
      clienteId: entrada.clienteId,
      versaoTermo: entrada.versaoTermo,
      aceito: entrada.aceito,
      registradoEm: consentimento.registradoEm,
    };
  }
}
