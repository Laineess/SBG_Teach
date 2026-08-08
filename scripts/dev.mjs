/**
 * Levanta la API y el frontend en paralelo.
 *
 * No usa shell: invoca el propio npm con `process.execPath`, así que funciona
 * aunque el PATH del sistema no incluya `cmd.exe` (caso común en Windows con
 * el PATH de máquina sobrescrito por algún instalador).
 */
import { spawn } from "node:child_process";
import process from "node:process";

const npm = process.env.npm_execpath;

if (!npm) {
  console.error("Ejecuta este script con npm: `npm run dev`");
  process.exit(1);
}

const ESC = String.fromCharCode(27);
const COLORES = { api: `${ESC}[33m`, web: `${ESC}[36m`, reset: `${ESC}[0m` };

const servicios = [
  { nombre: "api", workspace: "backend" },
  { nombre: "web", workspace: "frontend" },
];

let cerrando = false;

const procesos = servicios.map(({ nombre, workspace }) => {
  const hijo = spawn(process.execPath, [npm, "run", "dev", "--workspace", workspace], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  prefijar(hijo.stdout, nombre, process.stdout);
  prefijar(hijo.stderr, nombre, process.stderr);

  hijo.on("exit", (codigo, senal) => {
    if (cerrando) return;
    console.log(`${etiqueta(nombre)} terminó (${senal ?? codigo}). Cerrando el resto.`);
    detenerTodo(typeof codigo === "number" ? codigo : 1);
  });

  hijo.on("error", (error) => {
    console.error(`${etiqueta(nombre)} no pudo arrancar: ${error.message}`);
    detenerTodo(1);
  });

  return hijo;
});

function detenerTodo(codigo) {
  if (cerrando) return;
  cerrando = true;
  for (const hijo of procesos) {
    if (hijo.exitCode === null) hijo.kill();
  }
  process.exitCode = codigo;
}

for (const senal of ["SIGINT", "SIGTERM"]) {
  process.on(senal, () => detenerTodo(0));
}

function etiqueta(nombre) {
  return `${COLORES[nombre]}[${nombre}]${COLORES.reset}`;
}

/** Reemite cada línea del hijo con su prefijo de color. */
function prefijar(flujo, nombre, salida) {
  let resto = "";
  flujo.setEncoding("utf8");
  flujo.on("data", (fragmento) => {
    const lineas = (resto + fragmento).split(/\r?\n/);
    resto = lineas.pop() ?? "";
    for (const linea of lineas) {
      salida.write(`${etiqueta(nombre)} ${linea}\n`);
    }
  });
  flujo.on("end", () => {
    if (resto) salida.write(`${etiqueta(nombre)} ${resto}\n`);
  });
}
