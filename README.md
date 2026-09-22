# Pointix File Hub

Un centro visual para crear, organizar y abrir distintos tipos de archivo sin perder la sensación de estar dentro de Obsidian.

## Beta 0.1

- Selector visual desde la cinta lateral y la paleta de comandos.
- Notas Markdown, texto, Canvas, Bases, CSV, JSON y HTML.
- Integración por detección con Sheet Plus y Excalidraw.
- Documentos Word, Excel y PowerPoint mediante plantillas válidas del usuario.
- Vista **File Shell** para archivos que se editan con una aplicación externa.
- Favoritos, búsqueda, categorías y archivos recientes.
- Sin telemetría, cuentas ni conexiones de red.
- Diseño adaptable para escritorio y móvil.

### Corrección de seguridad 0.1.1

Las plantillas de Office se validan como archivos reales con la extensión correspondiente. Las carpetas y las rutas incompatibles se rechazan antes de cualquier operación de copia.

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

Un `.docx`, `.xlsx` o `.pptx` real es un paquete comprimido, no un archivo de texto vacío. Para preservar compatibilidad, configura una plantilla válida de cada formato en los ajustes del complemento. Pointix hará una copia con el nombre y la ubicación elegidos.

## Filosofía de privacidad

Pointix File Hub trabaja exclusivamente con la bóveda local mediante las APIs de Obsidian. No incluye telemetría ni transmite nombres, rutas o contenido.

## Estado

Esta es una beta privada para pruebas. La publicación en Obsidian Community se preparará después de validar el flujo en Windows y Android.

## Licencia

MIT
