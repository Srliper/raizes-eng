import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { configuracaoAmbiente } from '../config/ambiente';
import { AppError } from '../utils/AppError';

interface TokenPayload {
  sub: string;
  role: string;
}

export function middlewareAutenticacaoJWT(
  requisicao: Request,
  _resposta: Response,
  proximo: NextFunction,
): void {
  const cabecalho = requisicao.headers.authorization;
  if (!cabecalho?.startsWith('Bearer ')) {
    throw new AppError('Token de autenticação ausente', 401);
  }

  const token = cabecalho.slice(7);
  try {
    const decodificado = jwt.verify(token, configuracaoAmbiente.jwt.secret) as TokenPayload;
    requisicao.usuarioAutenticado = { id: decodificado.sub, role: decodificado.role };
    proximo();
  } catch {
    throw new AppError('Token de autenticação inválido ou expirado', 401);
  }
}
