import { Response } from 'express';
import { PublicarSubasta } from '../../../aplicacion/casos-uso/PublicarSubasta';
import { ListarSubastas } from '../../../aplicacion/casos-uso/ListarSubastas';
import { ConsultarSubasta } from '../../../aplicacion/casos-uso/ConsultarSubasta';
import { CancelarSubasta } from '../../../aplicacion/casos-uso/CancelarSubasta';
import { PeticionAutenticada } from '../middlewares/autenticacion';
import { presentarSubasta } from '../presentadores';

export class SubastasController {
  constructor(
    private readonly publicarSubasta: PublicarSubasta,
    private readonly listarSubastas: ListarSubastas,
    private readonly consultarSubasta: ConsultarSubasta,
    private readonly cancelarSubasta: CancelarSubasta,
  ) {}

  publicar = async (req: PeticionAutenticada, res: Response): Promise<void> => {
    const subasta = await this.publicarSubasta.ejecutar({
      vendedorId: req.usuarioId!,
      denominacion: req.body.denominacion,
      descripcion: req.body.descripcion,
      estadoConservacion: req.body.estadoConservacion,
      categoriaId: req.body.categoriaId,
      precioBase: req.body.precioBase,
      incrementoMinimo: req.body.incrementoMinimo,
      fechaCierre: new Date(req.body.fechaCierre),
    });
    res.status(201).json(presentarSubasta(subasta));
  };

  listar = async (req: PeticionAutenticada, res: Response): Promise<void> => {
    const pagina = req.query.pagina ? Number(req.query.pagina) : undefined;
    const tamanoPagina = req.query.tamanoPagina ? Number(req.query.tamanoPagina) : undefined;

    const resultado = await this.listarSubastas.ejecutar({
      categoriaId: typeof req.query.categoriaId === 'string' ? req.query.categoriaId : undefined,
      estado: typeof req.query.estado === 'string' ? req.query.estado : undefined,
      pagina,
      tamanoPagina,
    });

    res.status(200).json({
      total: resultado.total,
      subastas: resultado.subastas.map((s) => presentarSubasta(s)),
    });
  };

  detalle = async (req: PeticionAutenticada, res: Response): Promise<void> => {
    const subasta = await this.consultarSubasta.ejecutar(req.params.id);
    res.status(200).json(presentarSubasta(subasta, { incluirHistorial: true }));
  };

  cancelar = async (req: PeticionAutenticada, res: Response): Promise<void> => {
    await this.cancelarSubasta.ejecutar(req.params.id, req.usuarioId!);
    res.status(204).send();
  };
}
