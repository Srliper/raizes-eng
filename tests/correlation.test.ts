import { obterCorrelationId } from '../src/utils/correlationId';
import { Request } from 'express';

describe('correlationId — rastreabilidade', () => {
  it('reutiliza correlation-id do cabeçalho quando presente', () => {
    const requisicao = {
      headers: { 'x-correlation-id': 'corr-existente-123' },
    } as unknown as Request;

    expect(obterCorrelationId(requisicao)).toBe('corr-existente-123');
  });

  it('gera UUID quando cabeçalho ausente', () => {
    const requisicao = { headers: {} } as unknown as Request;
    const id = obterCorrelationId(requisicao);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
