/**
 * Camada de ofuscação de dados pessoais antes de qualquer persistência em log —
 * atende minimização e não exposição de PII conforme LGPD.
 */
export function maskPII(
  conteudoSensivel: string,
  categoria: 'cpf' | 'email' | 'telefone',
): string {
  if (!conteudoSensivel) return conteudoSensivel;

  if (categoria === 'cpf') {
    const somenteNumeros = conteudoSensivel.replace(/\D/g, '');
    if (somenteNumeros.length < 2) return '***';
    return `***.***.***-${somenteNumeros.slice(-2)}`;
  }

  if (categoria === 'email') {
    const letraInicial = conteudoSensivel.split('@')[0]?.charAt(0) ?? 'u';
    return `${letraInicial}***@***.com`;
  }

  const numerosTelefone = conteudoSensivel.replace(/\D/g, '');
  return `***-${numerosTelefone.slice(-4)}`;
}

export function sanitizarPayloadParaLog(
  dadosBrutos: Record<string, unknown>,
): Record<string, unknown> {
  const copiaSegura = { ...dadosBrutos };

  if (typeof copiaSegura.cpf === 'string') {
    copiaSegura.cpf = maskPII(copiaSegura.cpf, 'cpf');
  }
  if (typeof copiaSegura.email === 'string') {
    copiaSegura.email = maskPII(copiaSegura.email, 'email');
  }
  if (typeof copiaSegura.telefone === 'string') {
    copiaSegura.telefone = maskPII(copiaSegura.telefone, 'telefone');
  }

  return copiaSegura;
}
