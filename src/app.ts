import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { rotasSaude } from './routes/saude.routes';
import { rotasCatalogo } from './routes/catalogo.routes';
import { rotasPedidos } from './routes/pedidos.routes';
import { rotasPagamentos } from './routes/pagamentos.routes';
import { rotasPrivacidade } from './routes/privacidade.routes';
import { rotasUsuarios } from './routes/usuarios.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use(rotasSaude);
app.use('/api/v1/catalog', rotasCatalogo);
app.use('/api/v1/orders', rotasPedidos);
app.use('/api/v1/payments', rotasPagamentos);
app.use('/api/v1/privacy', rotasPrivacidade);
app.use('/api/v1/users', rotasUsuarios);

app.use((erro: Error, _requisicao: Request, resposta: Response, _proximo: NextFunction) => {
  console.error('Erro na aplicação:', erro);
  resposta.status(500).json({ erro: erro.message });
});

export { app };
export default app;
