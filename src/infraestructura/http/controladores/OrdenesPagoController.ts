import { Response } from 'express';
import { ConsultarOrdenesPago } from '../../../aplicacion/casos-uso/ConsultarOrdenesPago';
import { PeticionAutenticada } from '../middlewares/autenticacion';
import { presentarOrdenPago } from '../presentadores';

export class OrdenesPagoController {
  constructor(private readonly consultarOrdenesPago: ConsultarOrdenesPago) {}

  listarMias = async (req: PeticionAutenticada, res: Response): Promise<void> => {
    const ordenes = await this.consultarOrdenesPago.listarDelGanador(req.usuarioId!);
    res.status(200).json(ordenes.map(({ orden, subasta }) => presentarOrdenPago(orden, subasta)));
  };

  detalle = async (req: PeticionAutenticada, res: Response): Promise<void> => {
    const { orden, subasta } = await this.consultarOrdenesPago.consultar(req.params.id, req.usuarioId!);
    res.status(200).json(presentarOrdenPago(orden, subasta));
  };
}
