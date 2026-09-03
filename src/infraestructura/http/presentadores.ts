import { Subasta } from '../../dominio/entidades/Subasta';
import { Usuario } from '../../dominio/entidades/Usuario';
import { Puja } from '../../dominio/entidades/Puja';
import { Categoria } from '../../dominio/entidades/Categoria';
import { Notificacion } from '../../dominio/entidades/Notificacion';

export function presentarPuja(puja: Puja) {
  return {
    id: puja.identificador,
    postorId: puja.idPostor,
    monto: puja.valorOfertado.valor,
    fecha: puja.fechaRegistro.toISOString(),
  };
}

export function presentarSubasta(subasta: Subasta, opciones: { incluirHistorial?: boolean } = {}) {
  const base = {
    id: subasta.identificador,
    vendedorId: subasta.idVendedor,
    articulo: {
      denominacion: subasta.datosArticulo.nombreDenominacion,
      descripcion: subasta.datosArticulo.textoDescripcion,
      estadoConservacion: subasta.datosArticulo.estado,
      categoriaId: subasta.datosArticulo.idCategoria,
    },
    precioBase: subasta.valorPrecioBase.valor,
    incrementoMinimo: subasta.valorIncrementoMinimo.valor,
    fechaPublicacion: subasta.fechaDePublicacion.toISOString(),
    fechaCierre: subasta.fechaDeCierre.toISOString(),
    estado: subasta.estadoActual.valor,
    ofertaVigente: subasta.ofertaVigente()?.valor ?? null,
    mejorPostorId: subasta.mejorPostorActualId(),
    cantidadPujas: subasta.historialPujas.length,
    ordenPago: subasta.ordenDePago
      ? {
          id: subasta.ordenDePago.identificador,
          ganadorId: subasta.ordenDePago.idGanador,
          monto: subasta.ordenDePago.valor.valor,
          fechaLimite: subasta.ordenDePago.fechaLimite.toISOString(),
          estado: subasta.ordenDePago.estadoActual,
        }
      : null,
  };

  if (opciones.incluirHistorial) {
    return {
      ...base,
      historialPujas: subasta.historialPujas.map(presentarPuja),
    };
  }

  return base;
}

// Nunca incluye la contraseña ni datos de contacto de terceros.
export function presentarUsuario(usuario: Usuario) {
  return {
    id: usuario.identificador,
    nombre: usuario.nombreCompleto,
    correo: usuario.email.valor,
  };
}

export function presentarCategoria(categoria: Categoria) {
  return {
    id: categoria.identificador,
    nombre: categoria.nombreCategoria,
  };
}

export function presentarNotificacion(notificacion: Notificacion) {
  return {
    id: notificacion.identificador,
    tipo: notificacion.tipoNotificacion,
    subastaId: notificacion.idSubasta,
    mensaje: notificacion.texto,
    fecha: notificacion.fechaGeneracion.toISOString(),
  };
}
