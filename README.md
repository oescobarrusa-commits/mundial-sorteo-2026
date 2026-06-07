# mundial-sorteo-2026

Portal web estatico para consultar participantes, paises asignados, partidos de fase de grupos y bracket del sorteo del Mundial 2026.

## Abrir localmente

Abre `index.html` directamente en el navegador. No requiere backend, base de datos, APIs ni proceso de build.

## Editar asignaciones desde Google Sheets

Para cambiar asignaciones sin volver a desplegar en Vercel, usa Google Sheets.

La hoja necesita solo dos columnas:

```csv
name,teamCode
Aaron Escobar,POR
Carlos Escobar,MEX
```

Publica la hoja como CSV y pega esa URL una sola vez en `googleSheetCsvUrl` dentro de `data.js`.

Despues de eso, edita solo las filas de Google Sheets. Al refrescar el sitio, se leeran los datos nuevos.

Detalles:

- `name` es el nombre del participante.
- `teamCode` es el codigo del pais, por ejemplo `MEX`, `ARG`, `POR`.
- Un participante puede aparecer varias veces si tiene varios paises.
- Un pais solo puede tener una asignacion.
- Si la hoja esta vacia, el portal mostrara los paises como `Sin asignar`.

`assignments` queda como respaldo local por si no se configura Google Sheets. Antes del sorteo puede estar vacio:

```js
assignments: []
```

## Editar partidos

Los partidos de fase de grupos estan en `matches` dentro de `data.js`.

Cada partido tiene:

- `number`: numero de partido
- `a` y `b`: codigos de los paises
- `group`: grupo
- `date`: fecha
- `time`: hora
- `venue`: sede

Los horarios vienen del Match Schedule oficial de FIFA y estan convertidos a hora del Centro de Mexico.

## Actualizar bracket

El bracket esta en `bracket.rounds` dentro de `data.js`.

Para actualizar un resultado:

1. Cambia `scoreA` y `scoreB`.
2. Ajusta `winner` con el codigo del pais ganador.
3. Si cambia el campeon, actualiza `bracket.champion`.

## Cambiar video del sorteo

La repeticion del sorteo se configura en `drawVideoUrl` dentro de `data.js`. Puedes usar una URL normal de YouTube, `youtu.be` o formato embed:

```js
drawVideoUrl: "https://www.youtube.com/watch?v=ID_DEL_VIDEO"
```

## Bracket desplegable

El bracket se muestra por rondas cerradas por default. Los usuarios pueden abrir Dieciseisavos, Octavos, Cuartos, Semifinales o Finales desde el menu de cada ronda.

## Publicar cambios

Despues de editar, guarda los archivos y ejecuta:

```bash
git add .
git commit -m "Actualiza datos del sorteo"
git push
```

Vercel publicara automaticamente los cambios cuando detecte el `push` en el repositorio conectado.

## Deploy en Vercel

Este proyecto esta listo para desplegarse como sitio estatico. En Vercel:

1. Importa el repositorio de GitHub.
2. Usa la configuracion por defecto.
3. No configures comando de build.
4. Deja el directorio de salida vacio o como raiz del proyecto.
