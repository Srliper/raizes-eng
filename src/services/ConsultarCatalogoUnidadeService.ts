import { obterRedisCliente } from '../config/redis';
import { configuracaoAmbiente } from '../config/ambiente';
import { CatalogoUnidadeRepository } from '../repositories/CatalogoUnidadeRepository';
import { AppError } from '../utils/AppError';

export class ConsultarCatalogoUnidadeService {
  constructor(
    private readonly catalogoRepository = new CatalogoUnidadeRepository(),
    private readonly redis = obterRedisCliente(),
  ) {}

  async executar(unidadeId: string, correlationId: string) {
    const chaveCache = `catalogo:unidade:${unidadeId}`;

    try {
      const cacheado = await this.redis.get(chaveCache);
      if (cacheado) {
        return JSON.parse(cacheado);
      }
    } catch {
      // Cache é acelerador — falha não impede consulta ao banco.
    }

    const catalogo = await this.catalogoRepository.listarPorUnidade(unidadeId);
    if (catalogo.length === 0) {
      throw new AppError('Catálogo não encontrado para a unidade informada', 404);
    }

    const resposta = {
      unidadeId,
      correlationId,
      produtos: catalogo,
      cacheadoEm: new Date().toISOString(),
    };

    try {
      await this.redis.setex(
        chaveCache,
        configuracaoAmbiente.catalogCacheTtlSeconds,
        JSON.stringify(resposta),
      );
    } catch {
      // Falha de cache não bloqueia resposta ao cliente.
    }

    return resposta;
  }
}
