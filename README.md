# mundial-sorteo-2026

Portal web estatico para consultar participantes, paises asignados, partidos de fase de grupos y bracket del sorteo del Mundial 2026.

## Abrir localmente

Abre `index.html` directamente en el navegador. No requiere backend, base de datos, APIs ni proceso de build.

## Editar asignaciones desde Google Sheets

Para cambiar asignaciones sin volver a desplegar en Vercel, usa Google Sheets detras de un Web App de Apps Script.

La hoja necesita solo dos columnas:

```csv
name,teamCode
Aaron Escobar,POR
Carlos Escobar,MEX
```

Configura el backend:

1. Crea un proyecto en Apps Script.
2. Pega el contenido de `apps-script/Code.gs`.
3. En `SHEET_ID`, confirma el ID de tu Google Sheet.
4. Despliega como Web App con:
   - Ejecutar como: `Yo`
   - Quien tiene acceso: `Cualquier persona`
5. Copia la URL `/exec` del Web App.
6. En Vercel, crea la variable de entorno `APPS_SCRIPT_API_URL` con esa URL.
7. Redeploya el proyecto en Vercel.

Despues de eso, edita solo las filas de Google Sheets. Al refrescar el sitio, se leeran los datos nuevos. La hoja puede quedar privada; los visitantes solo leen `/api/assignments`, que llama al Web App desde Vercel.

Detalles:

- La primera columna es el nombre del participante y alimenta el combo "Buscar por participante".
- La segunda columna es el codigo del pais, por ejemplo `MEX`, `ARG`, `POR`. Puede quedar vacia antes del sorteo.
- Cada participante aparece una sola vez.
- Cada participante tiene maximo un pais asignado.
- Un pais solo puede tener una asignacion.
- Si la hoja esta vacia, el portal mostrara los paises como `Sin asignar`.

`assignments` queda como respaldo local por si no se configura `APPS_SCRIPT_API_URL`. Antes del sorteo puede estar vacio:

```js
assignments: []
```

`googleSheetCsvUrl` es solo un respaldo opcional por CSV publico. Para proteger la hoja, dejalo vacio.

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

El bracket esta vacio antes del torneo:

```js
bracket: {
  rounds: [],
  champion: ""
}
```

Cuando el torneo avance, agrega las rondas en `bracket.rounds` dentro de `data.js`.

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
