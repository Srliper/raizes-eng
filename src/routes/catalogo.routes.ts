import { Router, Request, Response } from 'express';

interface ProdutoCatalogoMock {
  produtoId: string;
  nome: string;
  precoRegional: number;
  disponivel: boolean;
}

const rotasCatalogo = Router();

rotasCatalogo.get('/:unitId', (requisicao: Request, resposta: Response): void => {
  const { unitId } = requisicao.params;

  const produtos: ProdutoCatalogoMock[] = [
    {
      produtoId: '00000000-0000-4000-8000-000000000010',
      nome: 'Baião de Dois Regional',
      precoRegional: 34.9,
      disponivel: true,
    },
    {
      produtoId: '00000000-0000-4000-8000-000000000011',
      nome: 'Carne de Sol com Macaxeira',
      precoRegional: 42.5,
      disponivel: true,
    },
    {
      produtoId: '00000000-0000-4000-8000-000000000012',
      nome: 'Tapioca Recheada Especial',
      precoRegional: 18.0,
      disponivel: false,
    },
  ];

  resposta.status(200).json({
    success: true,
    data: {
      unidadeId: unitId,
      produtos,
    },
  });
});

export { rotasCatalogo };
