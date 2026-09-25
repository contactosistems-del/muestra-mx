# MUESTRA.MX

Portal de opinión pública, noticias y sondeos electorales.  
Hecho con **Angular 22** y **Firebase** (Firestore + Auth). Despliegue en **Vercel**.

Sitio: [muestra.mx](https://muestra.mx) (o la URL de tu proyecto en Vercel).

---

## Qué hace la web

- Muestra noticias, entrevista destacada y patrocinio editables desde un panel de administración.
- Publica encuestas con N candidatos; el público vota y solo ve **porcentajes**.
- El admin ve mapa de votos, detalle geográfico y puede exportar CSV.
- Un voto por encuesta y por dispositivo (celular o computadora).
- Interfaz en **español e inglés**.

---

## Características

| Público | Administración |
| --- | --- |
| Inicio, noticias, entrevista, La Mañanera, contacto | Doble clic en el logo → login con correo/contraseña de Firebase |
| Participar en encuestas activas (`/encuesta/id`) | Crear/editar/eliminar encuestas y candidatos |
| Ver % en vivo (sin datos personales) | Mapa, registros, sincronizar %, liberar voto del dispositivo |
| Chatbot simple de ayuda | CMS: destacada, publicidad, entrevista y noticias |
| Cambiar idioma ES / EN | Exportar votos a CSV |

**Colecciones Firestore:** `encuestas`, `votos`, `voto_dispositivo`, `resultados_encuestas`, `noticias`, `contenido`.

---

## Requisitos

- [Node.js](https://nodejs.org/) 20 o superior (incluye `npm`)
- Cuenta de Firebase del proyecto `muestramx-61d39` (o la tuya, cambiando `src/environments/`)
- Reglas de Firestore publicadas (archivo `firebase/firestore.rules`)

---

## Levantar el proyecto en local

```bash
# 1. Entrar a la carpeta del proyecto
cd muestra-mx

# 2. Instalar dependencias (solo la primera vez o si cambia package.json)
npm install

# 3. Arrancar el servidor de desarrollo
npm start
```

Abre en el navegador: **http://127.0.0.1:4200**

Otros comandos:

```bash
npm run build    # Genera la versión lista para publicar (carpeta dist/)
npm run watch    # Compila en modo desarrollo al guardar cambios
```

### Primera vez con Firebase

1. En [Firebase Console](https://console.firebase.google.com/) → Authentication: activa **Correo/contraseña** y crea el usuario admin.
2. Firestore → Reglas: pega el contenido de `firebase/firestore.rules` y pulsa **Publicar**.
3. En el sitio local, doble clic en el logo, inicia sesión.
4. En **Encuestas**, usa **Cargar Playa y Tulum** si aún no hay sondeos (o crea los tuyos).

La configuración de Firebase ya está en:

- `src/environments/environment.ts` (producción)
- `src/environments/environment.development.ts` (local)

---

## Cómo entrar al panel admin

1. Doble clic en el logo **MUESTRA.MX**.
2. Inicia sesión con el correo y contraseña del admin de Firebase.
3. Verás el monitor (mapa, votos, CSV) y pestañas para encuestas, contenido y noticias.

Para poder votar otra vez en el mismo dispositivo (pruebas): botón **Liberar voto de este dispositivo**.

---

## Publicar (Vercel)

El repo ya incluye `vercel.json`:

- Build: `npm run build`
- Salida: `dist/muestra-app/browser`
- SPA: todas las rutas van a `index.html`

Conecta el repositorio en Vercel y despliega. No hace falta Cloud Functions ni plan Blaze: todo corre en el cliente + Firestore.

---

## Estructura del código (resumen)

```
src/app/
  domain/     Modelos (encuesta, noticia, voto…)
  data/       Lectura/escritura en Firestore
  core/       Auth, idiomas, dispositivo, servicios
  features/   Páginas públicas, encuestas y admin
public/       Imágenes y favicon
firebase/     Reglas de Firestore
```

---

## Notas importantes

- El público **no** ve IPs ni ubicaciones; solo porcentajes.
- Las imágenes de noticias/CMS se guardan comprimidas en Firestore (no se usa Firebase Storage).
- Un dispositivo = un voto por encuesta; otras encuestas sí se pueden contestar.
- Si el mapa o el GPS no cargan, revisa permisos del navegador y conexión a internet.
