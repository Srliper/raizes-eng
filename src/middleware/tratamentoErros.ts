import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { registrarLogEstruturado } from '../utils/logger';

export function middlewareTratamentoErros(
  erro: unknown,
  requisicao: Request,
  resposta: Response,
  _proximo: NextFunction,
): void {
  const correlationId = requisicao.correlationId ?? 'sem-correlation-id';

  if (erro instanceof AppError) {
    registrarLogEstruturado({
      correlationId,
      severidade: erro.statusCode >= 500 ? 'ERROR' : 'WARN',
      mensagem: erro.message,
      operacao: 'HTTP_ERROR',
    });

    resposta.status(erro.statusCode).json({
      erro: erro.message,
      correlationId,
    });
    return;
  }

  if (erro instanceof ZodError) {
    resposta.status(422).json({
      erro: 'Payload inválido',
      detalhes: erro.flatten().fieldErrors,
      correlationId,
    });
    return;
  }

  registrarLogEstruturado({
    correlationId,
    severidade: 'ERROR',
    mensagem: 'Erro interno não tratado',
    operacao: 'UNHANDLED_ERROR',
  });

  resposta.status(500).json({
    erro: 'Erro interno do servidor',
    correlationId,
  });
}
