import { PrismaClient } from '@prisma/client';
import { gerarHashIrreversivel } from '../src/utils/criptografia';

const prisma = new PrismaClient();

async function main() {
  const unidade = await prisma.unidadeFranqueada.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      nome: 'Raízes Recife — Boa Viagem',
      regiao: 'Nordeste',
      aberta: true,
      horarioJson: { abertura: '10:00', fechamento: '22:00' },
    },
  });

  const produto = await prisma.produto.upsert({
    where: { id: '00000000-0000-4000-8000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000010',
      nome: 'Baião de Dois Regional',
      descricao: 'Prato típico com queijo coalho e bacon',
      precoBase: 32.9,
      tagsRegionais: ['nordeste', 'tradicional'],
      sazonal: false,
    },
  });

  await prisma.unidadeProduto.upsert({
    where: {
      unidadeId_produtoId: {
        unidadeId: unidade.id,
        produtoId: produto.id,
      },
    },
    update: { estoque: 50, disponivel: true },
    create: {
      unidadeId: unidade.id,
      produtoId: produto.id,
      precoRegional: 34.9,
      disponivel: true,
      estoque: 50,
    },
  });

  const cliente = await prisma.cliente.upsert({
    where: { id: '00000000-0000-4000-8000-000000000100' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000100',
      nomeSocial: 'Cliente Demo',
      cpfHash: gerarHashIrreversivel('12345678901'),
      emailMascarado: 'c***@***.com',
      consentimentoAtivo: true,
      versaoTermoConsentimento: 'v2.1-2024-Nordeste',
    },
  });

  console.log('Seed concluído:', { unidade: unidade.nome, produto: produto.nome, cliente: cliente.id });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
