import Redis from 'ioredis';
import { configuracaoAmbiente } from './ambiente';

let redisCliente: Redis | null = null;

export function obterRedisCliente(): Redis {
  if (!redisCliente) {
    redisCliente = new Redis({
      host: configuracaoAmbiente.redis.host,
      port: configuracaoAmbiente.redis.port,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redisCliente;
}

export async function verificarConexaoRedis(): Promise<boolean> {
  try {
    const cliente = obterRedisCliente();
    if (cliente.status !== 'ready') {
      await cliente.connect();
    }
    const resposta = await cliente.ping();
    return resposta === 'PONG';
  } catch {
    return false;
  }
}
