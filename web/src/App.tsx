import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { ProveedorSesion, useSesion } from './sesion/SesionContext';
import { RutaProtegida } from './componentes/RutaProtegida';
import { IniciarSesion } from './paginas/IniciarSesion';
import { Registro } from './paginas/Registro';
import { Inicio } from './paginas/Inicio';

function Encabezado() {
  const { sesion, salir } = useSesion();
  return (
    <header className="encabezado">
      <Link to="/" className="marca">
        Subastas en línea
      </Link>
      {sesion && (
        <nav>
          <span>{sesion.nombre}</span>
          <button type="button" onClick={salir}>
            Cerrar sesión
          </button>
        </nav>
      )}
    </header>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ProveedorSesion>
        <Encabezado />
        <Routes>
          <Route path="/iniciar-sesion" element={<IniciarSesion />} />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/"
            element={
              <RutaProtegida>
                <Inicio />
              </RutaProtegida>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProveedorSesion>
    </BrowserRouter>
  );
}
