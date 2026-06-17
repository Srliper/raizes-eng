import { Request, Response, NextFunction } from 'express';
import { ClienteRepository } from '../repositories/ClienteRepository';
import { AppError } from '../utils/AppError';

const clienteRepository = new ClienteRepository();

/**
 * Bloqueia rotas sensíveis sem consentimento ativo — Art. 7º, I da LGPD
 * exige base legal antes de qualquer tratamento de PII.
 */
export function middlewareExigirConsentimentoLGPD(
  campoClienteId: 'clienteId' | 'clientId' = 'clienteId',
) {
  return async (requisicao: Request, _resposta: Response, proximo: NextFunction): Promise<void> => {
    const clienteId =
      (requisicao.body?.[campoClienteId] as string | undefined) ??
      (requisicao.params?.[campoClienteId] as string | undefined);

    if (!clienteId) {
      throw new AppError('Identificador do cliente é obrigatório', 400);
    }

    const cliente = await clienteRepository.buscarPorId(clienteId);
    if (!cliente?.consentimentoAtivo) {
      throw new AppError('Operação não permitida sem consentimento ativo', 403);
    }

    proximo();
  };
}
