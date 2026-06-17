import { Server } from 'http';
import { app } from './app';
import { prismaCliente } from './config/prisma';
import { obterRedisCliente } from './config/redis';

const PORTA = Number(process.env.PORT) || 3000;
const HOST = process.env.PUBLIC_HOST ?? 'localhost';

let servidorHttp: Server | null = null;
let encerramentoEmAndamento = false;

interface LogServidor {
  correlationId: string;
  timestamp: string;
  severity: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  service: string;
  operation: string;
  porta?: number;
  url?: string;
  sinal?: string;
  detalhe?: string;
}

function emitirLog(registro: LogServidor): void {
  const linha = JSON.stringify(registro);
  if (registro.severity === 'ERROR') {
    console.error(linha);
    return;
  }
  if (registro.severity === 'WARN') {
    console.warn(linha);
    return;
  }
  console.log(linha);
}

function montarUrlBase(): string {
  return `http://${HOST}:${PORTA}`;
}

function iniciarServidor(): void {
  servidorHttp = app.listen(PORTA, () => {
    emitirLog({
      correlationId: 'boot',
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      message: 'Servidor Raízes do Nordeste iniciado',
      service: 'raizes-backend-api',
      operation: 'SERVER_START',
      porta: PORTA,
      url: montarUrlBase(),
    });
  });

  servidorHttp.on('error', (erro: NodeJS.ErrnoException) => {
    if (erro.code === 'EADDRINUSE') {
      emitirLog({
        correlationId: 'boot',
        timestamp: new Date().toISOString(),
        severity: 'ERROR',
        message: `Porta ${PORTA} já está em uso. Encerre o processo anterior ou altere PORT no .env`,
        service: 'raizes-backend-api',
        operation: 'SERVER_PORT_IN_USE',
        porta: PORTA,
        url: montarUrlBase(),
        detalhe: erro.message,
      });
      process.exit(1);
      return;
    }

    emitirLog({
      correlationId: 'boot',
      timestamp: new Date().toISOString(),
      severity: 'ERROR',
      message: 'Falha ao iniciar o servidor HTTP',
      service: 'raizes-backend-api',
      operation: 'SERVER_BOOT_FAILED',
      porta: PORTA,
      detalhe: erro.message,
    });
    process.exit(1);
  });
}

async function encerrarConexoes(): Promise<void> {
  await prismaCliente.$disconnect();

  try {
    const clienteRedis = obterRedisCliente();
    if (clienteRedis.status === 'ready' || clienteRedis.status === 'connect') {
      await clienteRedis.quit();
    }
  } catch {
    // Redis é opcional no encerramento — não bloqueia o shutdown.
  }
}

async function encerrarServidor(sinal: NodeJS.Signals): Promise<void> {
  if (encerramentoEmAndamento) return;
  encerramentoEmAndamento = true;

  emitirLog({
    correlationId: 'shutdown',
    timestamp: new Date().toISOString(),
    severity: 'INFO',
    message: 'Encerrando servidor — graceful shutdown',
    service: 'raizes-backend-api',
    operation: 'SERVER_SHUTDOWN',
    sinal,
    porta: PORTA,
    url: montarUrlBase(),
  });

  try {
    if (servidorHttp) {
      await new Promise<void>((resolver, rejeitar) => {
        servidorHttp!.close((erro) => (erro ? rejeitar(erro) : resolver()));
      });
    }

    await encerrarConexoes();

    emitirLog({
      correlationId: 'shutdown',
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      message: 'Servidor encerrado com sucesso',
      service: 'raizes-backend-api',
      operation: 'SERVER_STOPPED',
      porta: PORTA,
    });

    process.exit(0);
  } catch (erro) {
    emitirLog({
      correlationId: 'shutdown',
      timestamp: new Date().toISOString(),
      severity: 'ERROR',
      message: 'Erro durante o graceful shutdown',
      service: 'raizes-backend-api',
      operation: 'SERVER_SHUTDOWN_FAILED',
      detalhe: erro instanceof Error ? erro.message : String(erro),
    });
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  void encerrarServidor('SIGTERM');
});

process.on('SIGINT', () => {
  void encerrarServidor('SIGINT');
});

iniciarServidor();

export { app, servidorHttp };
