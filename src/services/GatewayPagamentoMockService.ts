import { createHmac } from 'crypto';
import { variaveisExecucao } from '../config/ambiente';
import { registrarLogEstruturado } from '../utils/logger';

interface ParametrosCobrancaSimulada {
  gatewayRef: string;
  valor: number;
  correlationId: string;
}

/**
 * Emula o acquirer externo em segundo plano: a API responde 201 imediatamente
 * e só altera o pedido quando o webhook assinado retorna.
 */
export class GatewayPagamentoMockService {
  agendarProcessamentoAssincrono(parametros: ParametrosCobrancaSimulada): void {
    const { atrasoRespostaMs } = variaveisExecucao.simuladorPagamento;
    const porta = Number(process.env.PORT) || 3000;
    const host = process.env.PUBLIC_HOST ?? 'localhost';

    setTimeout(async () => {
      try {
        const pagamentoAprovado = Math.random() > 0.15;
        const resultado = pagamentoAprovado ? 'APPROVED' : 'REJECTED';
        const tokenIntegridade = this.compilarHashIntegridade(
          parametros.gatewayRef,
          resultado,
        );

        const destinoWebhook = `http://${host}:${porta}/api/v1/payments/webhook`;

        await fetch(destinoWebhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-correlation-id': parametros.correlationId,
          },
          body: JSON.stringify({
            gatewayRef: parametros.gatewayRef,
            status: resultado,
            assinatura: tokenIntegridade,
          }),
        });

        registrarLogEstruturado({
          correlationId: parametros.correlationId,
          severidade: 'INFO',
          mensagem: 'Simulador de pagamento concluiu ciclo assíncrono',
          operacao: 'MOCK_PAYMENT_DONE',
          payload: {
            gatewayRef: parametros.gatewayRef,
            status: resultado,
            webhook: destinoWebhook,
          },
        });
      } catch {
        registrarLogEstruturado({
          correlationId: parametros.correlationId,
          severidade: 'WARN',
          mensagem: 'Simulador de pagamento falhou — retentativa recomendada',
          operacao: 'MOCK_PAYMENT_RETRY',
          payload: { gatewayRef: parametros.gatewayRef },
        });
      }
    }, atrasoRespostaMs);
  }

  dispararCobrancaAssincrona(parametros: ParametrosCobrancaSimulada): void {
    this.agendarProcessamentoAssincrono(parametros);
  }

  compilarHashIntegridade(referenciaGateway: string, situacao: string): string {
    return createHmac('sha256', variaveisExecucao.simuladorPagamento.segredoHmac)
      .update(`${referenciaGateway}:${situacao}`)
      .digest('hex');
  }

  gerarAssinaturaHmac(referenciaGateway: string, situacao: string): string {
    return this.compilarHashIntegridade(referenciaGateway, situacao);
  }

  validarAssinatura(referenciaGateway: string, situacao: string, assinatura: string): boolean {
    return this.compilarHashIntegridade(referenciaGateway, situacao) === assinatura;
  }

  /**
   * CT09 — simula gateway que não responde a tempo: nenhum webhook é disparado
   * e o pedido permanece em PENDING_PAYMENT para validar retry/backoff.
   */
  agendarTimeoutSemWebhook(parametros: {
    gatewayRef: string;
    timeoutMs: number;
    correlationId: string;
  }): void {
    setTimeout(() => {
      registrarLogEstruturado({
        correlationId: parametros.correlationId,
        severidade: 'WARN',
        mensagem: 'Gateway mock expirou sem responder — timeout simulado (CT09)',
        operacao: 'MOCK_PAYMENT_TIMEOUT',
        payload: {
          gatewayRef: parametros.gatewayRef,
          timeoutMs: parametros.timeoutMs,
          webhookEnviado: false,
        },
      });
    }, parametros.timeoutMs);
  }
}
