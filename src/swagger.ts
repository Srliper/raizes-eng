import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import glob from 'glob';

const portaApi = Number(process.env.PORT) || 3210;
const hostApi = process.env.PUBLIC_HOST ?? 'localhost';

const arquivosDocumentacao = [
  ...glob.sync(path.join(__dirname, 'controllers', '*.ts')),
  ...glob.sync(path.join(__dirname, 'controllers', '*.js')),
  path.join(__dirname, 'routes', 'saude.routes.ts'),
  path.join(__dirname, 'routes', 'saude.routes.js'),
].filter((arquivo, indice, lista) => lista.indexOf(arquivo) === indice);

const opcoesSwagger: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Raízes do Nordeste — API REST',
      version: '1.0.0',
      description:
        'API multicanal (APP, TOTEM, BALCÃO, PICKUP, WEB) para a franquia alimentícia Raízes do Nordeste. ' +
        'Inclui orquestração de pedidos, catálogo regional, pagamentos mock assíncronos e conformidade LGPD.',
      contact: {
        name: 'Luís Fernando Bedim',
        email: 'luis.bedim@uninter.edu.br',
      },
    },
    servers: [
      {
        url: `http://${hostApi}:${portaApi}`,
        description: 'Ambiente local de desenvolvimento',
      },
    ],
    tags: [
      { name: 'Health Check', description: 'Monitoramento e readiness da API' },
      { name: 'Pedidos', description: 'Criação e consulta de pedidos multicanal' },
      { name: 'Catálogo', description: 'Cardápio por unidade franqueada' },
      { name: 'Pagamentos', description: 'Webhooks do gateway mock' },
      { name: 'LGPD / Privacidade', description: 'Consentimento e anonimização' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido em POST /api/v1/dev/token (ambiente de desenvolvimento)',
        },
      },
      parameters: {
        CorrelationId: {
          in: 'header',
          name: 'x-correlation-id',
          schema: { type: 'string', format: 'uuid' },
          description: 'Identificador de rastreabilidade ponta a ponta',
          example: 'f7a3c8e1-4b2d-4f9a-8c3e-1d5a7b9c2e4f',
        },
        IdempotencyKey: {
          in: 'header',
          name: 'idempotency-key',
          required: true,
          schema: { type: 'string' },
          description: 'Chave única para evitar pedidos duplicados em retries',
          example: 'postman-pedido-001',
        },
      },
      schemas: {
        ErroApi: {
          type: 'object',
          properties: {
            erro: { type: 'string', example: 'Mensagem de erro operacional' },
            correlationId: { type: 'string', format: 'uuid' },
            detalhes: { type: 'object' },
          },
        },
        ItemPedidoEntrada: {
          type: 'object',
          required: ['produtoId', 'quantidade'],
          properties: {
            produtoId: {
              type: 'string',
              format: 'uuid',
              example: '00000000-0000-4000-8000-000000000010',
            },
            quantidade: { type: 'integer', minimum: 1, example: 2 },
            observacoes: { type: 'string', example: 'Sem pimenta' },
          },
        },
        CriarPedidoEntrada: {
          type: 'object',
          required: ['unidadeId', 'canal', 'itens'],
          properties: {
            unidadeId: {
              type: 'string',
              format: 'uuid',
              example: '00000000-0000-4000-8000-000000000001',
            },
            canal: {
              type: 'string',
              enum: ['APP', 'TOTEM', 'BALCAO', 'PICKUP'],
              example: 'APP',
            },
            clienteId: {
              type: 'string',
              format: 'uuid',
              example: '00000000-0000-4000-8000-000000000100',
            },
            itens: {
              type: 'array',
              items: { $ref: '#/components/schemas/ItemPedidoEntrada' },
            },
          },
          example: {
            unidadeId: '00000000-0000-4000-8000-000000000001',
            canal: 'APP',
            clienteId: '00000000-0000-4000-8000-000000000100',
            itens: [
              { produtoId: '00000000-0000-4000-8000-000000000010', quantidade: 2 },
              { produtoId: '00000000-0000-4000-8000-000000000011', quantidade: 1 },
            ],
          },
        },
        PedidoCriadoResposta: {
          type: 'object',
          properties: {
            publicOrderId: { type: 'string', example: 'RN-20260617-001' },
            status: { type: 'string', example: 'PENDING_PAYMENT' },
            valorTotal: { type: 'number', example: 112.3 },
            canal: { type: 'string', example: 'APP' },
            unidadeId: { type: 'string', format: 'uuid' },
          },
        },
        ProdutoCatalogo: {
          type: 'object',
          properties: {
            produtoId: { type: 'string', format: 'uuid' },
            nome: { type: 'string', example: 'Baião de Dois Regional' },
            descricao: { type: 'string' },
            precoRegional: { type: 'number', example: 34.9 },
            disponivel: { type: 'boolean' },
            estoque: { type: 'integer' },
            tagsRegionais: { type: 'array', items: { type: 'string' } },
            sazonal: { type: 'boolean' },
          },
        },
        CatalogoResposta: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                unidadeId: { type: 'string', format: 'uuid' },
                correlationId: { type: 'string' },
                produtos: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ProdutoCatalogo' },
                },
                cacheadoEm: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        WebhookPagamentoEntrada: {
          type: 'object',
          required: ['gatewayRef', 'status', 'assinatura'],
          properties: {
            gatewayRef: { type: 'string', example: 'mock-gateway-20260617-001' },
            status: { type: 'string', enum: ['APPROVED', 'REJECTED'], example: 'APPROVED' },
            assinatura: { type: 'string', description: 'HMAC-SHA256 do gateway' },
          },
        },
        ConsentimentoEntrada: {
          type: 'object',
          required: ['clienteId', 'versaoTermo', 'aceito', 'canal', 'finalidades'],
          properties: {
            clienteId: { type: 'string', format: 'uuid' },
            versaoTermo: { type: 'string', example: 'v2.1-2024-Nordeste' },
            aceito: { type: 'boolean', example: true },
            canal: { type: 'string', enum: ['APP', 'TOTEM', 'BALCAO', 'WEB'] },
            finalidades: {
              type: 'array',
              items: { type: 'string' },
              example: ['pedidos', 'fidelizacao'],
            },
          },
        },
        AnonimizacaoResposta: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ANONYMIZATION_SCHEDULED' },
            clientId: { type: 'string', format: 'uuid' },
            conclusaoPrevista: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: arquivosDocumentacao,
};

export const swaggerSpec = swaggerJsdoc(opcoesSwagger);

export const middlewareSwaggerUi = swaggerUi.serve;

export function configurarSwaggerUi() {
  return swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Raízes do Nordeste — API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });
}
