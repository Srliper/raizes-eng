import {
  PrismaClient,
  CanalColetaConsentimento,
  CanalAtendimento,
  StatusPedidoMulticanal,
  StatusTransacaoPagamento,
} from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const ID_UNIDADE = '00000000-0000-4000-8000-000000000001';
const ID_CLIENTE = '00000000-0000-4000-8000-000000000100';
const ID_CONSENTIMENTO = '00000000-0000-4000-8000-000000000200';
const ID_LOG_AUDITORIA = '00000000-0000-4000-8000-000000000300';
const ID_PEDIDO = '00000000-0000-4000-8000-000000000400';
const ID_TRANSACAO = '00000000-0000-4000-8000-000000000401';
const ID_ITEM_PEDIDO_1 = '00000000-0000-4000-8000-000000000410';
const ID_ITEM_PEDIDO_2 = '00000000-0000-4000-8000-000000000411';
const ID_MOVIMENTO_FIDELIZACAO = '00000000-0000-4000-8000-000000000420';
const ID_SALDO_FIDELIZACAO = '00000000-0000-4000-8000-000000000421';

const PUBLIC_ORDER_ID = 'RN-20260617-001';
const GATEWAY_REF = 'mock-gateway-20260617-001';
const IDEMPOTENCY_KEY_PEDIDO = 'seed-pedido-rn-20260617-001';
const VALOR_TOTAL_PEDIDO = 112.3;
const PONTOS_FIDELIZACAO = 112;

const VERSAO_TERMO = 'v2.1-2024-Nordeste';
const CORRELATION_ID_SEED = 'seed-complementar-raizes-nordeste';

interface ProdutoRegionalSeed {
  id: string;
  nome: string;
  descricao: string;
  precoBase: number;
  precoRegional: number;
  tagsRegionais: string[];
  estoque: number;
}

const PRODUTOS_REGIONAIS: ProdutoRegionalSeed[] = [
  {
    id: '00000000-0000-4000-8000-000000000011',
    nome: 'Carne de Sol com Macaxeira',
    descricao: 'Clássico nordestino com macaxeira frita e manteiga de garrafa',
    precoBase: 40.0,
    precoRegional: 42.5,
    tagsRegionais: ['nordeste', 'carne-de-sol', 'tradicional'],
    estoque: 35,
  },
  {
    id: '00000000-0000-4000-8000-000000000012',
    nome: 'Tapioca Recheada Especial',
    descricao: 'Tapioca artesanal com queijo coalho e carne do sol desfiada',
    precoBase: 16.0,
    precoRegional: 18.0,
    tagsRegionais: ['nordeste', 'tapioca', 'lanche'],
    estoque: 60,
  },
  {
    id: '00000000-0000-4000-8000-000000000013',
    nome: 'Cuscuz Nordestino Tradicional',
    descricao: 'Cuscuz de milho servido com ovos, queijo e manteiga',
    precoBase: 14.0,
    precoRegional: 15.0,
    tagsRegionais: ['nordeste', 'cuscuz', 'cafeteria'],
    estoque: 45,
  },
  {
    id: '00000000-0000-4000-8000-000000000014',
    nome: 'Mousse de Maracujá da Caatinga',
    descricao: 'Sobremesa cremosa com fruta da região semiárida',
    precoBase: 11.0,
    precoRegional: 12.0,
    tagsRegionais: ['nordeste', 'sobremesa', 'sazonal'],
    estoque: 28,
  },
  {
    id: '00000000-0000-4000-8000-000000000015',
    nome: 'Caldo de Sururu',
    descricao: 'Caldo de sururu com temperos regionais e coentro fresco',
    precoBase: 20.0,
    precoRegional: 22.0,
    tagsRegionais: ['nordeste', 'frutos-do-mar', 'inverno'],
    estoque: 22,
  },
];

async function validarDependencias(): Promise<void> {
  const [cliente, unidade] = await Promise.all([
    prisma.cliente.findUnique({ where: { id: ID_CLIENTE } }),
    prisma.unidadeFranqueada.findUnique({ where: { id: ID_UNIDADE } }),
  ]);

  if (!cliente) {
    throw new Error(
      `Cliente ${ID_CLIENTE} não encontrado. Execute antes: npx tsx prisma/seed.ts`,
    );
  }

  if (!unidade) {
    throw new Error(
      `Unidade ${ID_UNIDADE} não encontrada. Execute antes: npx tsx prisma/seed.ts`,
    );
  }
}

async function semearConsentimentoLGPD(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.consentimentoLGPD.upsert({
      where: { id: ID_CONSENTIMENTO },
      update: {
        versaoTermo: VERSAO_TERMO,
        aceito: true,
        canal: CanalColetaConsentimento.APP,
        finalidades: ['pedidos', 'fidelizacao'],
        registradoEm: new Date(),
      },
      create: {
        id: ID_CONSENTIMENTO,
        clienteId: ID_CLIENTE,
        versaoTermo: VERSAO_TERMO,
        aceito: true,
        canal: CanalColetaConsentimento.APP,
        finalidades: ['pedidos', 'fidelizacao'],
        registradoEm: new Date(),
      },
    });

    await tx.cliente.update({
      where: { id: ID_CLIENTE },
      data: {
        consentimentoAtivo: true,
        versaoTermoConsentimento: VERSAO_TERMO,
      },
    });
  });
}

async function semearProdutosEVinculos(): Promise<number> {
  let vinculosCriados = 0;

  for (const produto of PRODUTOS_REGIONAIS) {
    await prisma.produto.upsert({
      where: { id: produto.id },
      update: {
        nome: produto.nome,
        descricao: produto.descricao,
        precoBase: produto.precoBase,
        tagsRegionais: produto.tagsRegionais,
        ativo: true,
      },
      create: {
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao,
        precoBase: produto.precoBase,
        tagsRegionais: produto.tagsRegionais,
        sazonal: produto.tagsRegionais.includes('sazonal'),
        ativo: true,
      },
    });

    await prisma.unidadeProduto.upsert({
      where: {
        unidadeId_produtoId: {
          unidadeId: ID_UNIDADE,
          produtoId: produto.id,
        },
      },
      update: {
        precoRegional: produto.precoRegional,
        disponivel: true,
        estoque: produto.estoque,
      },
      create: {
        unidadeId: ID_UNIDADE,
        produtoId: produto.id,
        precoRegional: produto.precoRegional,
        disponivel: true,
        estoque: produto.estoque,
      },
    });

    vinculosCriados += 1;
  }

  // Garante vínculo do produto base já existente no seed principal
  const produtoBase = await prisma.produto.findUnique({
    where: { id: '00000000-0000-4000-8000-000000000010' },
  });

  if (produtoBase) {
    await prisma.unidadeProduto.upsert({
      where: {
        unidadeId_produtoId: {
          unidadeId: ID_UNIDADE,
          produtoId: produtoBase.id,
        },
      },
      update: { disponivel: true, estoque: 50 },
      create: {
        unidadeId: ID_UNIDADE,
        produtoId: produtoBase.id,
        precoRegional: 34.9,
        disponivel: true,
        estoque: 50,
      },
    });
    vinculosCriados += 1;
  }

  return vinculosCriados;
}

async function semearPedidoItensTransacaoEFidelizacao(): Promise<void> {
  const agora = new Date();
  const expiraEmFidelizacao = new Date(agora);
  expiraEmFidelizacao.setFullYear(expiraEmFidelizacao.getFullYear() + 1);

  await prisma.$transaction(async (tx) => {
    const pedido = await tx.pedidoMulticanal.upsert({
      where: { publicOrderId: PUBLIC_ORDER_ID },
      update: {
        clienteId: ID_CLIENTE,
        unidadeId: ID_UNIDADE,
        canal: CanalAtendimento.APP,
        status: StatusPedidoMulticanal.PAID,
        valorTotal: VALOR_TOTAL_PEDIDO,
        correlationId: CORRELATION_ID_SEED,
        criadoEm: agora,
        atualizadoEm: agora,
      },
      create: {
        id: ID_PEDIDO,
        publicOrderId: PUBLIC_ORDER_ID,
        clienteId: ID_CLIENTE,
        unidadeId: ID_UNIDADE,
        canal: CanalAtendimento.APP,
        status: StatusPedidoMulticanal.PAID,
        valorTotal: VALOR_TOTAL_PEDIDO,
        idempotencyKey: IDEMPOTENCY_KEY_PEDIDO,
        correlationId: CORRELATION_ID_SEED,
        criadoEm: agora,
        atualizadoEm: agora,
      },
    });

    await tx.itemDoPedido.deleteMany({ where: { pedidoId: pedido.id } });

    await tx.itemDoPedido.createMany({
      data: [
        {
          id: ID_ITEM_PEDIDO_1,
          pedidoId: pedido.id,
          produtoId: '00000000-0000-4000-8000-000000000010',
          quantidade: 2,
          precoUnitario: 34.9,
        },
        {
          id: ID_ITEM_PEDIDO_2,
          pedidoId: pedido.id,
          produtoId: '00000000-0000-4000-8000-000000000011',
          quantidade: 1,
          precoUnitario: 42.5,
        },
      ],
    });

    await tx.transacaoPagamento.upsert({
      where: { pedidoId: pedido.id },
      update: {
        gatewayRef: GATEWAY_REF,
        status: StatusTransacaoPagamento.APPROVED,
        valorProcessado: VALOR_TOTAL_PEDIDO,
        webhookRecebidoEm: agora,
        atualizadoEm: agora,
      },
      create: {
        id: ID_TRANSACAO,
        pedidoId: pedido.id,
        gatewayRef: GATEWAY_REF,
        status: StatusTransacaoPagamento.APPROVED,
        valorProcessado: VALOR_TOTAL_PEDIDO,
        webhookRecebidoEm: agora,
        criadoEm: agora,
        atualizadoEm: agora,
      },
    });

    await tx.movimentoFidelizacao.upsert({
      where: { id: ID_MOVIMENTO_FIDELIZACAO },
      update: {
        clienteId: ID_CLIENTE,
        tipo: 'ACUMULO',
        pontos: PONTOS_FIDELIZACAO,
        multiplicador: 1.0,
        expiraEm: expiraEmFidelizacao,
        motivo: `PEDIDO_${PUBLIC_ORDER_ID}`,
        criadoEm: agora,
      },
      create: {
        id: ID_MOVIMENTO_FIDELIZACAO,
        clienteId: ID_CLIENTE,
        tipo: 'ACUMULO',
        pontos: PONTOS_FIDELIZACAO,
        multiplicador: 1.0,
        expiraEm: expiraEmFidelizacao,
        motivo: `PEDIDO_${PUBLIC_ORDER_ID}`,
        criadoEm: agora,
      },
    });

    await tx.saldoFidelizacao.upsert({
      where: { clienteId: ID_CLIENTE },
      update: {
        pontos: PONTOS_FIDELIZACAO,
        atualizadoEm: agora,
      },
      create: {
        id: ID_SALDO_FIDELIZACAO,
        clienteId: ID_CLIENTE,
        pontos: PONTOS_FIDELIZACAO,
        atualizadoEm: agora,
      },
    });
  });
}

async function validarPedidoEFidelizacao(): Promise<void> {
  const pedido = await prisma.pedidoMulticanal.findUnique({
    where: { publicOrderId: PUBLIC_ORDER_ID },
    include: {
      itens: true,
      transacao: true,
    },
  });

  if (!pedido) {
    throw new Error('Falha na validação: PedidoMulticanal não foi persistido.');
  }

  if (pedido.itens.length !== 2) {
    throw new Error(`Falha na validação: esperados 2 itens, encontrados ${pedido.itens.length}.`);
  }

  const somaItens = pedido.itens.reduce(
    (acumulado, item) => acumulado + Number(item.precoUnitario) * item.quantidade,
    0,
  );

  if (Math.abs(somaItens - VALOR_TOTAL_PEDIDO) > 0.001) {
    throw new Error(
      `Falha na validação: soma dos itens (${somaItens}) difere do valorTotal (${VALOR_TOTAL_PEDIDO}).`,
    );
  }

  if (!pedido.transacao) {
    throw new Error('Falha na validação: TransacaoPagamento não vinculada ao pedido.');
  }

  if (Number(pedido.transacao.valorProcessado) !== VALOR_TOTAL_PEDIDO) {
    throw new Error('Falha na validação: valor da transação não confere com o pedido.');
  }

  const saldo = await prisma.saldoFidelizacao.findUnique({
    where: { clienteId: ID_CLIENTE },
  });

  if (!saldo || saldo.pontos !== PONTOS_FIDELIZACAO) {
    throw new Error('Falha na validação: SaldoFidelizacao incorreto.');
  }

  console.log('✅ Pedido e fidelização validados:', {
    publicOrderId: pedido.publicOrderId,
    status: pedido.status,
    valorTotal: Number(pedido.valorTotal),
    itens: pedido.itens.length,
    gatewayRef: pedido.transacao.gatewayRef,
    statusPagamento: pedido.transacao.status,
    saldoPontos: saldo.pontos,
  });
}

async function semearLogAuditoria(): Promise<void> {
  await prisma.logAuditoria.upsert({
    where: { id: ID_LOG_AUDITORIA },
    update: {
      correlationId: CORRELATION_ID_SEED,
      severidade: 'INFO',
      autorId: ID_CLIENTE,
      autorTipo: 'SYSTEM',
      operacao: 'SEED_COMPLEMENTAR',
      recurso: 'consentimentos_lgpd',
      recursoId: ID_CONSENTIMENTO,
      payloadResumo: {
        origem: 'prisma/seed-complementar.ts',
        descricao: 'Carga complementar para evidências LGPD e catálogo regional',
      },
      lgpdMetadados: {
        legalBasis: 'consent',
        purpose: 'lgpd_compliance',
        containsPII: true,
        versaoTermo: VERSAO_TERMO,
        finalidades: ['pedidos', 'fidelizacao'],
      },
      criadoEm: new Date(),
    },
    create: {
      id: ID_LOG_AUDITORIA,
      correlationId: CORRELATION_ID_SEED,
      severidade: 'INFO',
      autorId: ID_CLIENTE,
      autorTipo: 'SYSTEM',
      operacao: 'SEED_COMPLEMENTAR',
      recurso: 'consentimentos_lgpd',
      recursoId: ID_CONSENTIMENTO,
      payloadResumo: {
        origem: 'prisma/seed-complementar.ts',
        descricao: 'Carga complementar para evidências LGPD e catálogo regional',
      },
      lgpdMetadados: {
        legalBasis: 'consent',
        purpose: 'lgpd_compliance',
        containsPII: true,
        versaoTermo: VERSAO_TERMO,
        finalidades: ['pedidos', 'fidelizacao'],
      },
      criadoEm: new Date(),
    },
  });
}

async function validarConsentimentoCriado(): Promise<void> {
  const consentimento = await prisma.consentimentoLGPD.findFirst({
    where: {
      clienteId: ID_CLIENTE,
      versaoTermo: VERSAO_TERMO,
      aceito: true,
    },
  });

  if (!consentimento) {
    throw new Error('Falha na validação: ConsentimentoLGPD não foi persistido.');
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: ID_CLIENTE } });

  if (!cliente?.consentimentoAtivo) {
    throw new Error('Falha na validação: cliente.consentimentoAtivo permanece false.');
  }

  console.log('✅ Consentimento LGPD validado:', {
    consentimentoId: consentimento.id,
    clienteId: consentimento.clienteId,
    versaoTermo: consentimento.versaoTermo,
    canal: consentimento.canal,
    finalidades: consentimento.finalidades,
    consentimentoAtivo: cliente.consentimentoAtivo,
  });
}

async function main(): Promise<void> {
  console.log('🌱 Iniciando seed complementar — Raízes do Nordeste...\n');

  await validarDependencias();
  await semearConsentimentoLGPD();
  const totalVinculos = await semearProdutosEVinculos();
  await semearPedidoItensTransacaoEFidelizacao();
  await semearLogAuditoria();
  await validarConsentimentoCriado();
  await validarPedidoEFidelizacao();

  const resumo = await prisma.$transaction([
    prisma.consentimentoLGPD.count(),
    prisma.produto.count(),
    prisma.unidadeProduto.count({ where: { unidadeId: ID_UNIDADE } }),
    prisma.logAuditoria.count(),
    prisma.pedidoMulticanal.count(),
    prisma.itemDoPedido.count(),
    prisma.transacaoPagamento.count(),
    prisma.movimentoFidelizacao.count(),
    prisma.saldoFidelizacao.count(),
  ]);

  console.log('\n📊 Resumo pós-seed:');
  console.log(`   ConsentimentoLGPD:   ${resumo[0]} registro(s)`);
  console.log(`   Produto:             ${resumo[1]} registro(s)`);
  console.log(`   UnidadeProduto:      ${resumo[2]} registro(s) na unidade`);
  console.log(`   LogAuditoria:        ${resumo[3]} registro(s)`);
  console.log(`   PedidoMulticanal:    ${resumo[4]} registro(s)`);
  console.log(`   ItemDoPedido:        ${resumo[5]} registro(s)`);
  console.log(`   TransacaoPagamento:  ${resumo[6]} registro(s)`);
  console.log(`   MovimentoFidelizacao:${resumo[7]} registro(s)`);
  console.log(`   SaldoFidelizacao:    ${resumo[8]} registro(s)`);
  console.log(`   Vínculos processados nesta execução: ${totalVinculos}`);
  console.log(`\n🔑 correlationId de auditoria: ${CORRELATION_ID_SEED}`);
  console.log(`🆔 trace auxiliar: ${randomUUID()}`);
  console.log('\n✅ Seed complementar concluído com sucesso.');
}

main()
  .catch((erro) => {
    console.error('❌ Erro no seed complementar:', erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
