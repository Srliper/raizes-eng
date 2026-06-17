import { Router } from 'express';
import { SaudeSistemaController } from '../controllers/SaudeSistemaController';

const rotasSaude = Router();
const saudeController = new SaudeSistemaController();

rotasSaude.get('/health', saudeController.health);
rotasSaude.get('/ready', saudeController.ready);

export { rotasSaude };
