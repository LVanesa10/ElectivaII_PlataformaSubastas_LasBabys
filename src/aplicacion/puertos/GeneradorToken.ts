export interface CargaUtilToken {
  usuarioId: string;
}

export interface GeneradorToken {
  generar(carga: CargaUtilToken): string;
  verificar(token: string): CargaUtilToken | null;
}
