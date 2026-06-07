# mundial-sorteo-2026

Portal web estatico para consultar participantes, paises asignados, partidos de fase de grupos y bracket del sorteo del Mundial 2026.

## Abrir localmente

Abre `index.html` directamente en el navegador. No requiere backend, base de datos, APIs ni proceso de build.

## Editar asignaciones

Las asignaciones se controlan en `data.js`.

- `countries` contiene los 48 paises en orden.
- `assignments` contiene la relacion editable entre participante y pais.
- Cada asignacion usa `participantName` y `teamCode`.
- Un participante puede aparecer varias veces si tiene varios paises.

Para cambiar el sorteo, edita solamente `assignments`. Ejemplo:

```js
{ participantName: "Carlos Escobar", teamCode: "MEX" }
```

Si un pais no aparece en `assignments`, el portal mostrara `Sin asignar`.

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

## Contador de visitas

El contador discreto del footer se configura en `visitCounterUrl` dentro de `data.js`. Como el sitio es estatico y no tiene backend propio, el conteo depende de un servicio externo de contador por imagen.

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
