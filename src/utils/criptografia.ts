import { createHash, randomBytes } from 'crypto';

export function gerarHashIrreversivel(valor: string, salt?: string): string {
  const saltUnico = salt ?? randomBytes(16).toString('hex');
  return createHash('sha256').update(`${valor}:${saltUnico}`).digest('hex');
}

export function mascararEmail(email: string): string {
  const [usuario, dominio] = email.split('@');
  if (!usuario || !dominio) return '***@***.com';
  return `${usuario.charAt(0)}***@${dominio.charAt(0)}***.com`;
}
