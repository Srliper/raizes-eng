export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(mensagemOperacional: string, codigoHttp = 400, erroPrevisto = true) {
    super(mensagemOperacional);
    this.statusCode = codigoHttp;
    this.isOperational = erroPrevisto;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
