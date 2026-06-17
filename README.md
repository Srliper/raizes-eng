# Raízes do Nordeste — Backend API

API REST multicanal para a rede franqueada **Raízes do Nordeste**, desenvolvida como Projeto Multidisciplinar — Trilha Engenharia de Software.

**Aluno:** Luís Fernando Bedim — RA 4555952

## Stack

- Node.js 18+ · TypeScript · Express
- PostgreSQL · Prisma ORM
- Redis (ioredis) — cache de catálogo e rate limiting
- Jest — testes unitários e LGPD

## Arquitetura

```
Controllers  →  HTTP (req/res, validação Zod)
Services     →  Regras de negócio (idempotência, LGPD, pagamento mock)
Repositories →  Acesso a dados via Prisma
```

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/v1/orders` | Cria pedido multicanal (requer `idempotency-key`) |
| `GET` | `/api/v1/orders/:orderId` | Consulta status do pedido |
| `POST` | `/api/v1/payments/webhook` | Callback assíncrono do mock de pagamento |
| `GET` | `/api/v1/catalog/:unitId` | Cardápio por unidade (cache Redis) |
| `POST` | `/api/v1/privacy/consent` | Registro de consentimento LGPD |
| `DELETE` | `/api/v1/users/:clientId/anonymize` | Anonimização irreversível (JWT) |
| `GET` | `/health` | Health check |
| `GET` | `/ready` | Readiness (PostgreSQL + Redis) |

## Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm ou yarn

## Instalação

```bash
git clone https://github.com/Srliper/raizes-eng.git
cd raizes-backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
npm run dev
```

Servidor disponível em `http://localhost:3000`.

## Exemplo — criar pedido

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "idempotency-key: pedido-demo-001" \
  -H "x-correlation-id: corr-demo-001" \
  -d '{
    "unidadeId": "00000000-0000-4000-8000-000000000001",
    "canal": "APP",
    "clienteId": "00000000-0000-4000-8000-000000000100",
    "itens": [
      { "produtoId": "00000000-0000-4000-8000-000000000010", "quantidade": 2 }
    ]
  }'
```

## Testes

```bash
npm test           # todos os testes + cobertura
npm run test:lgpd  # suíte LGPD (maskPII, AppError)
```

## Conformidade LGPD

- `maskPII` — ofusca CPF, e-mail e telefone em logs
- Consentimento versionado com bloqueio via middleware
- Anonimização irreversível preservando histórico transacional
- Logs de auditoria com `correlationId` e metadados `lgpdCompliance`

## Publicar no GitHub

```bash
cd raizes-backend
git init
git add .
git commit -m "feat: backend Raízes do Nordeste — API multicanal com LGPD"
git branch -M main
git remote add origin https://github.com/Srliper/raizes-eng.git
git push -u origin main
```

## Estrutura do projeto

```
raizes-backend/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   └── config/
├── prisma/
├── tests/
└── README.md
```

## Licença

MIT — Projeto acadêmico UNIP / Engenharia de Software.
