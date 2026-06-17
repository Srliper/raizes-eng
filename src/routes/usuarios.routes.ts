import { Router } from 'express';
import { AnonimizacaoClienteController } from '../controllers/AnonimizacaoClienteController';
import { middlewareAutenticacaoJWT } from '../middleware/autenticacaoJWT';

const rotasUsuarios = Router();
const anonimizacaoController = new AnonimizacaoClienteController();

rotasUsuarios.delete(
  '/:clientId/anonymize',
  middlewareAutenticacaoJWT,
  anonimizacaoController.anonimizar,
);

export { rotasUsuarios };
