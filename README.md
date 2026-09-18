# Buscador de Animales

Aplicación full-stack para buscar animales con autenticación. TypeScript en ambos lados:
API en Node + Express, cliente en React + Vite y persistencia en archivos JSON.

## Puesta en marcha

Requiere **Node 22.12 o superior**.

```bash
npm install
npm run dev
```

Abre <http://localhost:5173>, crea una cuenta y busca. No hace falta crear un `.env`
ni cargar datos antes: todas las variables tienen valores por defecto para desarrollo.

| Comando | Qué hace |
|---|---|
| `npm run dev` | API en `:3001` y cliente en `:5173` (con proxy de `/api`) |
| `npm test` | Tests del servidor y del cliente |
| `npm run check` | Typecheck de todo el repo + tests |
| `npm run build && npm start` | Build de producción: Express sirve la API y el cliente en `:3001` |

Para demostrar la búsqueda: `leon` encuentra *León* y *Camaleón pantera*
(sin distinguir acentos, coincidencia parcial).

### Variables de entorno

Opcionales. Para cambiarlas, copia `server/.env.example` a `server/.env`.

| Variable | Por defecto | |
|---|---|---|
| `PORT` | `3001` | Si la cambias, cambia también `API_ORIGIN` en `client/vite.config.ts` |
| `JWT_SECRET` | secreto de desarrollo | **Solo para desarrollo.** El servidor avisa por consola si falta. |
| `JWT_EXPIRES_IN_SECONDS` | `3600` | Duración del token (1 h) |
| `DATA_DIR` | `database` | Carpeta con `animals.json` y `users.json` |

## API

Todas las rutas de animales requieren `Authorization: Bearer <token>`.

| Método | Ruta | |
|---|---|---|
| `GET` | `/api/health` | `{ status, uptime }`, sin autenticación |
| `POST` | `/api/auth/signup` | `{ email, password }` → `201 { token, user }` |
| `POST` | `/api/auth/login` | `{ email, password }` → `200 { token, user }` |
| `GET` | `/api/animales` | Búsqueda paginada, ver parámetros abajo |
| `GET` | `/api/animales/filtros` | Valores distintos de cada filtro y rango de peso real |

Parámetros de `/api/animales`, todos opcionales y combinables: `nombre` (parcial, sin
acentos ni mayúsculas), `clase`, `dieta`, `continente`, `habitat` (exactos; se pueden
repetir, p. ej. `continente=África&continente=Asia`, y los valores se combinan con O), `pesoMin` /
`pesoMax` (rango inclusivo, admite decimales), `enPeligro` (`true` / `false`),
`orderBy` (`nombreComun` | `pesoPromedioKg` | `esperanzaVidaAnios`), `order`
(`asc` | `desc`), `page` y `limit` (por defecto 1 y 10, máximo 100).

Respuesta: `{ data: Animal[], meta: { total, page, limit, totalPages } }`. Una búsqueda
sin resultados devuelve `200` con `data: []`, no `404`.

Todos los errores tienen la misma forma:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [{ "field": "pesoMin", "message": "…" }] } }
```

## Estructura

```
shared/types.ts     contrato de la API, importado por servidor y cliente
server/src/
  routes/ → controllers/ → services/ → repositories/
  schemas/          validación con zod; los tipos de entrada se infieren de aquí
  middleware/       autenticación y manejador de errores único
client/src/
  api/              wrapper de fetch tipado
  context/          sesión y opciones de filtro
  hooks/            useAnimals (fetch + abort + carga), debounce
  pages/, components/
```

## Decisiones y trade-offs

**Archivos JSON detrás de repositorios.** El enunciado pide archivos JSON y menciona una
base de datos real como un plus. Me quedé con JSON, pero todo acceso a datos pasa por
`repositories/`, y `app.ts` es el único lugar donde se conectan las capas: cambiar a
Postgres es reemplazar dos funciones `create*Repository`.

**Escrituras concurrentes y atómicas.** Dos registros simultáneos que leen y escriben
`users.json` a la vez pierden un usuario. `jsonStore.ts` serializa cada ciclo
leer-modificar-escribir en una cola de promesas, y escribe en un archivo temporal que
luego renombra (operación atómica), así un corte a mitad de escritura nunca deja el
archivo truncado. Hay tests que registran usuarios en paralelo para comprobarlo.

**Login sin filtración de información.** Email inexistente y contraseña incorrecta
devuelven exactamente el mismo `401`. Además, cuando el email no existe se compara
igualmente contra un hash de relleno, para que el tiempo de respuesta no revele qué
emails están registrados.

**Filtros desde la API, no escritos a mano.** Las opciones de los selects vienen de
`/api/animales/filtros`, derivadas del dataset. Una lista escrita a mano se equivocaría:
el dataset usa `América` (sin separar norte y sur) y solo tiene tres dietas.
`habitat` no estaba en la lista de filtros pedidos, pero el campo existe, así que lo agregué.

**Valores falsy.** `pesoMin=0` y `enPeligro=false` son filtros válidos. Todas las
comprobaciones usan `!== undefined` y los booleanos se parsean de forma explícita
(`z.coerce.boolean()` convierte `"false"` en `true`). Ambos casos tienen test.

**Estado de la búsqueda en la URL.** Los filtros, el orden y la página viven en la query
string, con los mismos nombres que la API. Una búsqueda se puede compartir y sobrevive a
un refresh.

**Sensación de velocidad.** Con 30 registros en memoria, la API responde en milisegundos:
lo que se nota no es la lentitud, sino los parpadeos. El skeleton de carga solo aparece
si la petición tarda más de 150 ms, los resultados anteriores quedan visibles (atenuados)
mientras llega la nueva respuesta, la altura de la tabla está reservada, el texto usa un
debounce de 200 ms y cada petición nueva aborta la anterior (`AbortController`) para que
las respuestas no lleguen desordenadas.

**Token en `localStorage`.** Es una simplificación deliberada. En producción usaría una
cookie `httpOnly`, que no es accesible desde JavaScript. La sesión se lee de forma
síncrona en el primer render, así que un usuario autenticado nunca ve un destello de la
pantalla de login al refrescar. Cualquier `401` en una petición autenticada cierra la
sesión y redirige al login, y después del login se vuelve a la página original.

### Dependencias

Cuatro en el servidor (`express`, `bcryptjs`, `jsonwebtoken`, `zod`) y tres en el cliente
(`react`, `react-dom`, `react-router-dom`). Lo que dejé fuera a propósito:

| Omitido | En su lugar | Por qué |
|---|---|---|
| `bcrypt` | `bcryptjs` | JavaScript puro, sin node-gyp: instala sin problemas en cualquier máquina. |
| `dotenv` | `process.loadEnvFile()` | Nativo de Node. El `.env` es opcional. |
| `cors` | Proxy de Vite en desarrollo, Express sirve el cliente en producción | Mismo origen en ambos modos: no hay CORS que configurar. |
| Tailwind / framework CSS | CSS plano con custom properties y CSS Modules | Sin plugins de build; unos 3 kB de CSS comprimido. |
| React Query, Redux | `useAnimals` (~50 líneas) y dos contexts | Hay un solo recurso; una librería no se justifica. |

Bundle de producción: ~89 kB gzip de JavaScript (React 19 + React Router 7 son la mayor
parte) y ~3 kB de CSS.

## Tests

`npm test` corre 31 tests de integración de la API (vitest + supertest, sobre una copia
temporal de los datos) y 6 del cliente (Testing Library + msw). Cubren, entre otros:
búsqueda sin acentos, rango de peso inclusivo, `pesoMin=0` y `enPeligro=false`,
resultados vacíos con `200`, `pesoMin > pesoMax` → `400`, tokens ausentes, malformados
y expirados, email duplicado, registros concurrentes, redirección de rutas protegidas y
debounce del buscador.
