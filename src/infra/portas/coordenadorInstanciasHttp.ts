export interface InstanciaHttpAtiva {
  identificador: number;
  porta: number;
  host: string;
  iniciadaEm: string;
}

class CoordenadorInstanciasHttp {
  private readonly mapaInstancias = new Map<number, InstanciaHttpAtiva>();
  private indiceRotacao = 0;

  registrar(instancia: InstanciaHttpAtiva): void {
    this.mapaInstancias.set(instancia.identificador, instancia);
  }

  listarAtivas(): InstanciaHttpAtiva[] {
    return Array.from(this.mapaInstancias.values());
  }

  obterPortaPrincipal(): number | null {
    const primeira = this.listarAtivas()[0];
    return primeira?.porta ?? null;
  }

  /** Distribui callbacks do mock entre instâncias ativas (round-robin). */
  obterUrlBaseRotativa(): string {
    const ativas = this.listarAtivas();
    if (ativas.length === 0) {
      return 'http://localhost:3000';
    }

    const alvo = ativas[this.indiceRotacao % ativas.length];
    this.indiceRotacao += 1;
    return `http://${alvo.host}:${alvo.porta}`;
  }

  montarUrlWebhook(): string {
    return `${this.obterUrlBaseRotativa()}/api/v1/payments/webhook`;
  }
}

export const coordenadorInstanciasHttp = new CoordenadorInstanciasHttp();
