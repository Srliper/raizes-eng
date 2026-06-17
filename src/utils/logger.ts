import { sanitizarPayloadParaLog } from './maskPII';

export type SeveridadeLog = 'INFO' | 'WARN' | 'ERROR';

export interface EntradaLogEstruturado {
  correlationId: string;
  severidade: SeveridadeLog;
  mensagem: string;
  servico?: string;
  operacao?: string;
  recurso?: string;
  recursoId?: string;
  autorId?: string;
  autorTipo?: string;
  ipOrigem?: string;
  lgpdMetadados?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}

export function registrarLogEstruturado(entrada: EntradaLogEstruturado): void {
  const registro = {
    correlationId: entrada.correlationId,
    timestamp: new Date().toISOString(),
    severity: entrada.severidade,
    message: entrada.mensagem,
    service: entrada.servico ?? 'raizes-backend-api',
    operation: entrada.operacao,
    resource: entrada.recurso,
    resourceId: entrada.recursoId,
    actor: entrada.autorId
      ? { id: entrada.autorId, type: entrada.autorTipo ?? 'SYSTEM' }
      : { type: entrada.autorTipo ?? 'SYSTEM' },
    ipOrigem: entrada.ipOrigem,
    lgpdCompliance: entrada.lgpdMetadados,
    payload: entrada.payload ? sanitizarPayloadParaLog(entrada.payload) : undefined,
  };

  const saida = JSON.stringify(registro);
  if (entrada.severidade === 'ERROR') {
    console.error(saida);
  } else if (entrada.severidade === 'WARN') {
    console.warn(saida);
  } else {
    console.log(saida);
  }
}
