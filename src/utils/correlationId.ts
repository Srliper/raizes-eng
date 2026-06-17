import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

const CABECALHO_CORRELACAO = 'x-correlation-id';

export function obterCorrelationId(requisicao: Request): string {
  const cabecalho = requisicao.headers[CABECALHO_CORRELACAO];
  if (typeof cabecalho === 'string' && cabecalho.trim().length > 0) {
    return cabecalho;
  }
  return uuidv4();
}

export { CABECALHO_CORRELACAO };
