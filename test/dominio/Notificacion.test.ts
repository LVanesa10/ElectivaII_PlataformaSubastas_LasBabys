import { Notificacion } from '../../src/dominio/entidades/Notificacion';
import { EventoDeDominio } from '../../src/dominio/eventos/EventoDeDominio';

const AHORA = new Date('2026-01-01T00:00:00.000Z');

function idsSecuenciales(): () => string {
  let contador = 0;
  return () => `id-${++contador}`;
}

describe('Notificacion.desdeEvento', () => {
  test('una nueva puja vigente no genera notificaciones individuales', () => {
    const evento: EventoDeDominio = {
      tipo: 'NUEVA_PUJA_VIGENTE',
      subastaId: 'subasta-1',
      postorId: 'postor-1',
      monto: 100000,
    };

    expect(Notificacion.desdeEvento(evento, idsSecuenciales(), AHORA)).toHaveLength(0);
  });

  test('un postor superado recibe exactamente un aviso dirigido a él', () => {
    const evento: EventoDeDominio = {
      tipo: 'POSTOR_SUPERADO',
      subastaId: 'subasta-1',
      postorSuperadoId: 'postor-1',
      nuevoMonto: 150000,
    };

    const notificaciones = Notificacion.desdeEvento(evento, idsSecuenciales(), AHORA);

    expect(notificaciones).toHaveLength(1);
    expect(notificaciones[0].idDestinatario).toBe('postor-1');
    expect(notificaciones[0].tipoNotificacion).toBe('PUJA_SUPERADA');
    expect(notificaciones[0].texto).toContain('150000');
  });

  test('una subasta adjudicada notifica tanto al ganador como al vendedor', () => {
    const evento: EventoDeDominio = {
      tipo: 'SUBASTA_ADJUDICADA',
      subastaId: 'subasta-1',
      ganadorId: 'postor-2',
      vendedorId: 'vendedor-1',
      montoGanador: 200000,
    };

    const notificaciones = Notificacion.desdeEvento(evento, idsSecuenciales(), AHORA);

    expect(notificaciones).toHaveLength(2);
    expect(notificaciones.map((n) => n.idDestinatario)).toEqual(
      expect.arrayContaining(['postor-2', 'vendedor-1']),
    );
    expect(notificaciones.find((n) => n.idDestinatario === 'postor-2')?.tipoNotificacion).toBe(
      'SUBASTA_ADJUDICADA_GANADOR',
    );
    expect(notificaciones.find((n) => n.idDestinatario === 'vendedor-1')?.tipoNotificacion).toBe(
      'SUBASTA_ADJUDICADA_VENDEDOR',
    );
  });

  test('una subasta desierta notifica únicamente al vendedor', () => {
    const evento: EventoDeDominio = {
      tipo: 'SUBASTA_DESIERTA',
      subastaId: 'subasta-1',
      vendedorId: 'vendedor-1',
    };

    const notificaciones = Notificacion.desdeEvento(evento, idsSecuenciales(), AHORA);

    expect(notificaciones).toHaveLength(1);
    expect(notificaciones[0].idDestinatario).toBe('vendedor-1');
    expect(notificaciones[0].tipoNotificacion).toBe('SUBASTA_DESIERTA');
  });

  test('cada notificación conserva la fecha en que se generó', () => {
    const evento: EventoDeDominio = {
      tipo: 'SUBASTA_DESIERTA',
      subastaId: 'subasta-1',
      vendedorId: 'vendedor-1',
    };

    const [notificacion] = Notificacion.desdeEvento(evento, idsSecuenciales(), AHORA);
    expect(notificacion.fechaGeneracion.getTime()).toBe(AHORA.getTime());
  });
});
