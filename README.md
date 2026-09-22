# Pointix File Hub

Un centro visual para crear, organizar y abrir distintos tipos de archivo sin perder la sensación de estar dentro de Obsidian.

## Beta 0.5

- Selector visual desde la cinta lateral y la paleta de comandos.
- Notas Markdown, texto, Canvas, Bases, CSV, JSON y HTML.
- Editor interno Pointix para JSON, TXT, CSV y HTML, con validación de JSON.
- Integración por detección con Sheet Plus.
- Creación y apertura de dibujos reales mediante la API oficial de Excalidraw.
- Documentos Word, Excel y PowerPoint mediante plantillas internas controladas.
- Paquetes configurables para mostrar solo las familias de archivos que cada persona necesita.
- Ocho notas inteligentes: reunión, proyecto, tarea, diario, idea, cliente, incidencia y factura.
- Plantillas enriquecidas con etapas, tablas, responsables, criterios y bloques visuales adaptados a cada tipo de nota.
- Buscador de PDF dentro de la bóveda con apertura directa en el visor nativo de Obsidian.
- Importación explícita de un único PDF desde el equipo, sin recorrer ni copiar carpetas.
- Notas compañeras para PDF, imagen, audio y video, enlazadas al archivo original.
- Quince notas inteligentes y doce formatos de texto adicionales editables dentro de Pointix.
- Nueve paquetes activables: Esenciales, Oficina, Notas inteligentes, Código, Datos, Visual, Multimedia, Académico y Negocios.
- Vista **File Shell** para archivos que se editan con una aplicación externa.
- Favoritos, búsqueda, categorías y archivos recientes.
- Sin telemetría, cuentas ni conexiones de red.
- Diseño adaptable para escritorio y móvil.

### Reconstrucción de seguridad 0.2.0

La creación de Office ya no acepta rutas de plantillas ni copia contenido existente. Cada documento se escribe una sola vez desde un recurso binario interno. Las rutas absolutas, recorridos `..` y ejecuciones duplicadas se bloquean.

## Arquitectura del catálogo

Pointix distingue entre archivos reales, notas inteligentes e integraciones. No utiliza extensiones inventadas para las notas: todas son Markdown estándar con propiedades compatibles con búsqueda, Bases, gráfico y otros complementos.

### Notas inteligentes

Reunión, proyecto, tarea, diario, idea, cliente, incidencia, factura, lectura, receta, snippet, contacto, evento, flashcard y referencia.

### Formatos editables

JSON, YAML, XML, TOML, SQL, Python, JavaScript, TypeScript, Shell, BAT, Mermaid, SVG, OPML, RTF, Draw.io, FreeMind, BibTeX, vCard, iCalendar, Jupyter, HTML, CSV y texto.

### Multimedia relacionada

Pointix puede crear una nota compañera Markdown para PDF, imagen, audio, video o EPUB. La nota incluye el enlace interno, vista incrustada cuando Obsidian la admite, estado, resumen, anotaciones y marcas de tiempo para audio y video.

### Integraciones web

Pointix incluye un catálogo organizado de 34 servicios para proyectos, diseño, comunicación, productividad, desarrollo, multimedia y almacenamiento. Entre ellos están Figma, Canva, Microsoft Visio, Yandex Boards, Yandex Calendar, Yandex Forms, Google Sheets, Notion, Trello, GitHub, YouTube y Dropbox.

Cada integración se guarda como una ficha Markdown estándar con:

- Enlace directo validado contra el servicio elegido.
- Acceso declarado: público para visualizar, público para editar o privado.
- Modo de compatibilidad visible.
- Contexto, estado, responsables, revisión y anotaciones.
- Apertura dentro de Obsidian y ruta segura al navegador externo.
- Ayuda específica ante errores 401, bloqueos de inserción o inicios de sesión incompatibles.

Pointix rechaza enlaces de páginas de autenticación conocidas y nunca solicita ni conserva contraseñas. Los permisos reales continúan bajo el control de cada servicio; Pointix no crea archivos falsos ni afirma editar localmente contenido alojado en la web.

## Instalación para pruebas

### BRAT

1. Instala y activa **BRAT** en Obsidian.
2. Abre `BRAT: Add a beta plugin for testing`.
3. Pega la URL de este repositorio.
4. Activa **Pointix File Hub** en Complementos de la comunidad.

### Manual

Copia `manifest.json`, `main.js` y `styles.css` en:

```text
TuBóveda/.obsidian/plugins/pointix-file-hub/
```

Reinicia Obsidian y activa el complemento.

## Office sin archivos dañados

Un `.docx`, `.xlsx` o `.pptx` real es un paquete comprimido, no un archivo de texto vacío. Pointix incluye paquetes mínimos válidos y los escribe directamente como un único archivo nuevo; nunca recorre ni copia carpetas de la bóveda.

## Filosofía de privacidad

Pointix File Hub trabaja exclusivamente con la bóveda local mediante las APIs de Obsidian. No incluye telemetría ni transmite nombres, rutas o contenido.

## Estado

Esta es una beta privada para pruebas. La publicación en Obsidian Community se preparará después de validar el flujo en Windows y Android.

## Ideas, sugerencias y soporte

Puedes abrir una [idea o reporte en GitHub](https://github.com/ExplorerAS/Pointix-File-Hub/issues) o escribir a [servicios.globix@gmail.com](mailto:servicios.globix@gmail.com). Consulta también [SUPPORT.md](SUPPORT.md).

## Apoyar el proyecto

Si Pointix File Hub te resulta útil, puedes [invitarnos un café en Ko-fi](https://ko-fi.com/exprorerit). Tu apoyo ayuda a mantener el complemento privado, seguro y accesible para la comunidad.

## Licencia

MIT
