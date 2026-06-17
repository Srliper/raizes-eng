import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RegistrarConsentimentoLGPDService } from '../services/RegistrarConsentimentoLGPDService';

const consentimentoSchema = z.object({
  clienteId: z.string().uuid(),
  versaoTermo: z.string().min(1),
  aceito: z.boolean(),
  canal: z.enum(['APP', 'TOTEM', 'BALCAO', 'WEB']),
  finalidades: z.array(z.string()).min(1),
});

export class ConsentimentoLGPDController {
  constructor(
    private readonly consentimentoService = new RegistrarConsentimentoLGPDService(),
  ) {}

  registrar = async (
    requisicao: Request,
    resposta: Response,
    proximo: NextFunction,
  ): Promise<void> => {
    try {
      const corpo = consentimentoSchema.parse(requisicao.body);
      const resultado = await this.consentimentoService.executar({
        ...corpo,
        correlationId: requisicao.correlationId,
      });
      resposta.status(201).json(resultado);
    } catch (erro) {
      proximo(erro);
    }
  };
}
