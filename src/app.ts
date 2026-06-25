import dotenv from 'dotenv';

dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { middlewareCorrelationId } from './middleware/correlationId';
import { middlewareTratamentoErros } from './middleware/tratamentoErros';
import { rotasSaude } from './routes/saude.routes';
import { rotasCatalogo } from './routes/catalogo.routes';
import { rotasPedidos } from './routes/pedidos.routes';
import { rotasPagamentos } from './routes/pagamentos.routes';
import { rotasPrivacidade } from './routes/privacidade.routes';
import { rotasUsuarios } from './routes/usuarios.routes';
import { rotasDesenvolvimento } from './routes/desenvolvimento.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(middlewareCorrelationId);

app.use(rotasSaude);
app.use('/api/v1/catalog', rotasCatalogo);
app.use('/api/v1/orders', rotasPedidos);
app.use('/api/v1/payments', rotasPagamentos);
app.use('/api/v1/privacy', rotasPrivacidade);
app.use('/api/v1/users', rotasUsuarios);

if (process.env.NODE_ENV !== 'production') {
  app.use('/api/v1/dev', rotasDesenvolvimento);
}

app.use((_requisicao: Request, resposta: Response) => {
  resposta.status(404).json({
    erro: 'Rota não encontrada',
    dica: 'Verifique o método HTTP e o caminho. Ex: GET /api/v1/catalog/{unitId}',
  });
});

app.use(middlewareTratamentoErros);

export { app };
export default app;
