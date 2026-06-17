import { prismaCliente } from '../config/prisma';

export interface ProdutoCatalogoUnidade {
  produtoId: string;
  nome: string;
  descricao: string;
  precoRegional: number;
  disponivel: boolean;
  estoque: number;
  tagsRegionais: string[];
  sazonal: boolean;
}

export class CatalogoUnidadeRepository {
  async listarPorUnidade(unidadeId: string): Promise<ProdutoCatalogoUnidade[]> {
    const registros = await prismaCliente.unidadeProduto.findMany({
      where: {
        unidadeId,
        disponivel: true,
        produto: { ativo: true },
      },
      include: { produto: true },
    });

    return registros.map((registro) => ({
      produtoId: registro.produtoId,
      nome: registro.produto.nome,
      descricao: registro.produto.descricao,
      precoRegional: Number(registro.precoRegional),
      disponivel: registro.disponivel,
      estoque: registro.estoque,
      tagsRegionais: registro.produto.tagsRegionais,
      sazonal: registro.produto.sazonal,
    }));
  }

  async validarDisponibilidadeItens(
    unidadeId: string,
    itens: { produtoId: string; quantidade: number }[],
  ): Promise<{ valido: boolean; produtoIndisponivel?: string }> {
    for (const item of itens) {
      const registro = await prismaCliente.unidadeProduto.findUnique({
        where: {
          unidadeId_produtoId: {
            unidadeId,
            produtoId: item.produtoId,
          },
        },
      });

      if (!registro || !registro.disponivel || registro.estoque < item.quantidade) {
        return { valido: false, produtoIndisponivel: item.produtoId };
      }
    }
    return { valido: true };
  }
}
