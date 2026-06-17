import { Router } from 'express';
import { PedidoMulticanalController } from '../controllers/PedidoMulticanalController';
import { ConsultarPedidoController } from '../controllers/ConsultarPedidoController';

const rotasPedidos = Router();
const pedidoController = new PedidoMulticanalController();
const consultarPedidoController = new ConsultarPedidoController();

rotasPedidos.post('/', pedidoController.criar);
rotasPedidos.get('/:orderId', consultarPedidoController.consultar);

export { rotasPedidos };
