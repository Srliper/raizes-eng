import { Router } from 'express';
import { ConsentimentoLGPDController } from '../controllers/ConsentimentoLGPDController';

const rotasPrivacidade = Router();
const consentimentoController = new ConsentimentoLGPDController();

rotasPrivacidade.post('/consent', consentimentoController.registrar);

export { rotasPrivacidade };
