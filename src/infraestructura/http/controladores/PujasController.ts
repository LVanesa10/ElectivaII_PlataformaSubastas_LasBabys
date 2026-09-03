import { Response } from 'express';
import { RegistrarPuja } from '../../../aplicacion/casos-uso/RegistrarPuja';
import { PeticionAutenticada } from '../middlewares/autenticacion';
import { presentarPuja } from '../presentadores';

export class PujasController {
  constructor(private readonly registrarPuja: RegistrarPuja) {}

  registrar = async (req: PeticionAutenticada, res: Response): Promise<void> => {
    const puja = await this.registrarPuja.ejecutar({
      subastaId: req.params.id,
      postorId: req.usuarioId!,
      monto: req.body.monto,
    });
    res.status(201).json(presentarPuja(puja));
  };
}
