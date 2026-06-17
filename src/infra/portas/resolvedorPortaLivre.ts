import net from 'net';

/**
 * Varre a faixa em ordem pseudoaleatória até achar uma porta TCP livre —
 * evita colisão quando várias instâncias sobem no mesmo host.
 */
export async function obterPortaTcpDisponivel(
  limiteInferior = 3001,
  limiteSuperior = 9999,
): Promise<number> {
  const amplitude = limiteSuperior - limiteInferior;
  const inicioAleatorio = limiteInferior + Math.floor(Math.random() * amplitude);

  for (let deslocamento = 0; deslocamento <= amplitude; deslocamento++) {
    const portaCandidata =
      limiteInferior + ((inicioAleatorio - limiteInferior + deslocamento) % (amplitude + 1));

    if (await portaLivreParaEscuta(portaCandidata)) {
      return portaCandidata;
    }
  }

  throw new Error(
    `Nenhuma porta disponível entre ${limiteInferior} e ${limiteSuperior}`,
  );
}

function portaLivreParaEscuta(porta: number): Promise<boolean> {
  return new Promise((resolver) => {
    const sondador = net.createServer();

    sondador.once('error', () => resolver(false));
    sondador.once('listening', () => {
      sondador.close(() => resolver(true));
    });

    sondador.listen(porta, '0.0.0.0');
  });
}
