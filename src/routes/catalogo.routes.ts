import { Router } from 'express';
import { CatalogoUnidadeController } from '../controllers/CatalogoUnidadeController';

const rotasCatalogo = Router();
const catalogoController = new CatalogoUnidadeController();

rotasCatalogo.get('/:unitId', catalogoController.consultarCatalogo);

export { rotasCatalogo };
