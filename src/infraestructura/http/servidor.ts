import { crearAplicacion } from './app';

const PUERTO = process.env.PUERTO ? Number(process.env.PUERTO) : 3000;

const app = crearAplicacion();

app.listen(PUERTO, () => {
  console.log(`SERVER RUNNING AT ${PUERTO}`);
});
