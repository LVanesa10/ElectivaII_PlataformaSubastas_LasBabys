// Hechos que la Subasta acumula y que la capa de aplicación recoge para
// entregarlos a un puerto de salida. El dominio no sabe cómo se difunden.
export type EventoDeDominio =
  | { tipo: 'NUEVA_PUJA_VIGENTE'; subastaId: string; postorId: string; monto: number }
  | { tipo: 'POSTOR_SUPERADO'; subastaId: string; postorSuperadoId: string; nuevoMonto: number }
  | { tipo: 'SUBASTA_ADJUDICADA'; subastaId: string; ganadorId: string; vendedorId: string; montoGanador: number }
  | { tipo: 'SUBASTA_DESIERTA'; subastaId: string; vendedorId: string };
