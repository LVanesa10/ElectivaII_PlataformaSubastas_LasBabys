// Emisor propio que simula a la pasarela de pagos: firma la notificación con
// el secreto compartido (HMAC-SHA256) y la envía al webhook de la API.
//
// Uso:
//   npm run pasarela -- <ordenPagoId> <APROBADO|RECHAZADO> [idEvento] [--firma-invalida]
//
// Repetir el mismo idEvento permite comprobar la idempotencia; --firma-invalida
// permite comprobar que una notificación de origen no verificable se rechaza.
require('dotenv/config');
const { createHmac, randomUUID } = require('crypto');

const argumentos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const firmaInvalida = process.argv.includes('--firma-invalida');
const [ordenPagoId, resultado = 'APROBADO', idEvento = `evt_${randomUUID()}`] = argumentos;

if (!ordenPagoId || !['APROBADO', 'RECHAZADO'].includes(resultado)) {
  console.error('Uso: npm run pasarela -- <ordenPagoId> <APROBADO|RECHAZADO> [idEvento] [--firma-invalida]');
  process.exit(1);
}

const secreto = process.env.PASARELA_SECRETO;
if (!secreto) {
  console.error('Defina PASARELA_SECRETO en el archivo .env (el mismo valor que usa la API).');
  process.exit(1);
}

const urlApi = process.env.URL_API ?? `http://localhost:${process.env.PUERTO ?? 3000}`;
const cuerpo = JSON.stringify({ idEvento, ordenPagoId, resultado });
const firma = 'sha256=' + createHmac('sha256', firmaInvalida ? 'otro-secreto' : secreto).update(cuerpo).digest('hex');

fetch(`${urlApi}/webhooks/pagos`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Pasarela-Firma': firma },
  body: cuerpo,
})
  .then(async (respuesta) => {
    console.log(`→ POST /webhooks/pagos ${cuerpo}`);
    console.log(`← ${respuesta.status}`, await respuesta.text());
  })
  .catch((error) => {
    console.error('No fue posible contactar la API:', error.message);
    process.exit(1);
  });
