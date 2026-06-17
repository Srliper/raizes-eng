import { Request, Response, NextFunction } from 'express';
import { obterCorrelationId, CABECALHO_CORRELACAO } from '../utils/correlationId';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      usuarioAutenticado?: { id: string; role: string };
    }
  }
}

export function middlewareCorrelationId(
  requisicao: Request,
  resposta: Response,
  proximo: NextFunction,
): void {
  const correlationId = obterCorrelationId(requisicao);
  requisicao.correlationId = correlationId;
  resposta.setHeader(CABECALHO_CORRELACAO, correlationId);
  proximo();
}
