import { Request, Response } from 'express';
import { prismaCliente } from '../config/prisma';
import { verificarConexaoRedis } from '../config/redis';

export class SaudeSistemaController {
  health = (_requisicao: Request, resposta: Response): void => {
    const porta = Number(process.env.PORT) || 3000;
    const host = process.env.PUBLIC_HOST ?? 'localhost';

    resposta.status(200).json({
      status: 'ok',
      servico: 'raizes-backend-api',
      porta,
      url: `http://${host}:${porta}`,
      timestamp: new Date().toISOString(),
    });
  };

  ready = async (_requisicao: Request, resposta: Response): Promise<void> => {
    const bancoDisponivel = await prismaCliente.$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false);

    const redisDisponivel = await verificarConexaoRedis();
    const operacional = bancoDisponivel && redisDisponivel;

    resposta.status(operacional ? 200 : 503).json({
      status: operacional ? 'ready' : 'degraded',
      dependencias: {
        postgresql: bancoDisponivel,
        redis: redisDisponivel,
      },
      timestamp: new Date().toISOString(),
    });
  };
}
