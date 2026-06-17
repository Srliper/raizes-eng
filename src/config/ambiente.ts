import dotenv from 'dotenv';

dotenv.config();

function lerBooleano(chave: string, padrao: boolean): boolean {
  const bruto = process.env[chave];
  if (bruto === undefined) return padrao;
  return ['1', 'true', 'yes', 'sim'].includes(bruto.toLowerCase());
}

export const variaveisExecucao = {
  /** 0 = porta aleatória dentro da faixa configurada */
  portaFixa: Number(process.env.PORT ?? 0),
  faixaPortaMinima: Number(process.env.PORT_MIN ?? 3001),
  faixaPortaMaxima: Number(process.env.PORT_MAX ?? 9999),
  totalInstanciasHttp: Math.max(1, Number(process.env.SERVER_INSTANCES ?? 1)),
  usarPortaAleatoria: lerBooleano('USE_RANDOM_PORT', true),
  ambienteNode: process.env.NODE_ENV ?? 'development',
  urlBancoDados: process.env.DATABASE_URL ?? '',
  cacheRedis: {
    endereco: process.env.REDIS_HOST ?? 'localhost',
    porta: Number(process.env.REDIS_PORT ?? 6379),
  },
  credenciaisJwt: {
    segredo: process.env.JWT_SECRET ?? 'dev-secret-alterar-em-producao',
    validade: process.env.JWT_EXPIRES_IN ?? '15m',
  },
  simuladorPagamento: {
    segredoHmac: process.env.MOCK_GATEWAY_HMAC_SECRET ?? 'dev-hmac-secret',
    atrasoRespostaMs: Number(process.env.MOCK_PAYMENT_DELAY_MS ?? 1500),
  },
  ttlCacheCatalogoSegundos: Number(process.env.CATALOG_CACHE_TTL_SECONDS ?? 60),
  limiteRequisicoesPorMinuto: Number(process.env.RATE_LIMIT_MAX_PER_MINUTE ?? 100),
  hostPublico: process.env.PUBLIC_HOST ?? 'localhost',
};

/** Mantém compatibilidade com imports legados do projeto. */
export const configuracaoAmbiente = {
  port: variaveisExecucao.portaFixa,
  nodeEnv: variaveisExecucao.ambienteNode,
  databaseUrl: variaveisExecucao.urlBancoDados,
  redis: {
    host: variaveisExecucao.cacheRedis.endereco,
    port: variaveisExecucao.cacheRedis.porta,
  },
  jwt: {
    secret: variaveisExecucao.credenciaisJwt.segredo,
    expiresIn: variaveisExecucao.credenciaisJwt.validade,
  },
  mockGateway: {
    hmacSecret: variaveisExecucao.simuladorPagamento.segredoHmac,
  },
  catalogCacheTtlSeconds: variaveisExecucao.ttlCacheCatalogoSegundos,
  rateLimitMaxPerMinute: variaveisExecucao.limiteRequisicoesPorMinuto,
};
