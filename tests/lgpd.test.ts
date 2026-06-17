import { maskPII } from '../src/utils/maskPII';
import { AppError } from '../src/utils/AppError';

describe('maskPII — conformidade LGPD', () => {
  it('ofusca CPF mantendo apenas os 2 últimos dígitos', () => {
    expect(maskPII('12345678901', 'cpf')).toBe('***.***.***-01');
  });

  it('ofusca e-mail sem expor domínio completo', () => {
    expect(maskPII('cliente@email.com', 'email')).toBe('c***@***.com');
  });

  it('ofusca telefone mantendo sufixo', () => {
    expect(maskPII('81999887766', 'telefone')).toBe('***-7766');
  });
});

describe('AppError — tratamento operacional', () => {
  it('marca erros como operacionais com status HTTP', () => {
    const erro = new AppError('Consentimento necessário', 403);
    expect(erro.statusCode).toBe(403);
    expect(erro.isOperational).toBe(true);
    expect(erro.message).toBe('Consentimento necessário');
  });
});
