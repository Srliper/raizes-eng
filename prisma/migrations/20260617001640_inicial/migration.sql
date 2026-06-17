-- CreateEnum
CREATE TYPE "CanalAtendimento" AS ENUM ('APP', 'TOTEM', 'BALCAO', 'PICKUP');

-- CreateEnum
CREATE TYPE "StatusPedidoMulticanal" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PAYMENT_FAILED', 'PREPARING', 'READY_FOR_PICKUP', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StatusTransacaoPagamento" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CanalColetaConsentimento" AS ENUM ('APP', 'TOTEM', 'BALCAO', 'WEB');

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nomeSocial" TEXT,
    "cpfHash" TEXT NOT NULL,
    "emailMascarado" TEXT,
    "telefoneMascarado" TEXT,
    "versaoTermoConsentimento" TEXT,
    "consentimentoAtivo" BOOLEAN NOT NULL DEFAULT false,
    "anonimizado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_franqueadas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "regiao" TEXT NOT NULL,
    "aberta" BOOLEAN NOT NULL DEFAULT true,
    "horarioJson" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_franqueadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "precoBase" DECIMAL(10,2) NOT NULL,
    "tagsRegionais" TEXT[],
    "sazonal" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidade_produto" (
    "id" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "precoRegional" DECIMAL(10,2) NOT NULL,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "estoque" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "unidade_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_multicanal" (
    "id" TEXT NOT NULL,
    "publicOrderId" TEXT NOT NULL,
    "clienteId" TEXT,
    "unidadeId" TEXT NOT NULL,
    "canal" "CanalAtendimento" NOT NULL,
    "status" "StatusPedidoMulticanal" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_multicanal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_do_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DECIMAL(10,2) NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "itens_do_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes_pagamento" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "gatewayRef" TEXT NOT NULL,
    "status" "StatusTransacaoPagamento" NOT NULL DEFAULT 'PENDING',
    "valorProcessado" DECIMAL(10,2) NOT NULL,
    "webhookRecebidoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacoes_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentimentos_lgpd" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "versaoTermo" TEXT NOT NULL,
    "aceito" BOOLEAN NOT NULL,
    "canal" "CanalColetaConsentimento" NOT NULL,
    "finalidades" TEXT[],
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consentimentos_lgpd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saldos_fidelizacao" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saldos_fidelizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_fidelizacao" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL,
    "multiplicador" DECIMAL(5,2) NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_fidelizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "severidade" TEXT NOT NULL,
    "autorId" TEXT,
    "autorTipo" TEXT NOT NULL,
    "operacao" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "recursoId" TEXT,
    "ipOrigem" TEXT,
    "payloadResumo" JSONB,
    "lgpdMetadados" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpfHash_key" ON "clientes"("cpfHash");

-- CreateIndex
CREATE INDEX "unidade_produto_unidadeId_idx" ON "unidade_produto"("unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "unidade_produto_unidadeId_produtoId_key" ON "unidade_produto"("unidadeId", "produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_multicanal_publicOrderId_key" ON "pedidos_multicanal"("publicOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_multicanal_idempotencyKey_key" ON "pedidos_multicanal"("idempotencyKey");

-- CreateIndex
CREATE INDEX "pedidos_multicanal_unidadeId_canal_idx" ON "pedidos_multicanal"("unidadeId", "canal");

-- CreateIndex
CREATE INDEX "pedidos_multicanal_clienteId_idx" ON "pedidos_multicanal"("clienteId");

-- CreateIndex
CREATE INDEX "pedidos_multicanal_criadoEm_idx" ON "pedidos_multicanal"("criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "transacoes_pagamento_pedidoId_key" ON "transacoes_pagamento"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "transacoes_pagamento_gatewayRef_key" ON "transacoes_pagamento"("gatewayRef");

-- CreateIndex
CREATE INDEX "transacoes_pagamento_gatewayRef_idx" ON "transacoes_pagamento"("gatewayRef");

-- CreateIndex
CREATE INDEX "consentimentos_lgpd_clienteId_versaoTermo_idx" ON "consentimentos_lgpd"("clienteId", "versaoTermo");

-- CreateIndex
CREATE UNIQUE INDEX "saldos_fidelizacao_clienteId_key" ON "saldos_fidelizacao"("clienteId");

-- CreateIndex
CREATE INDEX "movimentos_fidelizacao_clienteId_expiraEm_idx" ON "movimentos_fidelizacao"("clienteId", "expiraEm");

-- CreateIndex
CREATE INDEX "logs_auditoria_correlationId_idx" ON "logs_auditoria"("correlationId");

-- CreateIndex
CREATE INDEX "logs_auditoria_criadoEm_idx" ON "logs_auditoria"("criadoEm");

-- AddForeignKey
ALTER TABLE "unidade_produto" ADD CONSTRAINT "unidade_produto_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_franqueadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidade_produto" ADD CONSTRAINT "unidade_produto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_multicanal" ADD CONSTRAINT "pedidos_multicanal_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_multicanal" ADD CONSTRAINT "pedidos_multicanal_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_franqueadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_do_pedido" ADD CONSTRAINT "itens_do_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos_multicanal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_do_pedido" ADD CONSTRAINT "itens_do_pedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes_pagamento" ADD CONSTRAINT "transacoes_pagamento_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos_multicanal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimentos_lgpd" ADD CONSTRAINT "consentimentos_lgpd_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saldos_fidelizacao" ADD CONSTRAINT "saldos_fidelizacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_fidelizacao" ADD CONSTRAINT "movimentos_fidelizacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
