# Pointix File Hub

**Crea, conecta y encuentra todo sin perder el contexto de Obsidian.**

Pointix File Hub es un centro visual adaptable para crear notas y documentos, trabajar con formatos técnicos, abrir archivos de la bóveda, importar un único archivo desde el dispositivo y relacionar servicios web mediante fichas Markdown. Funciona en escritorio y móvil y no requiere una cuenta Pointix.

> **Estado:** beta pública para pruebas. Antes de utilizar una versión beta en una bóveda importante, conserva una copia de seguridad actualizada.

## Novedades de la beta 0.6.0

- Inicio compacto con **Recientes**, **Favoritos** y categorías dedicadas.
- Navegación separada: Notas, Documentos, Datos y código, Diseño, Multimedia, PDF, Almacenamiento e Integraciones.
- Sin estrellas permanentes: mantén presionada una tarjeta en Android o utiliza clic derecho en escritorio.
- Favoritos, mover al inicio, ocultar y organizar tarjetas por categoría.
- Reordenamiento mediante arrastre táctil o ratón, sin mover archivos de la bóveda.
- Vista móvil de lista compacta o cuadrícula configurable.
- Margen inferior seguro para evitar que los controles móviles de Obsidian cubran el catálogo.
- **Mis dispositivos:** importa exactamente un archivo mediante el selector oficial del sistema.
- **Centro PDF:** busca, abre, importa y relaciona PDF con notas de lectura.
- Multimedia y almacenamiento ahora son categorías independientes.
- 46 integraciones web, incluyendo Genially, Microsoft Forms, Joplin, Evernote, OneDrive, Yandex Disk, Box, Proton Drive, TeraBox, MEGA, pCloud y Nextcloud.

## Cómo abrir Pointix

- Icono **Pointix File Hub** en la cinta lateral.
- Comando `Pointix File Hub: Abrir selector de archivos`.
- Comando `Pointix File Hub: Crear archivo…` para el selector rápido.
- Menú contextual de un archivo no Markdown: `Abrir en Pointix File Hub`.

## Catálogo y funciones

### Inicio, búsqueda y personalización

- **Recientes:** conserva las seis opciones utilizadas más recientemente.
- **Favoritos:** accesos elegidos por el usuario sin llenar las tarjetas de estrellas.
- **Búsqueda instantánea:** encuentra formatos, funciones y servicios por nombre o descripción.
- **Pulsación prolongada / clic derecho:** abre las acciones de personalización.
- **Organizar categoría:** permite cambiar el orden visual mediante un tirador.
- **Ocultar:** retira una opción del catálogo sin desinstalar nada ni modificar archivos.
- **Restablecer catálogo:** recupera el orden original y todas las tarjetas desde Preferencias.
- **Paquetes:** permite activar únicamente las familias necesarias.

La organización del catálogo se guarda en las preferencias del complemento. Reordenar, ocultar o marcar favoritos **nunca mueve, renombra ni elimina archivos**.

### Notas inteligentes

Todas son notas Markdown estándar con propiedades compatibles con Obsidian, búsqueda, Bases, gráfico y otros complementos:

- Reunión: asistentes, agenda, decisiones, responsables y seguimiento.
- Proyecto: visión, estado, hitos, riesgos, recursos y próximos pasos.
- Tarea: resultado esperado, prioridad, ejecución y comprobación final.
- Diario: intención, agenda, registro y cierre consciente.
- Idea o brainstorm: exploración, evaluación y conversión en experimento.
- Cliente: datos, necesidades, historial, servicios y seguimiento.
- Incidencia o ticket: impacto, diagnóstico, solución y aprendizaje.
- Factura: control administrativo, importes, vencimiento y cobro.
- Libro o lectura, receta, código o snippet, contacto, evento, flashcard y referencia.

Pointix utiliza `.md` normal; no inventa extensiones especiales que puedan romper la compatibilidad.

### Documentos y oficina

- **Documento · Docs:** crea un DOCX válido para Microsoft Word, WPS Office, LibreOffice u otro editor compatible.
- **Hoja · Sheets:** crea un XLSX válido para Microsoft Excel, WPS Office o LibreOffice.
- **Presentación · Slides:** crea un PPTX válido para PowerPoint, WPS Office o LibreOffice.
- RTF, texto, HTML, CSV y Sheet Plus.
- Vista **File Shell** con nombre, ubicación, formato, tamaño, apertura externa y acceso a la carpeta en escritorio.

Los DOCX, XLSX y PPTX se generan desde plantillas binarias internas controladas. Pointix realiza una única escritura y no copia carpetas de la bóveda.

### Datos y código

Editor interno Pointix para JSON, YAML, XML, TOML, SQL, Python, JavaScript, TypeScript, Shell, BAT, Mermaid, SVG, OPML, Draw.io, FreeMind, BibTeX, vCard, iCalendar, Jupyter, HTML, CSV y texto.

- Guardado manual o con `Ctrl/Cmd + S`.
- Estado de cambios sin guardar.
- Validación sintáctica para JSON e IPYNB antes de guardar.
- Cada acción crea exactamente el archivo solicitado.

### Diseño y diagramas

- Canvas nativo de Obsidian.
- Excalidraw mediante su API oficial cuando el complemento está instalado y activo.
- Mermaid, SVG, Draw.io y FreeMind.
- Integraciones con Figma, Canva, Genially, Miro, Mural, Lucidchart, Whimsical, Framer, Microsoft Visio y Yandex Boards.

### Centro PDF

- Buscar por nombre o carpeta dentro de la bóveda.
- Abrir directamente en el visor de Obsidian.
- Importar un único PDF desde el selector del sistema.
- Crear una nota compañera con estado de lectura, progreso, resumen, citas, anotaciones y conexiones.
- Mantener el PDF original sin modificar cuando se trabaja mediante una nota compañera.

La beta 0.6.0 no promete editar físicamente el contenido del PDF. Resaltado incrustado, formularios, firma y guardado directo requieren una capa especializada y se estudiarán con copias de recuperación antes de incorporarse.

### Multimedia

Pointix crea notas compañeras para imagen, audio, video y EPUB:

- Enlace interno al archivo original.
- Vista incrustada cuando Obsidian admite el formato.
- Resumen, fuente, estado y anotaciones.
- Marcas de tiempo para audio y video.
- Archivo original sin alteraciones.

### Mis dispositivos

Utiliza el selector oficial de Android, Windows, macOS o iOS para elegir **un único archivo**. Pointix:

- No solicita una carpeta completa.
- No recorre directorios.
- No examina otros archivos vecinos.
- No importa más de un elemento por operación.
- Rechaza archivos superiores al límite seguro de 500 MB.
- Crea una copia nueva dentro de la carpeta elegida de la bóveda.

### Almacenamiento

Fichas enlazadas para Google Drive, OneDrive, Yandex Disk, Dropbox, Box, Proton Drive, TeraBox, MEGA, pCloud y Nextcloud.

Pointix no sincroniza estas nubes ni almacena sus credenciales. El contenido continúa bajo el control del proveedor y de sus permisos.

### Integraciones web

El catálogo incluye 46 servicios distribuidos entre:

- Gestión de proyectos: Trello, Asana, ClickUp, Notion y Jira.
- Diseño visual: Figma, Canva, Genially, Miro, Mural, Lucidchart, Whimsical, Framer, Visio y Yandex Boards.
- Comunicación: Slack, Discord, Microsoft Teams y Loom.
- Productividad y formularios: Calendly, Google Calendar, Yandex Calendar, Airtable, Typeform, Google Forms, Microsoft Forms y Yandex Forms.
- Notas y conocimiento: Joplin y Evernote.
- Desarrollo: GitHub, GitLab, CodePen y Replit.
- Multimedia: YouTube y Vimeo.
- Oficina web: Google Sheets.
- Almacenamiento: diez proveedores comunes y Nextcloud autohospedado.

Cada integración genera una ficha Markdown con enlace, categoría, acceso declarado, modo de compatibilidad, contexto, estado, responsables, revisión y anotaciones. Ofrece apertura dentro de Obsidian y una salida segura al navegador externo.

Los servicios pueden bloquear el visor integrado, cookies o autenticación. Pointix no promete que todos funcionen igual: conserva el enlace y muestra una ruta de recuperación cuando aparece un error 401 o de inicio de sesión.

## Seguridad y privacidad

- Sin telemetría.
- Sin cuenta Pointix.
- Sin solicitudes de red desde el complemento.
- No solicita ni guarda contraseñas de servicios externos.
- Bloquea rutas absolutas, segmentos `..` y rutas excesivamente profundas.
- Impide ejecuciones duplicadas simultáneas para el mismo archivo.
- No contiene operaciones para copiar, recorrer, mover, renombrar o borrar carpetas de la bóveda.
- Las integraciones rechazan páginas de acceso conocidas y validan el dominio del servicio.
- 20 pruebas automáticas verifican catálogo, plantillas, creación única y ausencia de operaciones recursivas o destructivas.

## Instalación de la beta

### BRAT

1. Instala y activa **BRAT** en Obsidian.
2. Ejecuta `BRAT: Add a beta plugin for testing`.
3. Pega `https://github.com/ExplorerAS/Pointix-File-Hub`.
4. Conserva activada la actualización automática de BRAT si deseas recibir nuevas betas.
5. Activa **Pointix File Hub** en `Preferencias → Complementos comunitarios`.

### Instalación manual

Copia `manifest.json`, `main.js` y `styles.css` en:

```text
TuBóveda/.obsidian/plugins/pointix-file-hub/
```

Reinicia Obsidian y activa el complemento.

## Compatibilidad y complementos opcionales

- Obsidian 1.5.0 o posterior.
- Android, iOS, Windows, macOS y Linux.
- Excalidraw es opcional para crear dibujos reales.
- Sheet Plus es opcional para libros `.univer`.
- Word, Excel, PowerPoint, WPS Office o LibreOffice se utilizan según las aplicaciones instaladas por el usuario.

## Ideas, sugerencias y soporte

- Abre una [idea o reporte en GitHub](https://github.com/ExplorerAS/Pointix-File-Hub/issues).
- Consulta la [guía de soporte](SUPPORT.md).
- Correo de contacto y sugerencias: **[servicios.globix@gmail.com](mailto:servicios.globix@gmail.com)**.

Nunca envíes contraseñas, claves, bóvedas completas ni notas privadas en un reporte.

## Invítanos un café

Si Pointix File Hub te ayuda a trabajar mejor, puedes apoyar su desarrollo en **[Ko-fi: ExplorerIT](https://ko-fi.com/exprorerit)**. El apoyo es voluntario y ayuda a mantener el proyecto útil, privado, documentado y accesible para la comunidad.

## Licencia

MIT
