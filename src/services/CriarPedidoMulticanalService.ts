import { AppError } from '../utils/AppError';
import { registrarLogEstruturado } from '../utils/logger';
import { PedidoMulticanalRepository } from '../repositories/PedidoMulticanalRepository';
import { CatalogoUnidadeRepository } from '../repositories/CatalogoUnidadeRepository';
import { UnidadeFranqueadaRepository } from '../repositories/UnidadeFranqueadaRepository';
import { LogAuditoriaRepository } from '../repositories/LogAuditoriaRepository';
import { ClienteRepository } from '../repositories/ClienteRepository';
import { CriarPedidoMulticanalEntrada, PedidoMulticanalResposta } from '../types/dominio';
import { GatewayPagamentoMockService } from './GatewayPagamentoMockService';
import { StatusPedidoMulticanal } from '@prisma/client';

export class CriarPedidoMulticanalService {
  constructor(
    private readonly pedidoRepository = new PedidoMulticanalRepository(),
    private readonly catalogoRepository = new CatalogoUnidadeRepository(),
    private readonly unidadeRepository = new UnidadeFranqueadaRepository(),
    private readonly logAuditoriaRepository = new LogAuditoriaRepository(),
    private readonly clienteRepository = new ClienteRepository(),
    private readonly gatewayMockService = new GatewayPagamentoMockService(),
  ) {}

  async executar(entrada: CriarPedidoMulticanalEntrada): Promise<PedidoMulticanalResposta> {
    const pedidoExistente = await this.pedidoRepository.buscarPorIdempotencyKey(
      entrada.idempotencyKey,
    );

    if (pedidoExistente) {
      return this.mapearResposta(pedidoExistente);
    }

    const unidade = await this.unidadeRepository.buscarPorId(entrada.unidadeId);
    if (!unidade || !unidade.aberta) {
      throw new AppError('Unidade franqueada indisponível para pedidos', 422);
    }

    if (entrada.clienteId) {
      const cliente = await this.clienteRepository.buscarPorId(entrada.clienteId);
      if (!cliente?.consentimentoAtivo) {
        throw new AppError('Consentimento LGPD necessário para processar pedido', 403);
      }
    }

    const validacaoEstoque = await this.catalogoRepository.validarDisponibilidadeItens(
      entrada.unidadeId,
      entrada.itens,
    );

    if (!validacaoEstoque.valido) {
      throw new AppError(
        `Item indisponível no estoque local: ${validacaoEstoque.produtoIndisponivel}`,
        422,
      );
    }

    const catalogo = await this.catalogoRepository.listarPorUnidade(entrada.unidadeId);
    const mapaPrecos = new Map(catalogo.map((item) => [item.produtoId, item.precoRegional]));

    const itensComPreco = entrada.itens.map((item) => {
      const preco = mapaPrecos.get(item.produtoId);
      if (preco === undefined) {
        throw new AppError(`Produto não pertence ao catálogo da unidade: ${item.produtoId}`, 422);
      }
      return {
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: preco,
        observacoes: item.observacoes,
      };
    });

    const valorTotal = itensComPreco.reduce(
      (acumulado, item) => acumulado + item.precoUnitario * item.quantidade,
      0,
    );

    const pedidoCriado = await this.pedidoRepository.criarComTransacao(
      {
        unidade: { connect: { id: entrada.unidadeId } },
        canal: entrada.canal,
        status: StatusPedidoMulticanal.PENDING_PAYMENT,
        valorTotal,
        idempotencyKey: entrada.idempotencyKey,
        correlationId: entrada.correlationId,
        ...(entrada.clienteId
          ? { cliente: { connect: { id: entrada.clienteId } } }
          : {}),
      },
      itensComPreco,
      {
        valorProcessado: valorTotal,
        status: 'PENDING',
      },
    );

    await this.logAuditoriaRepository.registrar({
      correlationId: entrada.correlationId,
      severidade: 'INFO',
      autorTipo: 'SYSTEM',
      operacao: 'CREATE',
      recurso: 'pedidos_multicanal',
      recursoId: pedidoCriado.publicOrderId,
      payloadResumo: {
        canal: entrada.canal,
        unidadeId: entrada.unidadeId,
        valorTotal,
      },
      lgpdMetadados: {
        legalBasis: 'contract_execution',
        purpose: 'gestao_pedidos',
        containsPII: Boolean(entrada.clienteId),
      },
    });

    this.gatewayMockService.dispararCobrancaAssincrona({
      gatewayRef: pedidoCriado.transacao!.gatewayRef,
      valor: valorTotal,
      correlationId: entrada.correlationId,
    });

    return this.mapearResposta(pedidoCriado);
  }

  private mapearResposta(pedido: {
    publicOrderId: string;
    status: StatusPedidoMulticanal;
    valorTotal: { toString(): string } | number;
    canal: CriarPedidoMulticanalEntrada['canal'];
    unidadeId: string;
  }): PedidoMulticanalResposta {
    return {
      publicOrderId: pedido.publicOrderId,
      status: pedido.status,
      valorTotal: Number(pedido.valorTotal),
      canal: pedido.canal,
      unidadeId: pedido.unidadeId,
    };
  }
}
