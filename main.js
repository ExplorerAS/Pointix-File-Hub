const {
  Plugin,
  ItemView,
  Modal,
  Notice,
  PluginSettingTab,
  Setting,
  normalizePath,
  setIcon,
  Platform,
  TFile,
  addIcon,
} = require("obsidian");

const HUB_VIEW = "pointix-file-hub-view";
const SHELL_VIEW = "pointix-file-shell-view";
// Textos del encabezado del Hub (edítalos aquí).
const HERO_EYEBROW = "POINTIX WORKSPACE";
const HERO_TITLE = "Tu trabajo, por fin en un solo lugar.";
const HERO_TEXT = "Crea, abre y conecta notas, documentos, IA y nubes sin saltar de una aplicación a otra.";
const DEFAULT_TEMPLATES_FOLDER = "Pointix/Mis plantillas";
const START_TITLE = "Pointix File Hub";
const START_HINT = "Crea, abre y conecta";
// Icono propio: una cuadrícula de tarjetas con un «+» (usa currentColor para adaptarse a cualquier tema).
const POINTIX_ICON_SVG = '<rect x="10" y="10" width="80" height="80" rx="22" fill="none" stroke="currentColor" stroke-width="7"/>'
  + '<rect x="29" y="29" width="18" height="18" rx="5" fill="currentColor"/>'
  + '<rect x="53" y="29" width="18" height="18" rx="5" fill="currentColor" opacity="0.6"/>'
  + '<rect x="29" y="53" width="18" height="18" rx="5" fill="currentColor" opacity="0.6"/>'
  + '<path d="M62 53v18M53 62h18" stroke="currentColor" stroke-width="6.5" stroke-linecap="round"/>';

// Subcategorías dentro de cada categoría, para encontrar los formatos rápido.
const SUBGROUP_BY_ID = Object.freeze({
  docx: "Documentos de Office", xlsx: "Documentos de Office", pptx: "Documentos de Office", rtf: "Documentos de Office", univer: "Documentos de Office",
  markdown: "Notas y texto", text: "Notas y texto", "device-file": "Desde tu equipo",
  csv: "Tablas y datos", base: "Tablas y datos", json: "Tablas y datos",
  yaml: "Configuración", xml: "Configuración", toml: "Configuración",
  vcard: "Contactos, agenda y bibliografía", calendar: "Contactos, agenda y bibliografía", bibtex: "Contactos, agenda y bibliografía", opml: "Contactos, agenda y bibliografía",
  sql: "Código y scripts", python: "Código y scripts", javascript: "Código y scripts", typescript: "Código y scripts", shell: "Código y scripts", batch: "Código y scripts", html: "Código y scripts", jupyter: "Código y scripts",
  canvas: "Lienzos y dibujo", excalidraw: "Lienzos y dibujo",
  mermaid: "Diagramas y gráficos", svg: "Diagramas y gráficos", drawio: "Diagramas y gráficos", freemind: "Diagramas y gráficos",
});

const PACKS = Object.freeze([
  { id: "essentials", name: "Esenciales", description: "Notas, texto y herramientas nativas de Obsidian." },
  { id: "smart-notes", name: "Notas inteligentes", description: "Plantillas útiles con estructura y propiedades listas para trabajar." },
  { id: "office", name: "Oficina", description: "Word, Excel, PowerPoint y hojas de cálculo." },
  { id: "data", name: "Datos", description: "Bases, CSV y formatos estructurados." },
  { id: "code", name: "Código", description: "Archivos web, configuración y desarrollo." },
  { id: "visual", name: "Visual", description: "Canvas, Excalidraw y herramientas de diagramación." },
  { id: "multimedia", name: "Multimedia", description: "Archivos audiovisuales enlazados con notas compañeras." },
  { id: "academic", name: "Académico", description: "Lectura, estudio, flashcards y referencias." },
  { id: "business", name: "Negocios", description: "Contactos, clientes, incidencias y control administrativo." },
  { id: "ai", name: "IA", description: "Asistentes de inteligencia artificial y sus conversaciones enlazadas." },
]);
const DEFAULT_SETTINGS = {
  defaultFolder: "",
  favoriteIds: ["markdown", "canvas", "docx", "xlsx"],
  recentIds: [],
  hiddenIds: [],
  categoryOrder: {},
  mobileView: "list",
  openAfterCreate: true,
  enabledPacks: PACKS.map((pack) => pack.id),
  templatesFolder: DEFAULT_TEMPLATES_FOLDER,
  showStartEntry: true,
  showTabBarButton: true,
  openOnStartup: false,
  pinHubTab: false,
  catalogVersion: 7,
};

// Every integration must declare a real web workspace, a user-specific server,
// or explicitly state that no web application exists. Keeping this separate
// from the visual catalog makes incomplete routes impossible to ship silently.
const INTEGRATION_ROUTES = Object.freeze({
  "trello-link": { hasWebApp: true, webAppUrl: "https://trello.com/", webAppStatus: "Aplicación web oficial" },
  "asana-link": { hasWebApp: true, webAppUrl: "https://app.asana.com/", webAppStatus: "Aplicación web oficial" },
  "clickup-link": { hasWebApp: true, webAppUrl: "https://app.clickup.com/", webAppStatus: "Aplicación web oficial" },
  "notion-link": { hasWebApp: true, webAppUrl: "https://www.notion.so/", webAppStatus: "Aplicación web oficial" },
  "jira-link": { webAppUserProvided: true, webAppPlaceholder: "https://tu-empresa.atlassian.net/", webAppStatus: "La dirección depende del sitio de Atlassian de la organización" },
  "figma-link": { hasWebApp: true, webAppUrl: "https://www.figma.com/files/", webAppStatus: "Aplicación web oficial" },
  "canva-link": { hasWebApp: true, webAppUrl: "https://www.canva.com/", webAppStatus: "Aplicación web oficial" },
  "miro-link": { hasWebApp: true, webAppUrl: "https://miro.com/app/dashboard/", webAppStatus: "Aplicación web oficial" },
  "mural-link": { hasWebApp: true, webAppUrl: "https://app.mural.co/", webAppStatus: "Aplicación web oficial" },
  "lucidchart-link": { hasWebApp: true, webAppUrl: "https://lucid.app/", webAppStatus: "Aplicación web oficial" },
  "whimsical-link": { hasWebApp: true, webAppUrl: "https://whimsical.com/", webAppStatus: "Aplicación web oficial" },
  "framer-link": { hasWebApp: true, webAppUrl: "https://framer.com/projects/", webAppStatus: "Aplicación web oficial" },
  "visio-link": { hasWebApp: true, webAppUrl: "https://www.microsoft365.com/launch/visio", webAppStatus: "Microsoft 365; puede requerir una licencia compatible" },
  "yandex-boards-link": { hasWebApp: true, webAppUrl: "https://boards.yandex.ru/", webAppStatus: "Aplicación web oficial de Yandex" },
  "genially-link": { hasWebApp: true, webAppUrl: "https://app.genially.com/", webAppStatus: "Aplicación web oficial" },
  "excalidraw-web-link": {},
  "slack-link": { hasWebApp: true, webAppUrl: "https://app.slack.com/", webAppStatus: "Aplicación web oficial; el espacio de trabajo puede solicitar su dominio" },
  "discord-link": { hasWebApp: true, webAppUrl: "https://discord.com/app", webAppStatus: "Aplicación web oficial" },
  "teams-link": { hasWebApp: true, webAppUrl: "https://teams.microsoft.com/", webAppStatus: "Aplicación web oficial" },
  "loom-link": { hasWebApp: true, webAppUrl: "https://www.loom.com/home", webAppStatus: "Aplicación web oficial" },
  "whatsapp-link": {},
  "telegram-link": {},
  "calendly-link": { hasWebApp: true, webAppUrl: "https://calendly.com/app/", webAppStatus: "Aplicación web oficial" },
  "google-calendar-link": { hasWebApp: true, webAppUrl: "https://calendar.google.com/calendar/u/0/r", webAppStatus: "Google puede restringir el inicio de sesión en navegadores embebidos" },
  "yandex-calendar-link": { hasWebApp: true, webAppUrl: "https://calendar.yandex.com/", webAppStatus: "Aplicación web oficial de Yandex" },
  "airtable-link": { hasWebApp: true, webAppUrl: "https://airtable.com/", webAppStatus: "Aplicación web oficial" },
  "typeform-link": { hasWebApp: true, webAppUrl: "https://admin.typeform.com/", webAppStatus: "Aplicación web oficial" },
  "google-forms-link": {},
  "yandex-forms-link": { hasWebApp: true, webAppUrl: "https://forms.yandex.com/admin/", webAppStatus: "Aplicación web oficial de Yandex" },
  "microsoft-forms-link": { hasWebApp: true, webAppUrl: "https://forms.office.com/", webAppStatus: "Aplicación web oficial de Microsoft 365" },
  "joplin-link": { hasWebApp: false, webAppUrl: undefined, webAppStatus: "Joplin no ofrece un editor web; Joplin Cloud es sincronización y publicación", appProtocols: ["joplin:"], appUrlPlaceholder: "joplin://x-callback-url/openNote?id=…" },
  "evernote-link": { hasWebApp: true },
  "standard-notes-link": { hasWebApp: true },
  "notesnook-link": {},
  "simplenote-link": {},
  "upnote-link": {},
  "github-link": { hasWebApp: true, webAppUrl: "https://github.com/", webAppStatus: "Aplicación web oficial" },
  "gitlab-link": { hasWebApp: true, webAppUrl: "https://gitlab.com/", webAppStatus: "GitLab.com; una instalación autohospedada usa su propia dirección" },
  "codepen-link": { hasWebApp: true, webAppUrl: "https://codepen.io/your-work/", webAppStatus: "Aplicación web oficial" },
  "replit-link": { hasWebApp: true, webAppUrl: "https://replit.com/~", webAppStatus: "Aplicación web oficial" },
  "google-sheets-link": {},
  "youtube-link": { hasWebApp: true, webAppUrl: "https://www.youtube.com/", webAppStatus: "Aplicación web oficial" },
  "vimeo-link": { hasWebApp: true, webAppUrl: "https://vimeo.com/manage/videos", webAppStatus: "Aplicación web oficial" },
  "google-drive-link": {},
  "onedrive-link": { hasWebApp: true, webAppUrl: "https://onedrive.live.com/", webAppStatus: "OneDrive personal; cuentas empresariales pueden redirigir a su tenant de Microsoft 365" },
  "yandex-disk-link": { hasWebApp: true, webAppUrl: "https://disk.yandex.com/client/disk", webAppStatus: "Aplicación web oficial de Yandex Disk" },
  "dropbox-link": { hasWebApp: true, webAppUrl: "https://www.dropbox.com/home", webAppStatus: "Aplicación web oficial" },
  "box-link": { hasWebApp: true, webAppUrl: "https://app.box.com/folder/0", webAppStatus: "Aplicación web oficial", appProtocols: ["https:", "boxapp:"], appUrlPlaceholder: "boxapp://file?id=…" },
  "proton-drive-link": { hasWebApp: true, webAppUrl: "https://drive.proton.me/", webAppStatus: "Aplicación web oficial" },
  "terabox-link": { hasWebApp: true, webAppUrl: "https://www.terabox.com/main", webAppStatus: "Aplicación web oficial; la disponibilidad puede variar por región" },
  "mega-link": { hasWebApp: true, webAppUrl: "https://mega.nz/fm", webAppStatus: "Aplicación web oficial" },
  "pcloud-link": { hasWebApp: true, webAppUrl: "https://my.pcloud.com/", webAppStatus: "Aplicación web oficial" },
  "chatgpt-link": { hasWebApp: true, webAppUrl: "https://chatgpt.com/", webAppStatus: "Aplicación web oficial; requiere cuenta para conversar" },
  "claude-link": { hasWebApp: true, webAppUrl: "https://claude.ai/", webAppStatus: "Aplicación web oficial; requiere cuenta" },
  "gemini-link": { hasWebApp: true, webAppUrl: "https://gemini.google.com/app", webAppStatus: "Google puede restringir el inicio de sesión en navegadores embebidos" },
  "copilot-link": { hasWebApp: true, webAppUrl: "https://copilot.microsoft.com/", webAppStatus: "Aplicación web oficial de Microsoft" },
  "perplexity-link": { hasWebApp: true, webAppUrl: "https://www.perplexity.ai/", webAppStatus: "Aplicación web oficial" },
  "grok-link": { hasWebApp: true, webAppUrl: "https://grok.com/", webAppStatus: "Aplicación web oficial de xAI" },
  "mistral-link": { hasWebApp: true, webAppUrl: "https://chat.mistral.ai/", webAppStatus: "Le Chat, aplicación web oficial de Mistral AI" },
  "deepseek-link": { hasWebApp: true, webAppUrl: "https://chat.deepseek.com/", webAppStatus: "Aplicación web oficial de DeepSeek" },
  "qwen-link": { hasWebApp: true, webAppUrl: "https://chat.qwen.ai/", webAppStatus: "Aplicación web oficial de Qwen (Alibaba Cloud)" },
  "kimi-link": { hasWebApp: true, webAppUrl: "https://www.kimi.com/", webAppStatus: "Aplicación web oficial de Moonshot AI" },
  "zai-link": { hasWebApp: true, webAppUrl: "https://chat.z.ai/", webAppStatus: "Aplicación web oficial de Z.ai" },
  "hunyuan-link": { hasWebApp: true, webAppUrl: "https://hy.tencent.ai/", webAppStatus: "Aplicación web de Tencent Hy (Hunyuan); requiere cuenta" },
  "wenxin-link": { hasWebApp: true, webAppUrl: "https://wenxin.baidu.com/", webAppStatus: "Asistente Wenxin de Baidu; puede requerir cuenta de Baidu" },
  "yuanbao-link": { hasWebApp: true, webAppUrl: "https://yuanbao.tencent.com/", webAppStatus: "Aplicación web de Tencent Yuanbao; puede requerir cuenta de WeChat o QQ" },
  "alice-link": { hasWebApp: true, webAppUrl: "https://alice.yandex.ru/", webAppStatus: "Alice AI, asistente oficial de Yandex; se usa con tu cuenta de Yandex" },
  "yandex-aistudio-link": { hasWebApp: true, webAppUrl: "https://aistudio.yandex.ru/", webAppStatus: "Yandex AI Studio: plataforma de modelos y agentes; se usa con tu cuenta de Yandex" },
  "nextcloud-link": { webAppUserProvided: true, webAppPlaceholder: "https://nube.tu-organizacion.com/", webAppStatus: "Nextcloud es autohospedado; la dirección depende del servidor del usuario" },
});

const WEB_INTEGRATIONS = Object.freeze([
  // Gestión de proyectos
  { id: "trello-link", service: "Trello", group: "Gestión de proyectos", description: "Tableros, listas y tarjetas", icon: "columns-3", color: "blue", pack: "business", domains: ["trello.com"], mode: "Híbrida" },
  { id: "asana-link", service: "Asana", group: "Gestión de proyectos", description: "Proyectos, tareas y seguimiento", icon: "circle-check-big", color: "pink", pack: "business", domains: ["asana.com", "app.asana.com"], mode: "Navegador" },
  { id: "clickup-link", service: "ClickUp", group: "Gestión de proyectos", description: "Espacios, tareas y documentos", icon: "list-checks", color: "violet", pack: "business", domains: ["clickup.com", "app.clickup.com"], mode: "Navegador" },
  { id: "notion-link", service: "Notion", group: "Gestión de proyectos", description: "Páginas públicas y bases de datos", icon: "notebook", color: "blue", pack: "business", domains: ["notion.so", "notion.site"], mode: "Híbrida" },
  { id: "jira-link", service: "Jira", group: "Gestión de proyectos", description: "Proyectos, incidencias y desarrollo", icon: "panels-top-left", color: "blue", pack: "business", domains: ["atlassian.net", "jira.com"], allowCustomDomain: true, mode: "Navegador" },

  // Diseño y colaboración visual
  { id: "figma-link", service: "Figma", group: "Diseño visual", description: "Diseños, prototipos y FigJam", icon: "figma", color: "pink", pack: "visual", domains: ["figma.com"], mode: "Híbrida" },
  { id: "canva-link", service: "Canva", group: "Diseño visual", description: "Diseños y presentaciones compartidas", icon: "palette", color: "violet", pack: "visual", domains: ["canva.com"], mode: "Vista pública" },
  { id: "miro-link", service: "Miro", group: "Diseño visual", description: "Pizarras colaborativas", icon: "layout-dashboard", color: "blue", pack: "visual", domains: ["miro.com"], mode: "Híbrida" },
  { id: "mural-link", service: "Mural", group: "Diseño visual", description: "Talleres y colaboración visual", icon: "panels-top-left", color: "pink", pack: "visual", domains: ["mural.co"], mode: "Híbrida" },
  { id: "lucidchart-link", service: "Lucidchart", group: "Diseño visual", description: "Diagramas, procesos y flujos", icon: "workflow", color: "orange", pack: "visual", domains: ["lucid.app", "lucidchart.com"], mode: "Híbrida" },
  { id: "whimsical-link", service: "Whimsical", group: "Diseño visual", description: "Wireframes, mapas y diagramas", icon: "waypoints", color: "violet", pack: "visual", domains: ["whimsical.com"], mode: "Híbrida" },
  { id: "framer-link", service: "Framer", group: "Diseño visual", description: "Prototipos y sitios publicados", icon: "panels-top-left", color: "blue", pack: "visual", domains: ["framer.com", "framer.website"], mode: "Híbrida" },
  { id: "visio-link", service: "Microsoft Visio", group: "Diseño visual", description: "Diagramas de Visio alojados en Microsoft 365", icon: "network", color: "blue", pack: "visual", domains: ["office.com", "microsoft365.com", "sharepoint.com", "onedrive.live.com", "1drv.ms"], mode: "Navegador" },
  { id: "yandex-boards-link", service: "Yandex Boards", group: "Diseño visual", description: "Pizarras en línea para proyectos y equipos", icon: "layout-dashboard", color: "amber", pack: "visual", domains: ["boards.yandex.ru", "boards.yandex.com"], mode: "Requiere cuenta" },
  { id: "genially-link", service: "Genially", group: "Diseño visual", description: "Presentaciones, infografías y contenido interactivo", icon: "sparkles", color: "violet", pack: "visual", domains: ["genially.com", "view.genially.com"], mode: "Vista pública" },
  { id: "excalidraw-web-link", service: "Excalidraw Web", group: "Diseño visual", description: "Lienzos colaborativos y dibujos compartidos en Excalidraw", icon: "pen-tool", color: "pink", pack: "visual", domains: ["excalidraw.com"], mode: "Híbrida", hasWebApp: true, webAppUrl: "https://excalidraw.com", webAppStatus: "Oficial; el lienzo web es independiente del complemento local de Obsidian", appHelp: "Pega un enlace compartido de Excalidraw. En dispositivos que lo reconozcan, el sistema podrá ofrecer la aplicación o PWA instalada; Pointix no inventa un protocolo nativo.", publicLinkHelp: "Pega únicamente un enlace de un lienzo compartido. No publiques información sensible: quien tenga el enlace puede acceder según el modo de colaboración elegido." },

  // Comunicación
  { id: "slack-link", service: "Slack", group: "Comunicación", description: "Canales, hilos y mensajes concretos", icon: "message-square", color: "violet", pack: "business", domains: ["slack.com"], mode: "Requiere cuenta" },
  { id: "discord-link", service: "Discord", group: "Comunicación", description: "Servidores, canales e invitaciones", icon: "messages-square", color: "violet", pack: "business", domains: ["discord.com", "discord.gg"], mode: "Requiere cuenta" },
  { id: "teams-link", service: "Microsoft Teams", group: "Comunicación", description: "Reuniones, equipos y conversaciones", icon: "users-round", color: "blue", pack: "business", domains: ["teams.microsoft.com", "teams.live.com"], mode: "Requiere cuenta" },
  { id: "loom-link", service: "Loom", group: "Comunicación", description: "Videos explicativos y comentarios", icon: "video", color: "pink", pack: "multimedia", domains: ["loom.com"], mode: "Híbrida" },
  { id: "whatsapp-link", service: "WhatsApp", group: "Comunicación", description: "Chats directos, grupos y llamadas mediante enlaces oficiales", icon: "message-circle", color: "emerald", pack: "business", domains: ["wa.me", "api.whatsapp.com", "chat.whatsapp.com", "call.whatsapp.com"], mode: "Híbrida", hasWebApp: true, webAppUrl: "https://web.whatsapp.com", webAppStatus: "Oficial; requiere vincular o autenticar la cuenta y puede depender de las restricciones del navegador embebido", appDomains: ["wa.me", "api.whatsapp.com", "chat.whatsapp.com", "call.whatsapp.com"], appUrlPlaceholder: "https://wa.me/521…", appHelp: "Pega un enlace oficial wa.me, de grupo o de llamada. El enlace HTTPS permite que el sistema abra WhatsApp instalado cuando sea compatible; Pointix no almacena números ni mensajes.", publicLinkHelp: "WhatsApp no publica conversaciones para lectura o edición. Este campo guarda un enlace de contacto, grupo o llamada que requiere WhatsApp y los permisos correspondientes.", defaultAccess: "private", accessOptions: ["private"] },
  { id: "telegram-link", service: "Telegram", group: "Comunicación", description: "Chats, canales, grupos y mensajes mediante enlaces oficiales", icon: "send", color: "blue", pack: "business", domains: ["t.me", "telegram.me", "telegram.dog"], mode: "Híbrida", hasWebApp: true, webAppUrl: "https://web.telegram.org/a/", webAppStatus: "Oficial; el acceso a contenido privado requiere una sesión autorizada", appProtocols: ["https:", "tg:"], appDomains: ["t.me", "telegram.me", "telegram.dog"], appUrlPlaceholder: "tg://resolve?domain=usuario", appHelp: "Pega un enlace t.me o tg:// oficial para un usuario, grupo, canal, mensaje o invitación. Telegram registra ambos formatos como enlaces profundos del sistema.", publicLinkHelp: "Los enlaces públicos t.me pueden mostrar usuarios, canales, grupos o mensajes. Los enlaces privados e invitaciones requieren autorización y deben tratarse como información sensible." },

  // Productividad y formularios
  { id: "calendly-link", service: "Calendly", group: "Productividad y formularios", description: "Agendamiento y páginas de reserva", icon: "calendar-clock", color: "blue", pack: "business", domains: ["calendly.com"], mode: "Vista pública" },
  { id: "google-calendar-link", service: "Google Calendar", group: "Productividad y formularios", description: "Calendarios y eventos compartidos", icon: "calendar-days", color: "blue", pack: "business", domains: ["calendar.google.com"], mode: "Híbrida" },
  { id: "yandex-calendar-link", service: "Yandex Calendar", group: "Productividad y formularios", description: "Calendarios, eventos y agenda de Yandex", icon: "calendar-days", color: "amber", pack: "business", domains: ["calendar.yandex.ru", "calendar.yandex.com"], mode: "Requiere cuenta" },
  { id: "airtable-link", service: "Airtable", group: "Productividad y formularios", description: "Bases visuales y vistas compartidas", icon: "table-properties", color: "emerald", pack: "data", domains: ["airtable.com"], mode: "Híbrida" },
  { id: "typeform-link", service: "Typeform", group: "Productividad y formularios", description: "Formularios y encuestas", icon: "clipboard-list", color: "blue", pack: "business", domains: ["typeform.com"], mode: "Vista pública" },
  { id: "google-forms-link", service: "Google Forms", group: "Productividad y formularios", description: "Crear formularios, recopilar respuestas y enlazar vistas compartidas", icon: "clipboard-list", color: "violet", pack: "business", domains: ["docs.google.com", "forms.gle"], pathHint: "/forms/", mode: "Híbrida", hasWebApp: true, webAppUrl: "https://docs.google.com/forms/u/0/", webAppStatus: "Oficial; Google puede bloquear la autenticación dentro de navegadores embebidos", appHelp: "Pega el enlace HTTPS del formulario. En Android o iOS se abrirá mediante la aplicación o navegador que el sistema considere compatible; Google no publica un protocolo nativo exclusivo para Forms.", publicLinkHelp: "Usa el enlace publicado para responder o el enlace de colaboración para editar. Pointix documenta el acceso declarado, pero no cambia los permisos de Google." },
  { id: "yandex-forms-link", service: "Yandex Forms", group: "Productividad y formularios", description: "Encuestas, solicitudes, pruebas y cuestionarios", icon: "clipboard-list", color: "amber", pack: "business", domains: ["forms.yandex.ru", "forms.yandex.com"], mode: "Híbrida" },
  { id: "microsoft-forms-link", service: "Microsoft Forms", group: "Productividad y formularios", description: "Formularios, cuestionarios y respuestas de Microsoft 365", icon: "clipboard-check", color: "blue", pack: "business", domains: ["forms.office.com", "forms.microsoft.com"], mode: "Híbrida" },

  // Notas y conocimiento
  { id: "joplin-link", service: "Joplin", group: "Notas y conocimiento", description: "Notas Markdown, cuadernos y Joplin Cloud", icon: "notebook-pen", color: "blue", pack: "smart-notes", domains: ["joplincloud.com", "joplinapp.org"], mode: "Híbrida", hasWebApp: true, webAppUrl: "https://app.joplincloud.com", webAppStatus: "Oficial; prueba el inicio de sesión desde el enlace de la ficha", appProtocols: ["joplin:"], appUrlPlaceholder: "joplin://x-callback-url/openNote?id=…", appHelp: "En Joplin, haz clic derecho sobre una nota, cuaderno o etiqueta y elige Copiar enlace externo.", importHelp: "Exporta desde Joplin como Markdown + Front Matter o JEX y selecciona manualmente el archivo exportado." },
  { id: "evernote-link", service: "Evernote", group: "Notas y conocimiento", description: "Notas y cuadernos; migración mediante ENEX o HTML", icon: "notebook-tabs", color: "emerald", pack: "smart-notes", domains: ["evernote.com"], mode: "Híbrida", webAppUrl: "https://www.evernote.com/client/web", importHelp: "Exporta manualmente uno o varios cuadernos como ENEX o HTML desde Evernote de escritorio." },
  { id: "standard-notes-link", service: "Standard Notes", group: "Notas y conocimiento", description: "Notas cifradas, editores y respaldos portables", icon: "shield-check", color: "violet", pack: "smart-notes", domains: ["standardnotes.com", "app.standardnotes.com"], mode: "Híbrida", webAppUrl: "https://app.standardnotes.com", importHelp: "Descarga un respaldo descifrado; el ZIP incluye notas individuales en texto plano que puedes importar manualmente a la bóveda." },
  { id: "notesnook-link", service: "Notesnook", group: "Notas y conocimiento", description: "Notas privadas, cuadernos y respaldos cifrados", icon: "lock-keyhole", color: "blue", pack: "smart-notes", domains: ["notesnook.com", "app.notesnook.com", "monogr.ph"], mode: "Híbrida", hasWebApp: true, webAppUrl: "https://app.notesnook.com", webAppStatus: "Oficial; permite iniciar sesión y trabajar con las notas desde la aplicación web", appProtocols: ["https:", "nn:"], appDomains: ["notesnook.com", "app.notesnook.com", "monogr.ph"], appUrlPlaceholder: "nn://note/<id>", appHelp: "En Notesnook copia el enlace interno de una nota, cuaderno, etiqueta o color. Los enlaces nn:// abren directamente la aplicación instalada.", publicLinkHelp: "Opcional. Pega un enlace Monograph publicado por Notesnook. Es de lectura y puede tener contraseña o autodestrucción; no lo declares como edición pública.", accessOptions: ["public-view", "private"], importHelp: "Exporta desde Notesnook como Markdown, HTML o texto y selecciona manualmente los archivos que quieras conservar en Obsidian." },
  { id: "simplenote-link", service: "Simplenote", group: "Notas y conocimiento", description: "Notas ligeras sincronizadas y publicables", icon: "notebook", color: "blue", pack: "smart-notes", domains: ["simplenote.com", "app.simplenote.com"], mode: "Híbrida", hasWebApp: true, webAppUrl: "https://app.simplenote.com", webAppStatus: "Oficial; permite iniciar sesión y trabajar con las notas desde el navegador", appHelp: "Simplenote no documenta un protocolo externo estable para abrir una nota concreta en la aplicación instalada. Usa el enlace HTTPS publicado o la aplicación web mientras esa ruta no esté confirmada.", publicLinkHelp: "Opcional. Pega el enlace publicado por Simplenote para consultar la nota. La colaboración editable requiere invitar a otra cuenta y no equivale a una publicación anónima.", accessOptions: ["public-view", "private"], importHelp: "Exporta tus notas como ZIP; selecciona manualmente los TXT o Markdown que quieras incorporar." },
  { id: "upnote-link", service: "UpNote", group: "Notas y conocimiento", description: "Notas, espacios y cuadernos multiplataforma", icon: "notebook-tabs", color: "amber", pack: "smart-notes", domains: ["getupnote.com", "app.getupnote.com"], mode: "Híbrida", hasWebApp: false, appHelp: "UpNote no ofrece una aplicación web de edición ni un protocolo profundo oficial confirmado. Puedes guardar una nota publicada de lectura o importar manualmente una exportación.", publicLinkHelp: "Pega una nota publicada desde UpNote. La publicación es de lectura y requiere UpNote Premium; no la declares como edición pública.", accessOptions: ["public-view", "private"], importHelp: "La exportación completa se realiza desde UpNote de escritorio; usa Markdown para notas simples o HTML para conservar más formato y adjuntos." },

  // Desarrollo
  { id: "github-link", service: "GitHub", group: "Desarrollo", description: "Repositorios, incidencias y pull requests", icon: "github", color: "violet", pack: "code", domains: ["github.com"], mode: "Híbrida" },
  { id: "gitlab-link", service: "GitLab", group: "Desarrollo", description: "Repositorios y proyectos de código", icon: "git-branch", color: "orange", pack: "code", domains: ["gitlab.com"], allowCustomDomain: true, mode: "Híbrida" },
  { id: "codepen-link", service: "CodePen", group: "Desarrollo", description: "Demos y fragmentos web", icon: "code-2", color: "blue", pack: "code", domains: ["codepen.io"], mode: "Vista pública" },
  { id: "replit-link", service: "Replit", group: "Desarrollo", description: "Proyectos y aplicaciones en la nube", icon: "square-code", color: "orange", pack: "code", domains: ["replit.com"], mode: "Híbrida" },

  // Oficina web
  { id: "google-sheets-link", service: "Google Sheets", group: "Oficina web", description: "Hojas de cálculo compartidas", icon: "sheet", color: "emerald", pack: "office", domains: ["docs.google.com"], pathHint: "/spreadsheets/d/", mode: "Híbrida", hasWebApp: true, webAppUrl: "https://docs.google.com/spreadsheets/u/0/", webAppStatus: "Oficial; Google puede bloquear la autenticación dentro de navegadores embebidos", appHelp: "Pega el enlace HTTPS de una hoja concreta. En Android o iOS el sistema puede ofrecer Google Sheets instalado; en escritorio se utilizará la experiencia web oficial.", publicLinkHelp: "Opcional. Pega el enlace compartido de una hoja, no la página de inicio ni la cuenta de Google. Los permisos para ver, comentar o editar siguen controlados por Google." },

  // Multimedia
  { id: "youtube-link", service: "YouTube", group: "Multimedia", description: "Videos, listas y transmisiones", icon: "youtube", color: "pink", pack: "multimedia", domains: ["youtube.com", "youtu.be"], mode: "Vista pública" },
  { id: "vimeo-link", service: "Vimeo", group: "Multimedia", description: "Videos y presentaciones", icon: "video", color: "blue", pack: "multimedia", domains: ["vimeo.com"], mode: "Vista pública" },

  // Inteligencia artificial
  { id: "chatgpt-link", service: "ChatGPT", group: "Inteligencia artificial", subgroup: "Estados Unidos y Europa", description: "Conversaciones, proyectos y archivos generados", icon: "bot", color: "emerald", pack: "ai", domains: ["chatgpt.com", "chat.openai.com"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://chatgpt.com/share/…", appHelp: "Opcional. Pega un enlace https de ChatGPT: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación compartida (por ejemplo https://chatgpt.com/share/…). Quien tenga ese enlace puede verla.", importHelp: "Descarga o copia el resultado desde ChatGPT y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "claude-link", service: "Claude", group: "Inteligencia artificial", subgroup: "Estados Unidos y Europa", description: "Conversaciones y proyectos con Claude", icon: "sparkles", color: "orange", pack: "ai", domains: ["claude.ai"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://claude.ai/share/…", appHelp: "Opcional. Pega un enlace https de Claude: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación compartida (por ejemplo https://claude.ai/share/…). Quien tenga ese enlace puede verla.", importHelp: "Descarga o copia el resultado desde Claude y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "gemini-link", service: "Gemini", group: "Inteligencia artificial", subgroup: "Estados Unidos y Europa", description: "Asistente de Google con búsqueda y archivos", icon: "sparkles", color: "blue", pack: "ai", domains: ["gemini.google.com", "g.co"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://gemini.google.com/share/…", appHelp: "Opcional. Pega un enlace https de Gemini: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación compartida (por ejemplo https://gemini.google.com/share/…). Quien tenga ese enlace puede verla.", importHelp: "Descarga o copia el resultado desde Gemini y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "copilot-link", service: "Microsoft Copilot", group: "Inteligencia artificial", subgroup: "Estados Unidos y Europa", description: "Asistente de Microsoft para conversar y crear", icon: "bot", color: "blue", pack: "ai", domains: ["copilot.microsoft.com"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://copilot.microsoft.com/…", appHelp: "Opcional. Pega un enlace https de Microsoft Copilot: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación compartida (por ejemplo https://copilot.microsoft.com/…). Quien tenga ese enlace puede verla.", importHelp: "Descarga o copia el resultado desde Microsoft Copilot y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "perplexity-link", service: "Perplexity", group: "Inteligencia artificial", subgroup: "Estados Unidos y Europa", description: "Respuestas con fuentes citadas", icon: "search", color: "violet", pack: "ai", domains: ["perplexity.ai"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://www.perplexity.ai/search/…", appHelp: "Opcional. Pega un enlace https de Perplexity: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación compartida (por ejemplo https://www.perplexity.ai/search/…). Quien tenga ese enlace puede verla.", importHelp: "Descarga o copia el resultado desde Perplexity y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "grok-link", service: "Grok", group: "Inteligencia artificial", subgroup: "Estados Unidos y Europa", description: "Asistente de xAI", icon: "bot", color: "violet", pack: "ai", domains: ["grok.com"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://grok.com/share/…", appHelp: "Opcional. Pega un enlace https de Grok: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación compartida (por ejemplo https://grok.com/share/…). Quien tenga ese enlace puede verla.", importHelp: "Descarga o copia el resultado desde Grok y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "mistral-link", service: "Mistral Le Chat", group: "Inteligencia artificial", subgroup: "Estados Unidos y Europa", description: "Asistente europeo de Mistral AI", icon: "bot", color: "amber", pack: "ai", domains: ["chat.mistral.ai", "mistral.ai"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://chat.mistral.ai/…", appHelp: "Opcional. Pega un enlace https de Mistral Le Chat: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación compartida (por ejemplo https://chat.mistral.ai/…). Quien tenga ese enlace puede verla.", importHelp: "Descarga o copia el resultado desde Mistral Le Chat y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "deepseek-link", service: "DeepSeek", group: "Inteligencia artificial", subgroup: "China", description: "Asistente para razonar y programar", icon: "brain-circuit", color: "blue", pack: "ai", domains: ["deepseek.com"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://chat.deepseek.com/share/…", appHelp: "Opcional. Pega un enlace https de DeepSeek: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación compartida (por ejemplo https://chat.deepseek.com/share/…). Quien tenga ese enlace puede verla.", importHelp: "Descarga o copia el resultado desde DeepSeek y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "qwen-link", service: "Qwen", group: "Inteligencia artificial", subgroup: "China", description: "Asistente de Alibaba Cloud", icon: "bot", color: "violet", pack: "ai", domains: ["qwen.ai"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://chat.qwen.ai/s/…", appHelp: "Opcional. Pega un enlace https de Qwen: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación compartida (por ejemplo https://chat.qwen.ai/s/…). Quien tenga ese enlace puede verla.", importHelp: "Descarga o copia el resultado desde Qwen y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "kimi-link", service: "Kimi", group: "Inteligencia artificial", subgroup: "China", description: "Asistente de Moonshot AI con contexto largo", icon: "bot", color: "pink", pack: "ai", domains: ["kimi.com"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://www.kimi.com/share/…", appHelp: "Opcional. Pega un enlace https de Kimi: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación compartida (por ejemplo https://www.kimi.com/share/…). Quien tenga ese enlace puede verla.", importHelp: "Descarga o copia el resultado desde Kimi y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "zai-link", service: "Z.ai", group: "Inteligencia artificial", subgroup: "China", description: "Asistente con los modelos GLM", icon: "bot", color: "emerald", pack: "ai", domains: ["z.ai"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://chat.z.ai/s/…", appHelp: "Opcional. Pega un enlace https de Z.ai: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación compartida (por ejemplo https://chat.z.ai/s/…). Quien tenga ese enlace puede verla.", importHelp: "Descarga o copia el resultado desde Z.ai y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "hunyuan-link", service: "Tencent Hy (Hunyuan)", group: "Inteligencia artificial", subgroup: "China", description: "Asistente de Tencent con los modelos Hunyuan", icon: "bot", color: "blue", pack: "ai", domains: ["hy.tencent.ai"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://hy.tencent.ai/…", appHelp: "Opcional. Pega un enlace https de Tencent Hy (Hunyuan): en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación o de un recurso de Tencent Hy (Hunyuan). Quien tenga ese enlace puede verlo.", importHelp: "Descarga o copia el resultado desde Tencent Hy (Hunyuan) y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "wenxin-link", service: "Baidu Wenxin", group: "Inteligencia artificial", subgroup: "China", description: "Asistente de Baidu para buscar, escribir y crear", icon: "bot", color: "pink", pack: "ai", domains: ["wenxin.baidu.com", "chat.baidu.com"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://wenxin.baidu.com/…", appHelp: "Opcional. Pega un enlace https de Baidu Wenxin: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación o de un recurso de Baidu Wenxin. Quien tenga ese enlace puede verlo.", importHelp: "Descarga o copia el resultado desde Baidu Wenxin y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "yuanbao-link", service: "Tencent Yuanbao", group: "Inteligencia artificial", subgroup: "China", description: "Asistente de Tencent con búsqueda y lectura de documentos", icon: "sparkles", color: "emerald", pack: "ai", domains: ["yuanbao.tencent.com"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://yuanbao.tencent.com/…", appHelp: "Opcional. Pega un enlace https de Tencent Yuanbao: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación o de un recurso de Tencent Yuanbao. Quien tenga ese enlace puede verlo.", importHelp: "Descarga o copia el resultado desde Tencent Yuanbao y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "alice-link", service: "Alice AI", group: "Inteligencia artificial", subgroup: "Rusia", description: "Asistente de Yandex con texto e imágenes", icon: "bot", color: "amber", pack: "ai", domains: ["alice.yandex.ru"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://alice.yandex.ru/…", appHelp: "Opcional. Pega un enlace https de Alice AI: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación o de un recurso de Alice AI. Quien tenga ese enlace puede verlo.", importHelp: "Descarga o copia el resultado desde Alice AI y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },
  { id: "yandex-aistudio-link", service: "Yandex AI Studio", group: "Inteligencia artificial", subgroup: "Rusia", description: "Modelos y agentes de Yandex en una sola plataforma", icon: "bot", color: "amber", pack: "ai", domains: ["aistudio.yandex.ru"], mode: "Híbrida", defaultAccess: "private", appUrlPlaceholder: "https://aistudio.yandex.ru/…", appHelp: "Opcional. Pega un enlace https de Yandex AI Studio: en el teléfono o la tableta el sistema puede abrir la app oficial si está instalada; si no, se abre el navegador.", publicLinkHelp: "Opcional. Pega el enlace de una conversación o de un recurso de Yandex AI Studio. Quien tenga ese enlace puede verlo.", importHelp: "Descarga o copia el resultado desde Yandex AI Studio y usa Mis dispositivos para traer solo ese archivo a la carpeta de tu proyecto." },

  // Almacenamiento
  { id: "google-drive-link", service: "Google Drive", group: "Almacenamiento", description: "Archivos y carpetas compartidos", icon: "hard-drive", color: "blue", pack: "office", domains: ["drive.google.com", "docs.google.com"], mode: "Híbrida", hasWebApp: true, webAppUrl: "https://drive.google.com/drive/my-drive", webAppStatus: "Oficial; Google puede bloquear el inicio de sesión dentro de navegadores embebidos", appHelp: "En Android o iOS, pega el enlace del archivo o carpeta de Drive para que el sistema pueda ofrecer la app instalada. En escritorio se abrirá la experiencia web oficial." },
  { id: "onedrive-link", service: "OneDrive", group: "Almacenamiento", description: "Archivos de Microsoft y vínculos compartidos", icon: "cloud", color: "blue", pack: "office", domains: ["onedrive.live.com", "1drv.ms", "sharepoint.com"], mode: "Híbrida" },
  { id: "yandex-disk-link", service: "Yandex Disk", group: "Almacenamiento", description: "Archivos y carpetas de Yandex Disk", icon: "hard-drive", color: "amber", pack: "office", domains: ["disk.yandex.ru", "disk.yandex.com", "yadi.sk"], mode: "Híbrida" },
  { id: "dropbox-link", service: "Dropbox", group: "Almacenamiento", description: "Archivos y carpetas en la nube", icon: "box", color: "blue", pack: "office", domains: ["dropbox.com", "db.tt"], mode: "Híbrida" },
  { id: "box-link", service: "Box", group: "Almacenamiento", description: "Archivos empresariales y enlaces compartidos", icon: "archive", color: "blue", pack: "office", domains: ["box.com", "app.box.com"], mode: "Híbrida" },
  { id: "proton-drive-link", service: "Proton Drive", group: "Almacenamiento", description: "Archivos cifrados y enlaces compartidos", icon: "shield-check", color: "violet", pack: "office", domains: ["drive.proton.me", "proton.me"], mode: "Navegador" },
  { id: "terabox-link", service: "TeraBox", group: "Almacenamiento", description: "Archivos y enlaces compartidos en TeraBox", icon: "cloud", color: "blue", pack: "office", domains: ["terabox.com", "1024tera.com"], mode: "Navegador" },
  { id: "mega-link", service: "MEGA", group: "Almacenamiento", description: "Archivos y carpetas compartidos con cifrado", icon: "cloud", color: "pink", pack: "office", domains: ["mega.nz"], mode: "Navegador" },
  { id: "pcloud-link", service: "pCloud", group: "Almacenamiento", description: "Archivos, carpetas y enlaces públicos", icon: "cloud", color: "blue", pack: "office", domains: ["pcloud.com", "my.pcloud.com", "e.pcloud.link"], mode: "Híbrida" },
  { id: "nextcloud-link", service: "Nextcloud", group: "Almacenamiento", description: "Nube privada o autohospedada", icon: "cloud-cog", color: "blue", pack: "office", domains: [], allowCustomDomain: true, mode: "Híbrida" },
].map((item) => ({ ...item, ...(INTEGRATION_ROUTES[item.id] || {}), name: item.service, ext: "md", category: "Integraciones", action: "web-link" })));

const OFFICE_TEMPLATES = Object.freeze({
  docx: "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",
  xlsx: "UEsDBBQAAAAIABggNl1Gx01IlQAAAM0AAAAQAAAAZG9jUHJvcHMvYXBwLnhtbE3PTQvCMAwG4L9SdreZih6kDkQ9ip68zy51hbYpbYT67+0EP255ecgboi6JIia2mEXxLuRtMzLHDUDWI/o+y8qhiqHke64x3YGMsRoPpB8eA8OibdeAhTEMOMzit7Dp1C5GZ3XPlkJ3sjpRJsPiWDQ6sScfq9wcChDneiU+ixNLOZcrBf+LU8sVU57mym/8ZAW/B7oXUEsDBBQAAAAIABggNl29D4OqEgEAAI0CAAARAAAAZG9jUHJvcHMvY29yZS54bWzNkl1LwzAUhv9K6X132k6Ghq43yvBiwsCB4l1MzrZg80FyRrt/bxq3DtEb77wKyXnzPC8hjXBMWI8bbx16UhiyQXcmMOGW+YHIMYAgDqh5mMWEicOd9ZpT3Po9OC4++B6hLssFaCQuOXEYgYWbiHnbSMGER07Wn/FSTHh39F2CSQHYoUZDAapZBXk7Gt1p6Bq4AhKMFHX4J9RavXubjQwZF2uyjVWG1JCtVCQ9Ht+TI3FHA6HX4UuJchKl019taQL5OTkENaX6vp/185SLr1TB69P6OT1ooUwgbgTGW0ExOjlc5hfzy/z+YbvK27qsF0V5V9T1tqpYWbKb27ex6bd+18LaSrVT/7jxpWDbwI+f134CUEsDBBQAAAAIABggNl2ZXJwjEAYAAJwnAAATAAAAeGwvdGhlbWUvdGhlbWUxLnhtbO1aW3PaOBR+76/QeGf2bQvGNoG2tBNzaXbbtJmE7U4fhRFYjWx5ZJGEf79HNhDLlg3tkk26mzwELOn7zkVH5+g4efPuLmLohoiU8nhg2S/b1ru3L97gVzIkEUEwGaev8MAKpUxetVppAMM4fckTEsPcgosIS3gUy9Zc4FsaLyPW6rTb3VaEaWyhGEdkYH1eLGhA0FRRWm9fILTlHzP4FctUjWWjARNXQSa5iLTy+WzF/NrePmXP6TodMoFuMBtYIH/Ob6fkTlqI4VTCxMBqZz9Wa8fR0kiAgsl9lAW6Sfaj0xUIMg07Op1YznZ89sTtn4zK2nQ0bRrg4/F4OLbL0otwHATgUbuewp30bL+kQQm0o2nQZNj22q6RpqqNU0/T933f65tonAqNW0/Ta3fd046Jxq3QeA2+8U+Hw66JxqvQdOtpJif9rmuk6RZoQkbj63oSFbXlQNMgAFhwdtbM0gOWXin6dZQa2R273UFc8FjuOYkR/sbFBNZp0hmWNEZynZAFDgA3xNFMUHyvQbaK4MKS0lyQ1s8ptVAaCJrIgfVHgiHF3K/99Ze7yaQzep19Os5rlH9pqwGn7bubz5P8c+jkn6eT101CznC8LAnx+yNbYYcnbjsTcjocZ0J8z/b2kaUlMs/v+QrrTjxnH1aWsF3Pz+SejHIju932WH32T0duI9epwLMi15RGJEWfyC265BE4tUkNMhM/CJ2GmGpQHAKkCTGWoYb4tMasEeATfbe+CMjfjYj3q2+aPVehWEnahPgQRhrinHPmc9Fs+welRtH2Vbzco5dYFQGXGN80qjUsxdZ4lcDxrZw8HRMSzZQLBkGGlyQmEqk5fk1IE/4rpdr+nNNA8JQvJPpKkY9psyOndCbN6DMawUavG3WHaNI8ev4F+Zw1ChyRGx0CZxuzRiGEabvwHq8kjpqtwhErQj5iGTYacrUWgbZxqYRgWhLG0XhO0rQR/FmsNZM+YMjszZF1ztaRDhGSXjdCPmLOi5ARvx6GOEqa7aJxWAT9nl7DScHogstm/bh+htUzbCyO90fUF0rkDyanP+kyNAejmlkJvYRWap+qhzQ+qB4yCgXxuR4+5Xp4CjeWxrxQroJ7Af/R2jfCq/iCwDl/Ln3Ppe+59D2h0rc3I31nwdOLW95GblvE+64x2tc0LihjV3LNyMdUr5Mp2DmfwOz9aD6e8e362SSEr5pZLSMWkEuBs0EkuPyLyvAqxAnoZFslCctU02U3ihKeQhtu6VP1SpXX5a+5KLg8W+Tpr6F0PizP+Txf57TNCzNDt3JL6raUvrUmOEr0scxwTh7LDDtnPJIdtnegHTX79l125COlMFOXQ7gaQr4Dbbqd3Do4npiRuQrTUpBvw/npxXga4jnZBLl9mFdt59jR0fvnwVGwo+88lh3HiPKiIe6hhpjPw0OHeXtfmGeVxlA0FG1srCQsRrdguNfxLBTgZGAtoAeDr1EC8lJVYDFbxgMrkKJ8TIxF6HDnl1xf49GS49umZbVuryl3GW0iUjnCaZgTZ6vK3mWxwVUdz1Vb8rC+aj20FU7P/lmtyJ8MEU4WCxJIY5QXpkqi8xlTvucrScRVOL9FM7YSlxi84+bHcU5TuBJ2tg8CMrm7Oal6ZTFnpvLfLQwJLFuIWRLiTV3t1eebnK56Inb6l3fBYPL9cMlHD+U751/0XUOufvbd4/pukztITJx5xREBdEUCI5UcBhYXMuRQ7pKQBhMBzZTJRPACgmSmHICY+gu98gy5KRXOrT45f0Usg4ZOXtIlEhSKsAwFIRdy4+/vk2p3jNf6LIFthFQyZNUXykOJwT0zckPYVCXzrtomC4Xb4lTNuxq+JmBLw3punS0n/9te1D20Fz1G86OZ4B6zh3OberjCRaz/WNYe+TLfOXDbOt4DXuYTLEOkfsF9ioqAEativrqvT/klnDu0e/GBIJv81tuk9t3gDHzUq1qlZCsRP0sHfB+SBmOMW/Q0X48UYq2msa3G2jEMeYBY8wyhZjjfh0WaGjPVi6w5jQpvQdVA5T/b1A1o9g00HJEFXjGZtjaj5E4KPNz+7w2wwsSO4e2LvwFQSwMEFAAAAAgAGCA2XZWeJQ4TAQAAzAEAABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWxNUV1PwyAU/SuEHzA6k6lZ2ibbjNEHk2ZGfWbrbUsG3Aq3Vv+9QNdmT5xzPw7nQD6iu/gOgNiv0dYXvCPqt0L4cwdG+hX2YEOnQWckBepa4XsHsk5LRou7LLsXRirLyzzVKlfmOJBWFirH/GCMdH970DgWfM3nwlG1HcWCKPNetvAO9NFXLjCxqNTKgPUKLXPQFHy33u7SfBr4VDD6G8xikhPiJZLXuuBZNAQazhQVZDh+4ABaR6Fg4/uqyZcr4+ItntWfU/aQ5SQ9HFB/qZq6gj9yVkMjB01HHF/gmmezGHySJGe5Ccecb9K1ynqmoQnj2ephw5mbdidC2Kd3OiERmgS78Nzg4kDoN4g0k2h9+cDyH1BLAwQUAAAACAAYIDZdfPOj3FECAAD2CQAADQAAAHhsL3N0eWxlcy54bWzdVtuK2zAQ/RXhD6iTmDVxSfJQQ2ChLQu7D31VYjkR6OLK8pL06zsjOXazq1kofatN8MwcnbkbZ9P7qxLPZyE8u2hl+m129r77nOf98Sw07z/ZThhAWus096C6U953TvCmR5JW+WqxKHPNpcl2GzPovfY9O9rB+G22yPLdprVmtiyzaICjXAv2ytU2q7mSByfDWa6lukbzCg1Hq6xjHlIRSAZL/yvCy6hhlqMfLY11aMxjhPDowalUakpglUXDbtNx74Uze1ACJxjfQWyUX64dZHBy/LpcPWQzITwgyMG6Rri7OqNpt1Gi9UBw8nTGp7ddjqD3VoPQSH6yhoccboxRALdHodQzjuhHe+f70rLY68cG28yw1JsICY1idBMV9P+nt+j7n92yTr5a/2WAakzQfw7WiycnWnkJ+qW9jz+FDoncRZ+sDJdjm33HnVOzC3YYpPLSjNpZNo0w72oD954fYKnv/MP5RrR8UP5lArfZLH8TjRx0NZ16wrLGU7P8FWe4LKfNhFjSNOIimnpU3ekQRAYCRB0vJLxF9uFKIxQnYmkEMSoOlQHFiSwqzv9Uz5qsJ2JUbusksiY5a5ITWSmkDjcVJ82p4EpXWlVFUZZUR+s6mUFN9a0s8Zf2RuWGDCoORvq7XtPTpjfk4z2gZvrRhlCV0ptIVUr3GpF035BRVelpU3GQQU2B2h2Mn46DO5XmFAVOlcqNeoNppKooBHcxvaNlSXSnxDs9H+otKYqqSiOIpTMoCgrBt5FGqAwwBwopivAdfPM9ym/fqXz+p7f7DVBLAwQUAAAACAAYIDZdl4q7HMAAAAATAgAACwAAAF9yZWxzLy5yZWxznZK5bsMwDEB/xdCeMAfQIYgzZfEWBPkBVqIP2BIFikWdv6/apXGQCxl5PTwS3B5pQO04pLaLqRj9EFJpWtW4AUi2JY9pzpFCrtQsHjWH0kBE22NDsFosPkAuGWa3vWQWp3OkV4hc152lPdsvT0FvgK86THFCaUhLMw7wzdJ/MvfzDDVF5UojlVsaeNPl/nbgSdGhIlgWmkXJ06IdpX8dx/aQ0+mvYyK0elvo+XFoVAqO3GMljHFitP41gskP7H4AUEsDBBQAAAAIABggNl0pn7DeNAEAACMCAAAPAAAAeGwvd29ya2Jvb2sueG1sjVHRTsMwDPyVKh9AuwkmMa28MMEmIZgY2nvWuqtZEleOu8G+HrdVxSReeErubF3uLosz8XFPdEy+vAsxN7VIM0/TWNTgbbyhBoJOKmJvRSEf0tgw2DLWAOJdOs2yWeotBvOwGLU2nF4DEigEKSjZETuEc/yddzA5YcQ9OpTv3PR3BybxGNDjBcrcZCaJNZ1XxHihINZtCybncjMZBjtgweIPve1Mfth97Bmx+3erRnIzy1SwQo7Sb/T6Vj2eQJcH1Ao9oRPgpRV4ZmobDIdORlOkVzH6HsZzKHHO/6mRqgoLWFLReggy9MjgOoMh1thEkwTrITcr+rRJH0hfWJdDOFFXV1XxHHXA63LwN5oqocIA5avqROW1oGLDSXf0OtPbu8m9FtE696jcW3ghW44Zx/95+AFQSwMEFAAAAAgAGCA2XSQem6KtAAAA+AEAABoAAAB4bC9fcmVscy93b3JrYm9vay54bWwucmVsc7WRPQ6DMAyFrxLlADVQqUMFTF1YKy4QBfMjEhLFrgq3L4UBkDp0YbKeLX/vyU6faBR3bqC28yRGawbKZMvs7wCkW7SKLs7jME9qF6ziWYYGvNK9ahCSKLpB2DNknu6Zopw8/kN0dd1pfDj9sjjwDzC8XeipRWQpShUa5EzCaLY2wVLiy0yWoqgyGYoqlnBaIOLJIG1pVn2wT06053kXN/dFrs3jCa7fDHB4dP4BUEsDBBQAAAAIABggNl1lkHmSGQEAAM8DAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbK2TTU7DMBCFrxJlWyUuLFigphtgC11wAWNPGqv+k2da0tszTtpKoBIVhU2seN68z56XrN6PEbDonfXYlB1RfBQCVQdOYh0ieK60ITlJ/Jq2Ikq1k1sQ98vlg1DBE3iqKHuU69UztHJvqXjpeRtN8E2ZwGJZPI3CzGpKGaM1ShLXxcHrH5TqRKi5c9BgZyIuWFCKq4Rc+R1w6ns7QEpGQ7GRiV6lY5XorUA6WsB62uLKGUPbGgU6qL3jlhpjAqmxAyBn69F0MU0mnjCMz7vZ/MFmCsjKTQoRObEEf8edI8ndVWQjSGSmr3ghsvXs+0FOW4O+kc3j/QxpN+SBYljmz/h7xhf/G87xEcLuvz+xvNZOGn/mi+E/Xn8BUEsBAhQDFAAAAAgAGCA2XUbHTUiVAAAAzQAAABAAAAAAAAAAAAAAAIABAAAAAGRvY1Byb3BzL2FwcC54bWxQSwECFAMUAAAACAAYIDZdvQ+DqhIBAACNAgAAEQAAAAAAAAAAAAAAgAHDAAAAZG9jUHJvcHMvY29yZS54bWxQSwECFAMUAAAACAAYIDZdmVycIxAGAACcJwAAEwAAAAAAAAAAAAAAgAEEAgAAeGwvdGhlbWUvdGhlbWUxLnhtbFBLAQIUAxQAAAAIABggNl2VniUOEwEAAMwBAAAYAAAAAAAAAAAAAACAgUUIAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWxQSwECFAMUAAAACAAYIDZdfPOj3FECAAD2CQAADQAAAAAAAAAAAAAAgAGOCQAAeGwvc3R5bGVzLnhtbFBLAQIUAxQAAAAIABggNl2XirscwAAAABMCAAALAAAAAAAAAAAAAACAAQoMAABfcmVscy8ucmVsc1BLAQIUAxQAAAAIABggNl0pn7DeNAEAACMCAAAPAAAAAAAAAAAAAACAAfMMAAB4bC93b3JrYm9vay54bWxQSwECFAMUAAAACAAYIDZdJB6boq0AAAD4AQAAGgAAAAAAAAAAAAAAgAFUDgAAeGwvX3JlbHMvd29ya2Jvb2sueG1sLnJlbHNQSwECFAMUAAAACAAYIDZdZZB5khkBAADPAwAAEwAAAAAAAAAAAAAAgAE5DwAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLBQYAAAAACQAJAD4CAACDEAAAAAA=",
  pptx: "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",
});

const FILE_TYPES = [
  { id: "markdown", name: "Nota", description: "Markdown nativo y conectado", ext: "md", icon: "notebook-pen", category: "Notas", color: "violet", content: ({ title }) => `# ${title}\n\n` },
  { id: "meeting-note", name: "Nota de reunión", description: "Agenda, decisiones, responsables y seguimiento", ext: "md", icon: "users", category: "Plantillas", pack: "smart-notes", color: "violet", content: ({ title }) => smartNote("reunion", title, `> [!info] Ficha de la reunión\n> **Fecha:** ${today()}  ·  **Hora:**  ·  **Lugar / enlace:**  ·  **Facilitador:**\n\n## Propósito y resultado esperado\n\n> Resume en una frase por qué existe esta reunión y qué debe quedar resuelto.\n\n## Participantes\n\n| Persona | Rol | Presente |\n|---|---|:---:|\n|  |  | ☐ |\n\n## Agenda\n\n1. \n2. \n\n## Notas clave\n\n- \n\n## Decisiones\n\n| Decisión | Motivo | Responsable |\n|---|---|---|\n|  |  |  |\n\n## Acciones acordadas\n\n- [ ] Acción — **Responsable:**  — **Fecha:**\n\n## Seguimiento\n\n> [!success] Cierre\n> Registra aquí la conclusión y la fecha de la próxima revisión.`) },
  { id: "project-note", name: "Nota de proyecto", description: "Visión, etapas, hitos, riesgos y próximos pasos", ext: "md", icon: "folder-kanban", category: "Plantillas", pack: "smart-notes", color: "blue", content: ({ title }) => smartNote("proyecto", title, `> [!abstract] Resumen ejecutivo\n> **Etapa:** Descubrimiento  ·  **Responsable:**  ·  **Inicio:** ${today()}  ·  **Objetivo:**\n\n## Visión y alcance\n\n### Resultado esperado\n\n### Incluye\n\n- \n\n### Fuera de alcance\n\n- \n\n## Ruta del proyecto\n\n| Etapa | Entregable | Estado | Fecha |\n|---|---|---|---|\n| Descubrimiento | Definición y requisitos | 🟡 En curso |  |\n| Ejecución | Entregable principal | ⚪ Pendiente |  |\n| Validación | Pruebas y aprobación | ⚪ Pendiente |  |\n| Cierre | Documentación y entrega | ⚪ Pendiente |  |\n\n## Tareas activas\n\n- [ ] Próxima acción — **Responsable:**  — **Fecha:**\n\n## Riesgos y decisiones\n\n| Tipo | Detalle | Impacto | Respuesta |\n|---|---|---|---|\n| Riesgo |  |  |  |\n\n## Recursos relacionados\n\n- \n\n## Registro de avances\n\n### ${today()}\n\n- `) },
  { id: "task-note", name: "Nota de tarea", description: "Resultado, prioridad, ejecución y comprobación final", ext: "md", icon: "circle-check-big", category: "Plantillas", pack: "smart-notes", color: "emerald", content: ({ title }) => smartNote("tarea", title, `> [!todo] Control de la tarea\n> **Estado:** Pendiente  ·  **Prioridad:** Media  ·  **Responsable:**  ·  **Vence:**\n\n## Resultado terminado\n\n> Describe cómo sabrás que esta tarea quedó realmente completa.\n\n## Contexto\n\n- **Origen:**\n- **Relacionado con:**\n- **Bloqueos:** Ninguno\n\n## Plan de ejecución\n\n- [ ] Preparar\n- [ ] Ejecutar\n- [ ] Revisar\n- [ ] Entregar o comunicar\n\n## Recursos y notas\n\n- \n\n## Criterios de aceptación\n\n- [ ] El resultado cumple lo solicitado\n- [ ] Se verificó antes de cerrar\n- [ ] Se documentó lo necesario\n\n> [!success] Cierre\n> **Completada:**  ·  **Resultado / evidencia:**`) },
  { id: "daily-note", name: "Nota de diario", description: "Intención, agenda, registro y cierre consciente", ext: "md", icon: "calendar-days", category: "Plantillas", pack: "smart-notes", color: "amber", content: ({ title }) => smartNote("diario", title, `> [!quote] ${today()}\n> **Intención del día:**\n\n## Tres prioridades\n\n- [ ] 1.\n- [ ] 2.\n- [ ] 3.\n\n## Agenda y compromisos\n\n| Hora | Actividad | Preparación |\n|---:|---|---|\n|  |  |  |\n\n## Registro del día\n\n### Mañana\n\n### Tarde\n\n### Noche\n\n## Capturas rápidas\n\n- **Idea:**\n- **Pendiente:**\n- **Aprendizaje:**\n\n## Cierre\n\n- **Lo mejor de hoy:**\n- **Qué puedo mejorar:**\n- **Qué pasa a mañana:**`) },
  { id: "idea-note", name: "Idea / Brainstorm", description: "Explora, evalúa y convierte una idea en experimento", ext: "md", icon: "lightbulb", category: "Plantillas", pack: "smart-notes", color: "orange", content: ({ title }) => smartNote("idea", title, `> [!tip] Idea central\n> Explícala en una frase clara, sin intentar perfeccionarla todavía.\n\n## Problema u oportunidad\n\n- **Para quién:**\n- **Qué sucede hoy:**\n- **Por qué importa:**\n\n## Exploración libre\n\n- \n- \n- \n\n## Alternativas\n\n| Opción | Valor | Esfuerzo | Riesgo |\n|---|---:|---:|---:|\n|  | Alto / Medio / Bajo | Alto / Medio / Bajo | Alto / Medio / Bajo |\n\n## La apuesta\n\n> Si hacemos **___**, entonces **___**, porque **___**.\n\n## Experimento mínimo\n\n- [ ] Acción más pequeña para validar la idea\n- **Señal de éxito:**\n- **Fecha de revisión:**\n\n## Conexiones\n\n- [[ ]]`) },
  { id: "client-note", name: "Nota de cliente", description: "Relación, necesidades, servicios e historial organizado", ext: "md", icon: "contact", category: "Plantillas", pack: "smart-notes", color: "blue", content: ({ title }) => smartNote("cliente", title, `> [!info] Ficha del cliente\n> **Estado:** Prospecto  ·  **Responsable:**  ·  **Último contacto:** ${today()}\n\n## Contactos\n\n| Nombre | Cargo | Correo | Teléfono | Preferencia |\n|---|---|---|---|---|\n|  |  |  |  |  |\n\n## Perfil y contexto\n\n- **Organización:**\n- **Sector:**\n- **Necesidad principal:**\n- **Objetivo del cliente:**\n\n## Servicios y acuerdos\n\n| Servicio | Estado | Inicio | Renovación |\n|---|---|---|---|\n|  |  |  |  |\n\n## Historial\n\n### ${today()} — Primer registro\n\n- \n\n## Compromisos y próximos pasos\n\n- [ ] Acción — **Responsable:**  — **Fecha:**\n\n> [!warning] Información sensible\n> Evita guardar contraseñas, datos bancarios o identificaciones personales en esta nota.`) },
  { id: "ticket-note", name: "Incidencia / Ticket", description: "Impacto, diagnóstico, solución y aprendizaje", ext: "md", icon: "ticket-check", category: "Plantillas", pack: "smart-notes", color: "pink", content: ({ title }) => smartNote("incidencia", title, `> [!danger] Resumen de incidencia\n> **Estado:** Abierto  ·  **Severidad:** Media  ·  **Reportado:** ${today()}  ·  **Responsable:**\n\n## Impacto\n\n- **Personas o servicios afectados:**\n- **Desde cuándo:**\n- **Alcance:**\n\n## Comportamiento observado\n\n### Pasos para reproducir\n\n1. \n2. \n3. \n\n### Resultado esperado\n\n### Resultado actual\n\n## Evidencias\n\n- Captura, registro o enlace:\n\n## Diagnóstico\n\n| Hora | Hipótesis / acción | Resultado |\n|---:|---|---|\n|  |  |  |\n\n## Resolución\n\n- **Causa raíz:**\n- **Solución aplicada:**\n- **Verificación:**\n\n## Prevención y seguimiento\n\n- [ ] Acción preventiva — **Responsable:**  — **Fecha:**\n\n> [!success] Cierre\n> **Resuelto:**  ·  **Tiempo total:**  ·  **Aprendizaje:**`) },
  { id: "invoice-note", name: "Nota de factura", description: "Control administrativo de importes, vencimiento y cobro", ext: "md", icon: "receipt-text", category: "Plantillas", pack: "smart-notes", color: "emerald", content: ({ title }) => smartNote("factura", title, `> [!info] Control de factura\n> **Estado:** Borrador  ·  **Emisión:** ${today()}  ·  **Vencimiento:**  ·  **Moneda:**\n\n## Cliente\n\n- **Nombre / razón social:**\n- **Referencia:**\n- **Contacto:**\n\n## Conceptos\n\n| Concepto | Cantidad | Precio unitario | Impuesto | Total |\n|---|---:|---:|---:|---:|\n|  | 1 | 0.00 | 0.00 | 0.00 |\n\n## Resumen\n\n|  | Importe |\n|---|---:|\n| Subtotal | 0.00 |\n| Impuestos | 0.00 |\n| **Total** | **0.00** |\n\n## Seguimiento de cobro\n\n| Fecha | Evento | Nota |\n|---|---|---|\n| ${today()} | Creación |  |\n\n- [ ] Enviar factura\n- [ ] Confirmar recepción\n- [ ] Registrar pago\n\n> [!warning] Uso administrativo\n> Esta nota ayuda a organizar el seguimiento; no sustituye el documento fiscal oficial.`) },
  { id: "book-note", name: "Libro / Lectura", description: "Ficha, progreso, ideas, citas y reseña", ext: "md", icon: "book-open", category: "Plantillas", pack: "academic", color: "violet", content: ({ title }) => smartNote("lectura", title, `> [!info] Ficha de lectura\n> **Autor:**  ·  **Estado:** Por leer  ·  **Inicio:**  ·  **Fin:**  ·  **Valoración:** ☆☆☆☆☆\n\n## Por qué quiero leerlo\n\n## Tesis principal\n\n## Progreso\n\n| Fecha | Capítulos / páginas | Idea clave |\n|---|---|---|\n| ${today()} |  |  |\n\n## Ideas y conexiones\n\n- \n\n## Citas\n\n> “ ” — p. \n\n## Reseña final\n\n- **Qué cambió en mi forma de pensar:**\n- **A quién lo recomendaría:**\n- **Próxima acción:**`) },
  { id: "recipe-note", name: "Receta", description: "Ingredientes, preparación, tiempos y mejoras", ext: "md", icon: "chef-hat", category: "Plantillas", pack: "smart-notes", color: "orange", content: ({ title }) => smartNote("receta", title, `> [!info] Ficha de receta\n> **Porciones:**  ·  **Preparación:**  ·  **Cocción:**  ·  **Dificultad:**  ·  **Valoración:** ☆☆☆☆☆\n\n## Ingredientes\n\n| Cantidad | Unidad | Ingrediente | Preparación previa |\n|---:|---|---|---|\n|  |  |  |  |\n\n## Preparación\n\n1. \n2. \n3. \n\n## Presentación y conservación\n\n## Variaciones\n\n- \n\n## Resultado y mejoras\n\n- **Fecha preparada:** ${today()}\n- **Cambiar la próxima vez:**`) },
  { id: "snippet-note", name: "Código / Snippet", description: "Fragmento reutilizable con contexto y ejemplo", ext: "md", icon: "square-code", category: "Plantillas", pack: "code", color: "amber", content: ({ title }) => smartNote("snippet", title, `> [!abstract] Ficha técnica\n> **Lenguaje:**  ·  **Entorno:**  ·  **Estado:** Probado / Pendiente  ·  **Licencia / fuente:**\n\n## Problema que resuelve\n\n## Código\n\n\`\`\`text\n\n\`\`\`\n\n## Uso\n\n\`\`\`text\n\n\`\`\`\n\n## Entradas y salida\n\n| Elemento | Tipo | Descripción |\n|---|---|---|\n|  |  |  |\n\n## Limitaciones y seguridad\n\n- \n\n## Referencias\n\n- `) },
  { id: "contact-note", name: "Contacto", description: "Persona, canales, relación e historial", ext: "md", icon: "contact-round", category: "Plantillas", pack: "business", color: "blue", content: ({ title }) => smartNote("contacto", title, `> [!info] Datos principales\n> **Organización:**  ·  **Cargo:**  ·  **Relación:**  ·  **Último contacto:** ${today()}\n\n## Canales\n\n| Canal | Dato | Preferencia / horario |\n|---|---|---|\n| Correo |  |  |\n| Teléfono |  |  |\n\n## Contexto y temas de interés\n\n- \n\n## Historial\n\n### ${today()}\n\n- \n\n## Próximo contacto\n\n- [ ] Motivo — **Fecha:**\n\n> [!warning] Privacidad\n> Guarda solo información necesaria y evita credenciales o datos de identidad sensibles.`) },
  { id: "event-note", name: "Evento / Calendario", description: "Agenda, participantes, logística y seguimiento", ext: "md", icon: "calendar-clock", category: "Plantillas", pack: "smart-notes", color: "pink", content: ({ title }) => smartNote("evento", title, `> [!info] Datos del evento\n> **Inicio:**  ·  **Fin:**  ·  **Zona horaria:**  ·  **Lugar / enlace:**  ·  **Estado:** Planeado\n\n## Objetivo\n\n## Participantes\n\n| Persona | Rol | Confirmación |\n|---|---|:---:|\n|  |  | ☐ |\n\n## Agenda\n\n| Hora | Actividad | Responsable |\n|---:|---|---|\n|  |  |  |\n\n## Preparación y logística\n\n- [ ] \n\n## Notas durante el evento\n\n## Seguimiento\n\n- [ ] Acción — **Responsable:**  — **Fecha:**`) },
  { id: "flashcard-note", name: "Flashcard", description: "Pregunta, respuesta, pista y repaso", ext: "md", icon: "layers-3", category: "Plantillas", pack: "academic", color: "emerald", content: ({ title }) => smartNote("flashcard", title, `> [!question] Pregunta\n> \n\n## Respuesta\n\n> [!success]- Mostrar respuesta\n> \n\n## Pista\n\n> [!hint]- Mostrar pista\n> \n\n## Explicación y contexto\n\n## Fuente\n\n- \n\n## Repaso\n\n| Fecha | Resultado | Próximo repaso |\n|---|---|---|\n| ${today()} | Nuevo |  |`) },
  { id: "reference-note", name: "Cita / Referencia", description: "Fuente, cita, contexto y comentario", ext: "md", icon: "quote", category: "Plantillas", pack: "academic", color: "violet", content: ({ title }) => smartNote("referencia", title, `> [!quote] Cita\n> “ ”\n\n## Fuente\n\n- **Autor:**\n- **Obra / publicación:**\n- **Año:**\n- **Página / ubicación:**\n- **URL / DOI / ISBN:**\n- **Consultado:** ${today()}\n\n## Contexto\n\n## Interpretación personal\n\n## Cómo podría usarla\n\n- \n\n## Referencia formateada\n\n> `) },
  { id: "new-user-template", name: "Crear mi plantilla", description: "Escribe una plantilla propia y guárdala en tu carpeta de plantillas", ext: "md", icon: "file-plus-2", category: "Plantillas", subgroup: "Mis plantillas", pack: "essentials", color: "violet", action: "new-template" },
  { id: "text", name: "Texto", description: "Texto plano universal", ext: "txt", icon: "text", category: "Notas", color: "blue", viewer: true, content: () => "" },
  { id: "device-file", name: "Mis dispositivos", description: "Elige e importa un único archivo mediante el selector seguro del sistema", ext: "*", icon: "folder-open", category: "Office", pack: "essentials", color: "blue", action: "import-file" },
  { id: "open-pdf", name: "Centro PDF", description: "Busca, abre y continúa trabajando con un PDF de tu bóveda", ext: "pdf", icon: "file-search", category: "Notas", color: "orange", action: "open-pdf" },
  { id: "import-pdf", name: "Importar PDF", description: "Elige un PDF del equipo y copia solo ese archivo a la bóveda", ext: "pdf", icon: "file-input", category: "Multimedia", pack: "multimedia", color: "orange", action: "import-pdf" },
  { id: "pdf-notes", name: "PDF + notas", description: "Relaciona un PDF con resumen, citas y progreso", ext: "md", icon: "notebook-tabs", category: "Multimedia", pack: "multimedia", color: "violet", action: "companion", mediaKind: "pdf", mediaExtensions: ["pdf"] },
  { id: "pdf-tools", name: "PDF: editar y anotar", description: "Abre el PDF en Obsidian o en una app compatible para resaltar, firmar o modificar", ext: "pdf", icon: "file-pen-line", category: "Multimedia", pack: "multimedia", color: "orange", action: "pdf-tools" },
  { id: "image-notes", name: "Imagen + notas", description: "Describe, acredita y anota una imagen", ext: "md", icon: "image-plus", category: "Multimedia", pack: "multimedia", color: "pink", action: "companion", mediaKind: "imagen", mediaExtensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"] },
  { id: "audio-notes", name: "Audio + notas", description: "Registro, marcas de tiempo y transcripción manual", ext: "md", icon: "audio-lines", category: "Multimedia", pack: "multimedia", color: "emerald", action: "companion", mediaKind: "audio", mediaExtensions: ["mp3", "m4a", "wav", "ogg", "flac"] },
  { id: "video-notes", name: "Video + notas", description: "Comentarios y momentos importantes con tiempo", ext: "md", icon: "video", category: "Multimedia", pack: "multimedia", color: "blue", action: "companion", mediaKind: "video", mediaExtensions: ["mp4", "webm", "mov", "mkv"] },
  { id: "epub-notes", name: "EPUB + notas", description: "Relaciona un libro electrónico con tu ficha de lectura", ext: "md", icon: "book-marked", category: "Multimedia", pack: "academic", color: "violet", action: "companion", mediaKind: "epub", mediaExtensions: ["epub"] },
  ...WEB_INTEGRATIONS,
  { id: "canvas", name: "Canvas", description: "Lienzo visual de Obsidian", ext: "canvas", icon: "layout-dashboard", category: "Visual", color: "pink", content: () => '{\n  "nodes": [],\n  "edges": []\n}\n' },
  { id: "base", name: "Base", description: "Vista de datos nativa", ext: "base", icon: "database", category: "Datos", color: "emerald", content: () => "views:\n  - type: table\n    name: Table\n" },
  { id: "csv", name: "Tabla CSV", description: "Datos compatibles con hojas de cálculo", ext: "csv", icon: "table-2", category: "Datos", color: "emerald", viewer: true, content: () => "Columna 1,Columna 2,Columna 3\n" },
  { id: "json", name: "JSON", description: "Datos estructurados", ext: "json", icon: "braces", category: "Código", color: "amber", viewer: true, content: () => '{\n  \"propiedad\": \"valor\"\n}\n' },
  { id: "yaml", name: "YAML", description: "Configuración y datos legibles", ext: "yaml", icon: "list-tree", category: "Código", pack: "data", color: "amber", viewer: true, content: ({ title }) => `# ${title}\nversion: 1\ndata:\n  key: value\n` },
  { id: "xml", name: "XML", description: "Datos estructurados interoperables", ext: "xml", icon: "code-xml", category: "Código", pack: "data", color: "orange", viewer: true, content: () => `<?xml version="1.0" encoding="UTF-8"?>\n<document>\n  <item>value</item>\n</document>\n` },
  { id: "toml", name: "TOML", description: "Configuración clara por secciones", ext: "toml", icon: "settings-2", category: "Código", pack: "data", color: "amber", viewer: true, content: () => `version = "1.0.0"\n\n[settings]\nenabled = true\n` },
  { id: "sql", name: "SQL", description: "Consultas y scripts de base de datos", ext: "sql", icon: "database-zap", category: "Código", pack: "code", color: "blue", viewer: true, content: ({ title }) => `-- ${title}\n-- Revisa la consulta antes de ejecutarla.\n\nSELECT *\nFROM table_name\nLIMIT 100;\n` },
  { id: "python", name: "Python", description: "Script Python editable dentro de Pointix", ext: "py", icon: "file-code-2", category: "Código", pack: "code", color: "blue", viewer: true, content: ({ title }) => `\"\"\"${title}\"\"\"\n\n\ndef main():\n    pass\n\n\nif __name__ == \"__main__\":\n    main()\n` },
  { id: "javascript", name: "JavaScript", description: "Script JavaScript editable", ext: "js", icon: "file-code-2", category: "Código", pack: "code", color: "amber", viewer: true, content: ({ title }) => `/** ${title} */\n\nfunction main() {\n  // Código aquí\n}\n\nmain();\n` },
  { id: "typescript", name: "TypeScript", description: "Código TypeScript con tipado", ext: "ts", icon: "file-code-2", category: "Código", pack: "code", color: "blue", viewer: true, content: ({ title }) => `/** ${title} */\n\nfunction main(): void {\n  // Código aquí\n}\n\nmain();\n` },
  { id: "shell", name: "Shell / Bash", description: "Automatización para macOS o Linux", ext: "sh", icon: "terminal", category: "Código", pack: "code", color: "emerald", viewer: true, content: () => `#!/usr/bin/env bash\nset -euo pipefail\n\n# Código aquí\n` },
  { id: "batch", name: "Batch de Windows", description: "Script BAT para Windows", ext: "bat", icon: "terminal-square", category: "Código", pack: "code", color: "blue", viewer: true, content: () => `@echo off\nsetlocal\nREM Código aquí\nendlocal\n` },
  { id: "mermaid", name: "Mermaid", description: "Diagrama como código", ext: "mmd", icon: "workflow", category: "Visual", pack: "visual", color: "pink", viewer: true, content: () => `flowchart TD\n  A[Inicio] --> B[Proceso]\n  B --> C[Fin]\n` },
  { id: "svg", name: "SVG", description: "Gráfico vectorial editable como texto", ext: "svg", icon: "pen-line", category: "Visual", pack: "visual", color: "orange", viewer: true, content: ({ title }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">\n  <rect width="800" height="450" fill="#ffffff"/>\n  <text x="400" y="225" text-anchor="middle" font-family="sans-serif" font-size="32">${escapeHtml(title)}</text>\n</svg>\n` },
  { id: "opml", name: "OPML", description: "Esquemas jerárquicos portables", ext: "opml", icon: "list-collapse", category: "Datos", pack: "data", color: "violet", viewer: true, content: ({ title }) => `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0">\n  <head><title>${escapeHtml(title)}</title></head>\n  <body><outline text="${escapeHtml(title)}"/></body>\n</opml>\n` },
  { id: "rtf", name: "Rich Text", description: "Documento RTF compatible con editores de oficina", ext: "rtf", icon: "file-type-2", category: "Office", pack: "office", color: "blue", viewer: true, content: ({ title }) => `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Calibri;}}\\fs28\\b ${title.replace(/[{}\\]/g, "")}\\b0\\par\\fs22\\par }` },
  { id: "drawio", name: "Draw.io", description: "Diagrama XML compatible con diagrams.net", ext: "drawio", icon: "waypoints", category: "Visual", pack: "visual", color: "orange", viewer: true, content: () => `<mxfile host="Pointix"><diagram name="Página 1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>\n` },
  { id: "freemind", name: "FreeMind", description: "Mapa mental clásico en formato MM", ext: "mm", icon: "brain-circuit", category: "Visual", pack: "visual", color: "violet", viewer: true, content: ({ title }) => `<map version="1.0.1"><node TEXT="${escapeHtml(title)}"/></map>\n` },
  { id: "bibtex", name: "Bibliografía BibTeX", description: "Referencias académicas estructuradas", ext: "bib", icon: "library", category: "Datos", pack: "academic", color: "violet", viewer: true, content: () => `@article{clave,\n  author = {},\n  title = {},\n  year = {},\n  journal = {}\n}\n` },
  { id: "vcard", name: "Contacto vCard", description: "Contacto portable compatible con agendas", ext: "vcf", icon: "contact-round", category: "Datos", pack: "business", color: "blue", viewer: true, content: ({ title }) => `BEGIN:VCARD\nVERSION:3.0\nFN:${title}\nN:;;;;\nEMAIL:\nTEL:\nEND:VCARD\n` },
  { id: "calendar", name: "Evento iCalendar", description: "Evento portable para aplicaciones de calendario", ext: "ics", icon: "calendar-plus", category: "Datos", pack: "business", color: "pink", viewer: true, content: ({ title }) => `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Pointix File Hub//ES\nBEGIN:VEVENT\nUID:${Date.now()}@pointix\nDTSTAMP:${icalTimestamp()}\nSUMMARY:${title}\nDTSTART:${icalTimestamp()}\nDTEND:${icalTimestamp(60)}\nEND:VEVENT\nEND:VCALENDAR\n` },
  { id: "jupyter", name: "Notebook Jupyter", description: "Cuaderno IPYNB inicial con una celda Markdown", ext: "ipynb", icon: "notebook-tabs", category: "Código", pack: "academic", color: "orange", viewer: true, content: ({ title }) => `${JSON.stringify({ cells: [{ cell_type: "markdown", metadata: {}, source: [`# ${title}`] }], metadata: {}, nbformat: 4, nbformat_minor: 5 }, null, 2)}\n` },
  { id: "html", name: "Página HTML", description: "Documento web portátil", ext: "html", icon: "code-2", category: "Código", color: "orange", viewer: true, content: ({ title }) => `<!doctype html>\n<html lang="es">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${escapeHtml(title)}</title>\n</head>\n<body>\n  <h1>${escapeHtml(title)}</h1>\n</body>\n</html>\n` },
  { id: "docx", name: "Documento · Docs", description: "Compatible con Microsoft Word, WPS y LibreOffice", ext: "docx", icon: "file-text", category: "Office", color: "blue", office: true },
  { id: "xlsx", name: "Hoja · Sheets", description: "Compatible con Microsoft Excel, WPS y LibreOffice", ext: "xlsx", icon: "sheet", category: "Office", color: "emerald", office: true },
  { id: "pptx", name: "Presentación · Slides", description: "Compatible con PowerPoint, WPS y LibreOffice", ext: "pptx", icon: "presentation", category: "Office", color: "orange", office: true },
  { id: "univer", name: "Hoja Sheet Plus", description: "Libro editable dentro de Obsidian", ext: "univer.md", icon: "table-properties", category: "Office", color: "green", pluginId: "sheet-plus", pluginName: "Sheet Plus", commandId: "sheet-plus:spreadsheet-autocreation" },
  { id: "excalidraw", name: "Dibujo Excalidraw", description: "Pizarra y diagramación con el complemento oficial", ext: "excalidraw.md", icon: "pen-tool", category: "Visual", color: "pink", pluginId: "obsidian-excalidraw-plugin", excalidraw: true },
];

function smartNote(type, title, body) {
  const safeTitle = String(title).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const date = new Date().toISOString().slice(0, 10);
  return `---\ntitle: "${safeTitle}"\npointix-type: ${type}\nestado: activo\nfecha-creacion: ${date}\ntags:\n  - pointix\n  - ${type}\n---\n\n# ${title}\n\n${body}\n`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function icalTimestamp(offsetMinutes = 0) {
  return new Date(Date.now() + offsetMinutes * 60000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function companionNote(kind, file) {
  const safePath = String(file.path).replace(/"/g, '\\"');
  const timing = ["audio", "video"].includes(kind)
    ? `## Marcas de tiempo\n\n| Tiempo | Nota | Acción |\n|---:|---|---|\n| 00:00 |  |  |\n\n`
    : "";
  const reading = kind === "pdf"
    ? `## Estado de lectura\n\n- **Estado:** Pendiente\n- **Progreso:** 0%\n- **Autor / fuente:**\n\n## Citas y referencias\n\n> Cita — página / sección\n\n`
    : "";
  return `---\npointix-type: multimedia\nmedia-kind: ${kind}\narchivo: "[[${safePath}]]"\ncreated: ${today()}\nstatus: pendiente\ntags:\n  - multimedia\n---\n\n# Notas — ${file.basename || file.name}\n\n![[${file.path}]]\n\n> [!info] Archivo relacionado\n> **Formato:** .${file.extension}  ·  **Ubicación:** ${file.path}\n\n${reading}## Resumen / descripción\n\n\n${timing}## Anotaciones\n\n- \n\n## Acciones y conexiones\n\n- [ ] \n- [[ ]]\n`;
}

function packIdFor(type) {
  if (type.pack) return type.pack;
  return ({ Office: "office", Datos: "data", Código: "code", Visual: "visual" })[type.category] || "essentials";
}

function kindFor(type) {
  if (type.category === "Plantillas" || type.action === "companion") return "Notas inteligentes";
  if (type.pluginId || type.integration || type.excalidraw || type.action === "web-link") return "Integraciones";
  return "Archivos reales";
}

const CATALOG_CATEGORIES = Object.freeze([
  ["Inicio", "home"], ["Favoritos", "bookmark"], ["Plantillas", "layout-template"], ["Apps de notas", "notebook-tabs"], ["Documentos", "files"],
  ["Datos y código", "code-2"], ["Diseño", "palette"], ["Multimedia", "play"],
  ["PDF", "file-text"], ["IA", "sparkles"], ["Almacenamiento", "cloud"], ["Integraciones", "blocks"],
]);

function catalogCategory(type) {
  if (["open-pdf", "import-pdf", "pdf-notes", "pdf-tools"].includes(type.id)) return "PDF";
  if (type.action === "web-link") {
    if (type.group === "Almacenamiento") return "Almacenamiento";
    if (type.group === "Inteligencia artificial") return "IA";
    if (type.group === "Multimedia") return "Multimedia";
    if (type.group === "Notas y conocimiento") return "Apps de notas";
    if (type.group === "Oficina web") return "Documentos";
    return "Integraciones";
  }
  if (type.category === "Plantillas") return "Plantillas";
  if (type.category === "Notas") return "Documentos";
  if (type.category === "Office") return "Documentos";
  if (["Datos", "Código"].includes(type.category)) return "Datos y código";
  if (type.category === "Visual") return "Diseño";
  if (type.category === "Multimedia" || type.action === "companion") return "Multimedia";
  return "Documentos";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

function cleanSegment(value) {
  let segment = String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^[\s.]+|[\s.]+$/g, "");
  if (WINDOWS_RESERVED.test(segment)) segment = `${segment}_`;
  return segment;
}

function safeName(value) {
  return cleanSegment(value).slice(0, 120);
}

// Extensiones que el sistema podría ejecutar. Pointix nunca las abre con la aplicación predeterminada.
const RISKY_EXTENSIONS = new Set([
  "exe", "com", "bat", "cmd", "msi", "msp", "scr", "pif", "lnk", "reg", "ps1", "psm1", "vbs", "vbe",
  "js", "jse", "wsf", "wsh", "hta", "cpl", "jar", "sh", "bash", "zsh", "command", "app", "apk",
  "appimage", "dmg", "pkg", "deb", "rpm", "bin", "run", "action", "desktop", "scf", "dll", "sys",
]);

function isRiskyName(name) {
  const text = String(name || "");
  const ext = text.includes(".") ? text.split(".").pop().toLowerCase() : "";
  return RISKY_EXTENSIONS.has(ext);
}

// Enlace seguro para escribir dentro de Markdown: normalizado y sin caracteres que cierren o rompan el enlace.
function mdSafeHref(href) {
  return String(href || "").replace(/[()<>\s]/g, (char) => ({ "(": "%28", ")": "%29", "<": "%3C", ">": "%3E" })[char] || "%20");
}

function maxImportBytes() {
  return (Platform.isMobile ? 100 : 500) * 1024 * 1024;
}

function maxImportLabel() {
  return Platform.isMobile ? "100 MB en el teléfono o la tableta" : "500 MB";
}

function applyTemplateTokens(text, title) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return String(text || "")
    .replace(/^pointix-plantilla:.*\r?\n/m, "")
    .replace(/^---\r?\n---\r?\n/, "")
    .replace(/\{\{\s*(title|titulo|título)\s*\}\}/gi, () => String(title))
    .replace(/\{\{\s*(date|fecha)\s*\}\}/gi, today())
    .replace(/\{\{\s*(time|hora)\s*\}\}/gi, `${hh}:${mm}`);
}

const SHELL_TEXT_EXTS = ["json", "txt", "csv", "html", "css", "js", "ts", "xml", "yaml", "yml", "toml", "sql", "py", "sh", "bat", "mmd", "svg", "opml", "rtf", "drawio", "mm", "bib", "vcf", "ics", "ipynb"];
const OPEN_ALIASES = Object.freeze({
  docx: ["docx", "doc", "odt"], xlsx: ["xlsx", "xls", "ods"], pptx: ["pptx", "ppt", "odp"],
  yaml: ["yaml", "yml"], html: ["html", "htm"], markdown: ["md", "markdown"], csv: ["csv", "tsv"], mermaid: ["mmd", "mermaid"],
});
const OPEN_NOUNS = Object.freeze({ docx: "documento", xlsx: "hoja de cálculo", pptx: "presentación", rtf: "documento", markdown: "nota", text: "texto" });
const NATIVE_OPEN_EXTENSIONS = new Set(["md", "markdown", "canvas", "base", "pdf", "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif", "mp3", "m4a", "wav", "ogg", "flac", "3gp", "webm", "mp4", "mkv", "mov"]);

// Qué modalidades de «abrir» tiene sentido ofrecer en cada tipo. null = solo crear.
function openModesFor(type) {
  if (!type || type.action || type.integration || type.userTemplate || type.category === "Plantillas" || type.group) return null;
  const exts = OPEN_ALIASES[type.id] || [type.ext];
  const vaultOnly = Boolean(type.commandId || type.excalidraw || ["canvas", "base"].includes(type.id));
  return { noun: OPEN_NOUNS[type.id] || "archivo", vault: exts, device: vaultOnly ? null : exts };
}

function matchesExtensions(file, extensions) {
  const name = String(file?.name || "").toLowerCase();
  return (extensions || []).some((ext) => name.endsWith(`.${ext}`));
}

function safeFolder(value) {
  const raw = String(value || "").trim().replace(/\\/g, "/");
  if (!raw || raw === ".") return "";
  if (raw.startsWith("/") || /^[a-zA-Z]:/.test(raw)) throw new Error("absolute-path");
  const parts = raw.split("/").filter(Boolean);
  if (parts.some((part) => part === "." || part === "..")) throw new Error("path-traversal");
  if (parts.some((part) => part.trim().startsWith("."))) throw new Error("hidden-folder");
  if (parts.length > 12 || raw.length > 200) throw new Error("path-limit");
  const cleaned = parts.map(cleanSegment).filter(Boolean);
  if (!cleaned.length) return "";
  return normalizePath(cleaned.join("/"));
}

function domainMatches(hostname, domain) {
  const host = String(hostname || "").toLowerCase();
  const expected = String(domain || "").toLowerCase();
  return host === expected || host.endsWith(`.${expected}`);
}

function validateIntegrationUrl(type, value) {
  let parsed;
  try { parsed = new URL(String(value || "").trim()); } catch (error) {
    return { ok: false, message: "Escribe un enlace web completo y válido." };
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return { ok: false, message: "Solo se permiten enlaces http o https." };
  const blockedLoginHosts = ["accounts.google.com", "login.microsoftonline.com", "login.live.com", "passport.yandex.com", "passport.yandex.ru"];
  if (blockedLoginHosts.some((domain) => domainMatches(parsed.hostname, domain))) {
    return { ok: false, message: "Ese es un enlace de inicio de sesión. Abre primero el recurso y copia su enlace directo." };
  }
  const matchesService = (type.domains || []).some((domain) => domainMatches(parsed.hostname, domain));
  if (!matchesService && !type.allowCustomDomain) {
    return { ok: false, message: `El enlace no parece pertenecer a ${type.service}. Revisa que hayas copiado el recurso correcto.` };
  }
  if (type.pathHint && !domainMatches(parsed.hostname, "forms.gle") && !parsed.pathname.toLowerCase().includes(type.pathHint.toLowerCase())) {
    return { ok: false, message: `El enlace pertenece al servicio, pero no parece apuntar al recurso esperado (${type.pathHint}).` };
  }
  return { ok: true, parsed, customDomain: !matchesService };
}

function validateAppUrl(value, type = null) {
  const raw = String(value || "").trim();
  if (!raw) return { ok: true, value: "" };
  let parsed;
  try { parsed = new URL(raw); } catch (error) { return { ok: false, message: "El enlace de aplicación no es válido." }; }
  if (["javascript:", "data:", "file:", "obsidian:"].includes(parsed.protocol)) return { ok: false, message: "Ese protocolo no se permite por seguridad." };
  const allowedProtocols = type?.appProtocols || ["http:", "https:"];
  if (!allowedProtocols.includes(parsed.protocol)) {
    return { ok: false, message: `El enlace para ${type?.service || "la aplicación"} debe usar ${allowedProtocols.join(" o ")}.` };
  }
  if (["http:", "https:"].includes(parsed.protocol) && type) {
    const blockedLoginHosts = ["accounts.google.com", "myaccount.google.com", "mail.google.com", "login.microsoftonline.com", "login.live.com", "passport.yandex.com", "passport.yandex.ru"];
    if (blockedLoginHosts.some((domain) => domainMatches(parsed.hostname, domain))) {
      return { ok: false, message: "Ese enlace corresponde a una cuenta, correo o inicio de sesión; no identifica un recurso de la aplicación." };
    }
    const appDomains = type.appDomains || type.domains || [];
    const matchesApp = appDomains.some((domain) => domainMatches(parsed.hostname, domain));
    if (!matchesApp && !type.allowCustomDomain) {
      return { ok: false, message: `El enlace de aplicación no parece pertenecer a ${type.service}.` };
    }
  }
  if (parsed.protocol === "joplin:") {
    const validAction = parsed.hostname === "x-callback-url" && ["/openNote", "/openFolder", "/openTag"].includes(parsed.pathname);
    const id = parsed.searchParams.get("id") || "";
    if (!validAction || !/^[a-f0-9]{32}$/i.test(id)) {
      return { ok: false, message: "Pega un enlace externo completo copiado desde Joplin para una nota, cuaderno o etiqueta." };
    }
  }
  if (parsed.protocol === "tg:") {
    const action = (parsed.hostname || parsed.pathname || "").replace(/^\/+/, "");
    if (!/^[a-z][a-z0-9_]*$/i.test(action) || raw.length > 2048) {
      return { ok: false, message: "Pega un enlace profundo tg:// completo copiado desde Telegram." };
    }
  }
  if (parsed.protocol === "nn:") {
    const kind = (parsed.hostname || "").toLowerCase();
    const identifier = parsed.pathname.replace(/^\/+/, "");
    if (!["note", "notebook", "tag", "color"].includes(kind) || !identifier || identifier.length > 512) {
      return { ok: false, message: "Pega un enlace nn:// completo para una nota, cuaderno, etiqueta o color de Notesnook." };
    }
  }
  return { ok: true, value: parsed.href };
}

function yamlText(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ");
}

function addVaultFolderField(container, app, initialValue = "", label = "Carpeta en la bóveda") {
  const id = `pfh-folders-${Math.random().toString(36).slice(2)}`;
  let inputEl = null;
  new Setting(container)
    .setName(label)
    .setDesc("Escribe una ruta o elige una carpeta existente. Si no existe, Pointix creará únicamente esa ruta dentro de la bóveda.")
    .addText((text) => {
      inputEl = text.inputEl;
      text.setValue(initialValue || "").setPlaceholder("Proyecto/Archivos");
      inputEl.setAttribute("list", id);
    });
  const datalist = container.createEl("datalist", { attr: { id } });
  const loaded = typeof app.vault.getAllLoadedFiles === "function" ? app.vault.getAllLoadedFiles() : [];
  loaded.filter((item) => item?.children && item.path && item.path !== "/")
    .sort((a, b) => a.path.localeCompare(b.path))
    .slice(0, 500)
    .forEach((folder) => datalist.createEl("option", { attr: { value: folder.path } }));
  return { getValue: () => inputEl?.value || "", inputEl };
}

function base64ToArrayBuffer(value) {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

function titleFromId(id) {
  return FILE_TYPES.find((item) => item.id === id)?.name || id;
}

class PointixFileHubPlugin extends Plugin {
  async onload() {
    const storedSettings = await this.loadData() || {};
    this.settings = Object.assign({}, DEFAULT_SETTINGS, storedSettings);
    if (storedSettings.catalogVersion !== DEFAULT_SETTINGS.catalogVersion) {
      const enabled = new Set(this.settings.enabledPacks || []);
      ["multimedia", "academic", "business", "ai"].forEach((id) => enabled.add(id));
      this.settings.enabledPacks = PACKS.map((pack) => pack.id).filter((id) => enabled.has(id));
      // La categoría «Notas» se reparte: plantillas, apps de notas y archivos básicos (Documentos).
      const order = { ...(this.settings.categoryOrder || {}) };
      if (Array.isArray(order.Notas)) {
        order.Notas.forEach((id) => {
          const type = FILE_TYPES.find((item) => item.id === id);
          if (!type) return;
          const target = catalogCategory(type);
          order[target] = [...(order[target] || []).filter((existing) => existing !== id), id];
        });
        delete order.Notas;
        this.settings.categoryOrder = order;
      }
      if (!this.settings.templatesFolder) this.settings.templatesFolder = DEFAULT_TEMPLATES_FOLDER;
      this.settings.catalogVersion = DEFAULT_SETTINGS.catalogVersion;
      await this.saveData(this.settings);
    }
    delete this.settings.officeTemplates;
    this.creationLocks = new Set();

    this.registerView(HUB_VIEW, (leaf) => new FileHubView(leaf, this));
    this.registerView(SHELL_VIEW, (leaf) => new FileShellView(leaf, this));
    this.registerObsidianProtocolHandler("pointix-open-web", async (params) => {
      await this.openWebExternal(params?.url || "", params?.service || "");
    });
    this.registerObsidianProtocolHandler("pointix-open-app", async (params) => {
      await this.openAppExternal(params?.url || "", params?.service || "");
    });

    addIcon("pointix-hub", POINTIX_ICON_SVG);
    this._ribbonEl = this.addRibbonIcon("pointix-hub", "Abrir Pointix File Hub", () => this.openHub());
    this.addCommand({ id: "open-file-hub", name: "Abrir centro de archivos", callback: () => this.openHub() });
    this.addCommand({ id: "toggle-pin-hub", name: "Fijar o soltar la pestaña", callback: () => this.togglePinHub() });
    this.addCommand({ id: "create-from-file-hub", name: "Crear archivo…", callback: () => new CreateFileModal(this.app, this).open() });
    this.addCommand({ id: "open-pdf-from-file-hub", name: "Buscar y abrir PDF…", callback: () => new PdfPickerModal(this.app, this).open() });

    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (!file || !file.extension || file.extension === "md") return;
      menu.addItem((item) => item
        .setTitle("Abrir en Pointix File Hub")
        .setIcon("panel-top-open")
        .onClick(() => this.openShell(file.path)));
    }));

    const refreshTemplates = (file, oldPath) => {
      const folder = this.templatesFolderPath();
      if (!folder) return;
      const inside = (p) => typeof p === "string" && p.startsWith(`${folder}/`);
      if (!inside(file?.path) && !inside(oldPath)) return;
      window.clearTimeout(this._templatesTimer);
      this._templatesTimer = window.setTimeout(() => this.app.workspace.getLeavesOfType(HUB_VIEW).forEach((leaf) => leaf.view.render?.()), 300);
    };
    this.registerEvent(this.app.vault.on("create", (file) => refreshTemplates(file)));
    this.registerEvent(this.app.vault.on("delete", (file) => refreshTemplates(file)));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => refreshTemplates(file, oldPath)));

    this.app.workspace.onLayoutReady(() => { if (this.settings.openOnStartup) this.openHub(); });
    this.setupChrome();
    this.addSettingTab(new PointixFileHubSettingTab(this.app, this));
  }

  onunload() {
    window.clearTimeout(this._templatesTimer);
    this.teardownChrome();
    // Las vistas registradas se cierran solas; no se separan hojas aquí para conservar su posición al actualizar.
  }

  async createUserTemplate(rawName, purpose) {
    const folder = this.templatesFolderPath();
    if (!folder) return null;
    const name = safeName(rawName) || "Mi plantilla";
    if (!this.app.vault.getAbstractFileByPath(folder)) await this.ensureFolder(folder);
    const path = await this.uniquePath(folder, name, "md");
    const description = String(purpose || "Plantilla propia").replace(/["\r\n]/g, " ").trim();
    const body = `---\npointix-plantilla: "${description}"\n---\n\n# {{title}}\n\nCreada el {{date}} a las {{time}}.\n\n## \n\n- \n`;
    const file = await this.app.vault.create(path, body);
    new Notice(`Plantilla creada: ${file.path}`);
    await this.app.workspace.getLeaf("tab").openFile(file);
    return file;
  }

  // ---- Presencia de Pointix en la interfaz de Obsidian (pestaña nueva, barra de pestañas y barra lateral).
  // Todo se hace con eventos oficiales y un mínimo de DOM; si Obsidian cambia esas pantallas, simplemente no se muestra.
  setupChrome() {
    const schedule = () => {
      window.clearTimeout(this._chromeTimer);
      this._chromeTimer = window.setTimeout(() => this.syncChrome(), 60);
    };
    this.registerEvent(this.app.workspace.on("layout-change", schedule));
    this.registerEvent(this.app.workspace.on("active-leaf-change", schedule));
    this.app.workspace.onLayoutReady(() => { this.moveRibbonFirst(); schedule(); });
    this.register(() => this.teardownChrome());
  }

  syncChrome() {
    try { this.syncStartEntries(); this.syncTabBarButton(); if (this.settings.pinHubTab) this.syncPinned(true); } catch (error) { console.debug("Pointix File Hub: interface sync skipped", error); }
  }

  teardownChrome() {
    window.clearTimeout(this._chromeTimer);
    document.querySelectorAll(".pfh-start-entry, .pfh-topbar-button").forEach((element) => element.remove());
  }

  moveRibbonFirst() {
    const element = this._ribbonEl; const parent = element?.parentElement;
    if (parent && parent.firstElementChild !== element) parent.prepend(element);
  }

  buildStartEntry() {
    const entry = document.createElement("div");
    entry.className = "pfh-start-entry";
    entry.setAttribute("role", "button");
    entry.setAttribute("aria-label", `Abrir ${START_TITLE}`);
    entry.tabIndex = 0;
    const tile = document.createElement("span"); tile.className = "pfh-start-icon"; setIcon(tile, "pointix-hub");
    const copy = document.createElement("span"); copy.className = "pfh-start-copy";
    const title = document.createElement("strong"); title.textContent = START_TITLE;
    const hint = document.createElement("small"); hint.textContent = START_HINT;
    copy.append(title, hint); entry.append(tile, copy);
    entry.addEventListener("click", () => this.openHubFrom(entry));
    entry.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.openHubFrom(entry); } });
    return entry;
  }

  // Muestra el acceso encima de las opciones de la pestaña nueva.
  syncStartEntries() {
    const wanted = this.settings.showStartEntry !== false;
    document.querySelectorAll(".pfh-start-entry").forEach((entry) => {
      if (!wanted || !entry.nextElementSibling?.classList?.contains("empty-state-action-list")) entry.remove();
    });
    if (!wanted) return;
    document.querySelectorAll(".empty-state-container").forEach((container) => {
      const list = container.querySelector(":scope > .empty-state-action-list");
      if (!list || container.querySelector(":scope > .pfh-start-entry")) return;
      container.insertBefore(this.buildStartEntry(), list);
    });
  }

  // Botón al inicio de la barra de pestañas (solo escritorio; en el teléfono queda la barra lateral).
  syncTabBarButton() {
    const strip = this.settings.showTabBarButton !== false && Platform.isDesktopApp && !Platform.isMobile ? document.querySelector(".mod-root .workspace-tab-header-container") : null;
    document.querySelectorAll(".pfh-topbar-button").forEach((button) => { if (!strip || button.parentElement !== strip) button.remove(); });
    if (!strip || strip.querySelector(":scope > .pfh-topbar-button")) return;
    const inner = strip.querySelector(":scope > .workspace-tab-header-container-inner");
    if (!inner) return;
    const wrapper = document.createElement("div"); wrapper.className = "pfh-topbar-button";
    const icon = document.createElement("span");
    icon.className = "clickable-icon"; icon.setAttribute("role", "button"); icon.tabIndex = 0;
    icon.setAttribute("aria-label", START_TITLE); setIcon(icon, "pointix-hub");
    icon.addEventListener("click", () => this.openHub());
    icon.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.openHub(); } });
    wrapper.append(icon); strip.insertBefore(wrapper, inner);
  }

  // Desde una pestaña nueva: reutiliza la pestaña vacía en lugar de dejarla abierta.
  async openHubFrom(entry) {
    const workspace = this.app.workspace;
    const empty = workspace.getLeavesOfType("empty").find((leaf) => leaf.view?.containerEl?.contains(entry));
    const existing = workspace.getLeavesOfType(HUB_VIEW)[0];
    if (existing) { workspace.revealLeaf(existing); empty?.detach(); return; }
    if (empty) { await empty.setViewState({ type: HUB_VIEW, active: true }); this.applyPin(empty); workspace.revealLeaf(empty); return; }
    await this.openHub();
  }

  // Fijar la pestaña del Hub (función oficial de Obsidian: queda al inicio de la barra de pestañas).
  applyPin(leaf) {
    if (this.settings.pinHubTab && typeof leaf?.setPinned === "function") leaf.setPinned(true);
  }

  syncPinned(value) {
    this.app.workspace.getLeavesOfType(HUB_VIEW).forEach((leaf) => {
      if (typeof leaf.setPinned === "function" && Boolean(leaf.pinned) !== Boolean(value)) leaf.setPinned(Boolean(value));
    });
  }

  async togglePinHub() {
    let leaf = this.app.workspace.getLeavesOfType(HUB_VIEW)[0];
    if (!leaf) { await this.openHub(); leaf = this.app.workspace.getLeavesOfType(HUB_VIEW)[0]; }
    if (!leaf || typeof leaf.setPinned !== "function") { new Notice("Esta versión de Obsidian no permite fijar pestañas desde aquí."); return; }
    const next = !leaf.pinned;
    leaf.setPinned(next);
    new Notice(next ? "Pointix File Hub fijado." : "Pointix File Hub suelto.");
  }

  async openHub() {
    let leaf = this.app.workspace.getLeavesOfType(HUB_VIEW)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: HUB_VIEW, active: true });
    }
    this.applyPin(leaf);
    this.app.workspace.revealLeaf(leaf);
  }

  async openShell(path) {
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: SHELL_VIEW, active: true, state: { file: path } });
    this.app.workspace.revealLeaf(leaf);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.app.workspace.getLeavesOfType(HUB_VIEW).forEach((leaf) => leaf.view.render?.());
  }

  enabledPluginIds() {
    const enabled = this.app.plugins?.enabledPlugins;
    return enabled ? Array.from(enabled) : [];
  }

  templatesFolderPath() {
    try { return safeFolder(this.settings.templatesFolder || DEFAULT_TEMPLATES_FOLDER); } catch (error) { return ""; }
  }

  // Cada nota Markdown de la carpeta «Mis plantillas» aparece como una tarjeta.
  userTemplateTypes() {
    const folder = this.templatesFolderPath();
    if (!folder) return [];
    return this.app.vault.getMarkdownFiles()
      .filter((file) => file.path.startsWith(`${folder}/`))
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((file) => {
        const meta = this.app.metadataCache?.getFileCache?.(file)?.frontmatter || {};
        return {
          id: `user-template:${file.path}`, name: file.basename, ext: "md", icon: "file-text", color: "violet",
          description: String(meta["pointix-plantilla"] || meta.description || "Plantilla propia").slice(0, 110),
          category: "Plantillas", subgroup: "Mis plantillas", pack: "essentials", userTemplate: file.path,
        };
      });
  }

  enabledTypes() {
    const enabled = new Set(this.settings.enabledPacks || DEFAULT_SETTINGS.enabledPacks);
    const hidden = new Set(this.settings.hiddenIds || []);
    return [...FILE_TYPES, ...this.userTemplateTypes()].filter((type) => enabled.has(packIdFor(type)) && !hidden.has(type.id));
  }

  // Abre un archivo de la bóveda con lo más adecuado: vista nativa, editor de Pointix o aplicación predeterminada.
  async openVaultFile(file) {
    if (!file) return;
    const ext = String(file.extension || "").toLowerCase();
    if (NATIVE_OPEN_EXTENSIONS.has(ext)) { await this.app.workspace.getLeaf("tab").openFile(file); return; }
    if (SHELL_TEXT_EXTS.includes(ext)) { await this.openShell(file.path); return; }
    await this.openExternal(file);
  }

  orderedTypes(types, section) {
    const order = this.settings.categoryOrder?.[section] || [];
    const positions = new Map(order.map((id, index) => [id, index]));
    return [...types].sort((a, b) => (positions.get(a.id) ?? 10000) - (positions.get(b.id) ?? 10000));
  }

  async moveType(section, sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const ids = this.orderedTypes(this.enabledTypes().filter((type) => catalogCategory(type) === section), section).map((type) => type.id);
    const from = ids.indexOf(sourceId); const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    this.settings.categoryOrder = { ...(this.settings.categoryOrder || {}), [section]: ids };
    await this.saveSettings();
  }

  async moveTypeToStart(section, id) {
    const ids = this.orderedTypes(this.enabledTypes().filter((type) => catalogCategory(type) === section), section).map((type) => type.id).filter((item) => item !== id);
    this.settings.categoryOrder = { ...(this.settings.categoryOrder || {}), [section]: [id, ...ids] };
    await this.saveSettings();
  }

  async hideType(id) {
    this.settings.hiddenIds = Array.from(new Set([...(this.settings.hiddenIds || []), id]));
    await this.saveSettings();
  }

  findIntegration(type) {
    if (!type.integration) return null;
    const terms = type.integration.map((term) => term.toLowerCase());
    const commands = Object.values(this.app.commands?.commands || {});
    return commands.find((command) => {
      const haystack = `${command.id || ""} ${command.name || ""}`.toLowerCase();
      return terms.some((term) => haystack.includes(term)) && /(create|new|crear|nuevo)/i.test(haystack);
    }) || null;
  }

  availability(type) {
    if (type.action === "new-template") return { state: "ready", label: "Tu propia plantilla" };
    if (type.userTemplate) return { state: "ready", label: "Mi plantilla" };
    if (type.action === "import-file") return { state: "ready", label: "Selector del sistema" };
    if (type.action === "import-pdf") return { state: "ready", label: "Importación de un archivo" };
    if (type.action === "companion") return { state: "ready", label: "Nota compañera" };
    if (type.action === "pdf-tools") return { state: "optional", label: "Obsidian + app externa" };
    if (type.action === "web-link") return { state: "ready", label: type.mode || "Integración enlazada" };
    if (type.action === "open-pdf") return { state: "native", label: "Visor nativo" };
    if (type.pluginId) {
      const enabled = this.enabledPluginIds().includes(type.pluginId);
      return enabled
        ? { state: "ready", label: "Complemento disponible" }
        : { state: "optional", label: "Requiere complemento" };
    }
    if (type.integration) {
      const command = this.findIntegration(type);
      return command
        ? { state: "ready", label: "Complemento disponible", command }
        : { state: "optional", label: "Requiere complemento" };
    }
    if (type.office) {
      return { state: "native", label: "Plantilla interna segura" };
    }
    if (type.viewer) return { state: "ready", label: "Editor Pointix" };
    return { state: "native", label: "Nativo" };
  }

  async beginCreate(type) {
    if (type.action === "new-template") {
      new NewTemplateModal(this.app, this).open();
      return;
    }
    if (type.action === "import-file") {
      new ExternalFileImportModal(this.app, this).open();
      return;
    }
    if (type.action === "open-pdf") {
      new PdfPickerModal(this.app, this).open();
      return;
    }
    if (type.action === "import-pdf") {
      new ExternalPdfImportModal(this.app, this).open();
      return;
    }
    if (type.action === "companion") {
      new CompanionPickerModal(this.app, this, type).open();
      return;
    }
    if (type.action === "pdf-tools") {
      new PdfToolsModal(this.app, this).open();
      return;
    }
    if (type.action === "web-link") {
      new WebLinkModal(this.app, this, type).open();
      return;
    }
    const integration = this.findIntegration(type);
    if (integration) {
      this.remember(type.id);
      this.app.commands.executeCommandById(integration.id);
      return;
    }
    new NameFileModal(this.app, this, type).open();
  }

  async createFile(type, rawName, rawFolder) {
    const name = safeName(rawName) || type.name;
    let folder;
    try {
      folder = safeFolder(rawFolder || this.settings.defaultFolder || "");
    } catch (error) {
      new Notice("La carpeta debe ser una ruta relativa y segura dentro de la bóveda.");
      return null;
    }

    const lockKey = `${folder}/${name}.${type.ext}`;
    if (this.creationLocks.has(lockKey)) {
      new Notice("Este archivo ya se está creando.");
      return null;
    }
    this.creationLocks.add(lockKey);

    let file;
    try {
      if (folder && !this.app.vault.getAbstractFileByPath(folder)) await this.ensureFolder(folder);
      if (type.commandId) {
        const created = await this.createViaCommand(type, name, folder);
        if (created) this.remember(type.id);
        return created;
      }
      if (type.excalidraw) {
        file = await this.createExcalidraw(name, folder);
        if (!file) return null;
        this.remember(type.id);
        new Notice(`${type.name} creado: ${file.path}`);
        return file;
      }
      const path = await this.uniquePath(folder, name, type.ext);
      if (type.office) {
        const encoded = OFFICE_TEMPLATES[type.ext];
        if (!encoded) throw new Error(`missing-internal-template-${type.ext}`);
        file = await this.app.vault.createBinary(path, base64ToArrayBuffer(encoded));
      } else if (type.userTemplate) {
        const source = this.app.vault.getAbstractFileByPath(type.userTemplate);
        const raw = source ? await this.app.vault.read(source) : "";
        file = await this.app.vault.create(path, applyTemplateTokens(raw, name));
      } else {
        const content = type.content ? type.content({ title: name }) : "";
        file = await this.app.vault.create(path, content);
      }

      this.remember(type.id);
      new Notice(`${type.name} creado: ${file.path}`);
      if (file && this.settings.openAfterCreate) {
        if (["md", "canvas", "base"].includes(type.ext) || type.openNative) await this.app.workspace.getLeaf("tab").openFile(file);
        else await this.openShell(file.path);
      }
      return file;
    } finally {
      this.creationLocks.delete(lockKey);
    }
  }

  // Ejecuta el comando exacto de otro complemento y coloca SOLO el archivo recién creado donde el usuario eligió.
  async createViaCommand(type, name, folder) {
    const command = this.app.commands?.commands?.[type.commandId];
    if (!command) {
      new Notice(`Activa ${type.pluginName || "el complemento"} para crear este archivo.`);
      return null;
    }
    const created = await new Promise((resolve) => {
      let finished = false;
      let timer = 0;
      let ref = null;
      const finish = (value) => {
        if (finished) return;
        finished = true;
        if (ref) this.app.vault.offref(ref);
        window.clearTimeout(timer);
        resolve(value);
      };
      ref = this.app.vault.on("create", (file) => {
        if (file instanceof TFile && file.name.toLowerCase().endsWith(`.${type.ext}`)) finish(file);
      });
      timer = window.setTimeout(() => finish(null), 8000);
      try { this.app.commands.executeCommandById(type.commandId); } catch (error) {
        console.error("Pointix File Hub: plugin command failed", error);
        finish(null);      }
    });
    if (!created) {
      new Notice(`No se detectó el archivo creado por ${type.pluginName || "el complemento"}. No se movió nada; revisa la carpeta raíz de la bóveda.`);
      return null;
    }
    const target = await this.uniquePath(folder, name, type.ext);
    if (created.path !== target) {
      try { await this.app.fileManager.renameFile(created, target); } catch (error) {
        console.error("Pointix File Hub: could not place created file", error);
        new Notice(`El archivo se creó en ${created.path}, pero no se pudo moverlo a la carpeta elegida.`);
        return created;
      }
    }
    new Notice(`${type.name} creado: ${created.path}`);
    return created;
  }

  async createExcalidraw(name, folder) {
    const automate = globalThis.ExcalidrawAutomate;
    if (!automate || typeof automate.getAPI !== "function") {
      new Notice("Activa Excalidraw para crear y abrir un dibujo real.");
      return null;
    }
    const api = automate.getAPI();
    if (!api || typeof api.create !== "function") {
      new Notice("Excalidraw está activo, pero su API todavía no está lista. Intenta de nuevo en unos segundos.");
      return null;
    }
    const path = await api.create({
      filename: name,
      foldername: folder || undefined,
      onNewPane: true,
      silent: !this.settings.openAfterCreate,
    });
    return path ? this.app.vault.getAbstractFileByPath(path) : null;
  }

  async createCompanionNote(file, kind, requestedFolder = null) {
    const folder = requestedFolder === null
      ? (file.parent?.path && file.parent.path !== "/" ? file.parent.path : "")
      : safeFolder(requestedFolder);
    if (folder && !this.app.vault.getAbstractFileByPath(folder)) await this.ensureFolder(folder);
    const name = `${file.basename || file.name} — Notas`;
    const path = await this.uniquePath(folder, name, "md");
    const content = companionNote(kind, file);
    const note = await this.app.vault.create(path, content);
    new Notice(`Nota compañera creada: ${note.path}`);
    await this.app.workspace.getLeaf("tab").openFile(file);
    await this.app.workspace.getLeaf("split", "vertical").openFile(note);
    return note;
  }

  async ensureFolder(folder) {
    const parts = normalizePath(folder).split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current);
    }
  }

  async uniquePath(folder, name, ext) {
    const base = folder ? `${folder}/${name}` : name;
    let candidate = `${base}.${ext}`;
    let counter = 2;
    while (this.app.vault.getAbstractFileByPath(candidate)) candidate = `${base} ${counter++}.${ext}`;
    return normalizePath(candidate);
  }

  async remember(id) {
    this.settings.recentIds = [id, ...this.settings.recentIds.filter((item) => item !== id)].slice(0, 6);
    await this.saveSettings();
  }

  async toggleFavorite(id) {
    const favorites = this.settings.favoriteIds;
    this.settings.favoriteIds = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    await this.saveSettings();
  }

  async openExternal(file) {
    if (isRiskyName(file?.name)) {
      new Notice("Por seguridad, Pointix no abre programas ni scripts con la aplicación del sistema. Si confías en el archivo, ábrelo desde tu gestor de archivos.");
      return;
    }
    try {
      if (navigator.canShare && typeof this.app.vault.readBinary === "function") {
        const data = await this.app.vault.readBinary(file);
        const sharedFile = new File([data], file.name, { type: mimeForExtension(file.extension) });
        if (navigator.canShare({ files: [sharedFile] })) {
          await navigator.share({ files: [sharedFile], title: file.name });
          return;
        }
      }
      if (typeof this.app.openWithDefaultApp === "function") {
        await this.app.openWithDefaultApp(file.path);
        return;
      }
      const fullPath = this.app.vault.adapter.getFullPath?.(file.path);
      if (fullPath && window.require) {
        const { shell } = window.require("electron");
        await shell.openPath(fullPath);
        return;
      }
      new Notice("La apertura externa depende del sistema. Usa el menú del archivo en este dispositivo.");
    } catch (error) {
      console.error("Pointix File Hub: external open failed", error);
      new Notice("No fue posible abrir la aplicación predeterminada.");
    }
  }

  async openSelectedFile(source) {
    if (!source) return;
    const risky = isRiskyName(source.name);
    try {
      if (!risky && Platform.isDesktopApp && typeof window !== "undefined" && window.require) {
        const { shell, webUtils } = window.require("electron");
        const nativePath = webUtils?.getPathForFile?.(source) || source.path || "";
        if (nativePath) {
          const result = await shell.openPath(nativePath);
          if (!result) return;
          console.warn("Pointix File Hub: default app did not open selected file", result);
        }
      }
      if (PreviewExternalFileModal.supports(source)) {
        new PreviewExternalFileModal(this.app, source).open();
        return;
      }
      if (risky) {
        new Notice("Por seguridad, Pointix no abre programas ni scripts con la aplicación del sistema. Puedes importar una copia a la bóveda o abrirla desde tu gestor de archivos.");
        return;
      }
      if (navigator.canShare?.({ files: [source] })) {
        await navigator.share({ files: [source], title: source.name });
        return;
      }
      new Notice("Este formato no tiene vista temporal en el dispositivo. Puedes abrirlo desde el gestor de archivos o importar una copia a la bóveda.");
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Pointix File Hub: selected file open failed", error);
        new Notice("El sistema no permitió abrir ese archivo. Puedes importarlo o elegir su aplicación desde el gestor de archivos.");
      }
    }
  }

  async importBrowserFile(source, rawFolder, allowedExtensions = null) {
    if (!source) throw new Error("missing-source");
    if (source.size > maxImportBytes()) throw new Error("file-too-large");
    const lastDot = source.name.lastIndexOf(".");
    const rawBase = lastDot > 0 ? source.name.slice(0, lastDot) : source.name;
    const rawExt = lastDot > 0 ? source.name.slice(lastDot + 1) : "bin";
    const extension = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "bin";
    if (allowedExtensions && !allowedExtensions.includes(extension)) throw new Error("unsupported-extension");
    const folder = safeFolder(rawFolder || "");
    if (folder && !this.app.vault.getAbstractFileByPath(folder)) await this.ensureFolder(folder);
    const path = await this.uniquePath(folder, safeName(rawBase) || "Archivo", extension);
    return this.app.vault.createBinary(path, await source.arrayBuffer());
  }

  async launchExternal(href) {
    if (Platform.isDesktopApp && typeof window !== "undefined" && window.require) {
      const { shell } = window.require("electron");
      await shell.openExternal(href);
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  async openWebExternal(value, serviceId = "") {
    let parsed;
    try { parsed = new URL(String(value || "").trim()); } catch (error) {
      new Notice("El enlace de la integración no es válido.");
      return;
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      new Notice("Pointix solo abre enlaces web http o https.");
      return;
    }
    if (serviceId) {
      const type = WEB_INTEGRATIONS.find((item) => item.id === serviceId);
      const check = type ? validateIntegrationUrl(type, parsed.href) : { ok: false, message: "Servicio no reconocido." };
      if (!check.ok) { new Notice(check.message); return; }
    }
    try {
      await this.launchExternal(parsed.href);
    } catch (error) {
      console.error("Pointix File Hub: web open failed", error);
      new Notice("No fue posible abrir el navegador. Copia el enlace desde la nota de integración.");
    }
  }

  // Solo se abren enlaces que un servicio del catálogo declara como suyos. Los protocolos que no son https piden confirmación.
  resolveAppLink(value, serviceId = "") {
    let parsed;
    try { parsed = new URL(String(value || "").trim()); } catch (error) {
      return { ok: false, message: "El enlace para la aplicación no es válido." };
    }
    const known = serviceId ? WEB_INTEGRATIONS.find((item) => item.id === serviceId) : null;
    if (serviceId && !known) return { ok: false, message: "Servicio no reconocido; no se abrió el enlace." };
    const candidates = known ? [known] : WEB_INTEGRATIONS.filter((item) => (item.appProtocols || ["http:", "https:"]).includes(parsed.protocol));
    for (const type of candidates) {
      const check = validateAppUrl(parsed.href, type);
      if (check.ok && check.value) return { ok: true, parsed: new URL(check.value), type };
    }
    return { ok: false, message: "Pointix no reconoce este enlace de aplicación, así que no lo abrió por seguridad." };
  }

  async openAppExternal(value, serviceId = "") {
    const resolved = this.resolveAppLink(value, serviceId);
    if (!resolved.ok) { new Notice(resolved.message); return; }
    const { parsed, type } = resolved;
    const open = async () => {
      try {
        await this.launchExternal(parsed.href);
      } catch (error) {
        console.error("Pointix File Hub: app link failed", error);
        new Notice("No se encontró una aplicación compatible. Usa el enlace web de la ficha.");
      }
    };
    if (parsed.protocol === "https:") { await open(); return; }
    new ConfirmOpenModal(this.app, {
      title: `Abrir ${type.service}`,
      message: `Este enlace abrirá la aplicación instalada de ${type.service} en este dispositivo. Ábrelo solo si lo copiaste tú desde ${type.service}.`,
      url: parsed.href,
      confirmText: "Abrir aplicación",
    }, open).open();
  }

  revealFile(file) {
    if (typeof this.app.showInFolder === "function") this.app.showInFolder(file.path);
    else {
      navigator.clipboard?.writeText(file.path).catch(() => {});
      new Notice(`Ubicación en la bóveda: ${file.path}. La ruta se copió cuando el sistema lo permitió.`);
    }
  }
}

class ReorderCardsModal extends Modal {
  constructor(app, plugin, section) { super(app); this.plugin = plugin; this.section = section; this.ids = []; }
  onOpen() {
    this.modalEl.addClass("pfh-reorder-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `Organizar ${this.section}` });
    contentEl.createEl("p", { text: "Mantén presionado el tirador y mueve cada opción. El cambio solo organiza el catálogo; no mueve archivos." });
    const types = this.plugin.enabledTypes().filter((type) => catalogCategory(type) === this.section);
    this.ids = this.plugin.orderedTypes(types, this.section).map((type) => type.id);
    const list = contentEl.createDiv("pfh-reorder-list");
    const render = () => {
      list.empty();
      this.ids.forEach((id) => {
        const type = types.find((item) => item.id === id); if (!type) return;
        const row = list.createDiv({ cls: "pfh-reorder-row", attr: { "data-id": id } });
        const grip = row.createSpan("pfh-reorder-grip"); setIcon(grip, "grip-vertical");
        const icon = row.createSpan("pfh-picker-icon"); setIcon(icon, type.icon);
        row.createEl("strong", { text: type.name });
        const controls = row.createDiv("pfh-reorder-controls");
        const move = (delta) => {
          const index = this.ids.indexOf(id);
          const next = Math.max(0, Math.min(this.ids.length - 1, index + delta));
          if (next === index) return;
          this.ids.splice(next, 0, this.ids.splice(index, 1)[0]);
          render();
        };
        const up = controls.createEl("button", { attr: { "aria-label": `Subir ${type.name}` } }); up.append(createIcon("chevron-up")); up.addEventListener("click", () => move(-1));
        const down = controls.createEl("button", { attr: { "aria-label": `Bajar ${type.name}` } }); down.append(createIcon("chevron-down")); down.addEventListener("click", () => move(1));
        let active = false;
        grip.addEventListener("pointerdown", (event) => { active = true; grip.setPointerCapture?.(event.pointerId); row.addClass("is-moving"); navigator.vibrate?.(20); });
        grip.addEventListener("pointermove", (event) => {
          if (!active) return;
          const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".pfh-reorder-row");
          if (!target || target === row || !list.contains(target)) return;
          const box = target.getBoundingClientRect();
          list.insertBefore(row, event.clientY < box.top + box.height / 2 ? target : target.nextSibling);
        });
        const finish = () => { if (!active) return; active = false; row.removeClass("is-moving"); this.ids = [...list.querySelectorAll(".pfh-reorder-row")].map((item) => item.dataset.id); };
        grip.addEventListener("pointerup", finish); grip.addEventListener("pointercancel", finish);
      });
    };
    render();
    const actions = contentEl.createDiv("pfh-modal-actions");
    actions.createEl("button", { text: "Cancelar" }).addEventListener("click", () => this.close());
    actions.createEl("button", { cls: "mod-cta", text: "Guardar orden" }).addEventListener("click", async () => {
      this.plugin.settings.categoryOrder = { ...(this.plugin.settings.categoryOrder || {}), [this.section]: this.ids };
      await this.plugin.saveSettings(); this.close();
    });
  }
  onClose() { this.contentEl.empty(); }
}

class CardActionsModal extends Modal {
  constructor(app, plugin, type, section) { super(app); this.plugin = plugin; this.type = type; this.section = section; }
  onOpen() {
    this.modalEl.addClass("pfh-action-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: this.type.name });
    contentEl.createEl("p", { text: "Personaliza esta tarjeta. Ninguna acción modifica archivos de tu bóveda." });
    const actions = contentEl.createDiv("pfh-action-list");
    const add = (iconName, label, callback) => {
      const button = actions.createEl("button", { text: label }); button.prepend(createIcon(iconName));
      button.addEventListener("click", async () => { await callback(); this.close(); });
    };
    const favorite = (this.plugin.settings.favoriteIds || []).includes(this.type.id);
    add(favorite ? "bookmark-minus" : "bookmark-plus", favorite ? "Quitar de favoritos" : "Añadir a favoritos", () => this.plugin.toggleFavorite(this.type.id));
    add("list-start", "Mover al inicio", () => this.plugin.moveTypeToStart(this.section, this.type.id));
    add("list-restart", "Organizar esta categoría", async () => new ReorderCardsModal(this.app, this.plugin, this.section).open());
    add("eye-off", "Ocultar del catálogo", () => this.plugin.hideType(this.type.id));
    add("play", this.type.action ? "Abrir esta opción" : "Crear con esta opción", () => this.plugin.beginCreate(this.type));
  }
  onClose() { this.contentEl.empty(); }
}

class FileHubView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.query = "";
    this.category = "Inicio";
    this.draggedId = null;
  }

  getViewType() { return HUB_VIEW; }
  getDisplayText() { return "Pointix File Hub"; }
  getIcon() { return "pointix-hub"; }
  async onOpen() { this.render(); }

  render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("pointix-file-hub");

    root.toggleClass("is-list-view", this.plugin.settings.mobileView !== "grid");
    const hero = root.createDiv("pfh-hero");
    const heroText = hero.createDiv("pfh-hero-text");
    heroText.createEl("div", { cls: "pfh-eyebrow", text: HERO_EYEBROW });
    heroText.createEl("h1", { text: HERO_TITLE });
    heroText.createEl("p", { text: HERO_TEXT });
    const quick = hero.createEl("button", { cls: "mod-cta pfh-quick", text: "Crear archivo" });
    quick.prepend(createIcon("plus"));
    quick.addEventListener("click", () => new CreateFileModal(this.app, this.plugin).open());

    const tools = root.createDiv("pfh-tools");
    const searchWrap = tools.createDiv("pfh-search");
    searchWrap.append(createIcon("search"));
    const search = searchWrap.createEl("input", { attr: { type: "search", placeholder: "Buscar un tipo de archivo…", "aria-label": "Buscar tipo de archivo" } });
    root.createDiv({ cls: "pfh-sr-only", attr: { role: "status", "aria-live": "polite" } });
    search.value = this.query;
    search.addEventListener("input", () => { this.query = search.value.toLowerCase(); this.renderGrid(root); });

    const chips = tools.createDiv("pfh-chips");
    CATALOG_CATEGORIES.forEach(([category, iconName]) => {
      const chip = chips.createEl("button", { cls: this.category === category ? "is-active" : "" });
      chip.append(createIcon(iconName));
      chip.createSpan({ cls: "pfh-chip-label", text: category });
      chip.setAttribute("aria-label", category); chip.setAttribute("title", category);
      chip.setAttribute("aria-pressed", this.category === category ? "true" : "false");
      chip.addEventListener("click", () => { this.category = category; this.render(); });
    });

    this.renderGrid(root);
  }

  renderGrid(root) {
    root.querySelector(".pfh-content")?.remove();
    const content = root.createDiv("pfh-content");
    const enabledTypes = this.plugin.enabledTypes();
    const all = enabledTypes.filter((type) => {
      const categoryMatches = this.category === "Inicio"
        || (this.category === "Favoritos" && (this.plugin.settings.favoriteIds || []).includes(type.id))
        || catalogCategory(type) === this.category;
      const searchMatches = !this.query || `${type.name} ${type.description} ${type.ext} ${type.group || ""}`.toLowerCase().includes(this.query);
      return categoryMatches && searchMatches;
    });

    if (!this.query && this.category === "Inicio") {
      const recent = (this.plugin.settings.recentIds || []).map((id) => enabledTypes.find((type) => type.id === id)).filter(Boolean);
      const favorites = (this.plugin.settings.favoriteIds || []).map((id) => enabledTypes.find((type) => type.id === id)).filter(Boolean);
      this.renderSection(content, "Recientes", "history", recent, "Recientes");
      if (favorites.length) this.renderSection(content, "Favoritos", "bookmark", favorites, "Favoritos");
      else {
        const emptyFavorites = content.createDiv("pfh-favorites-empty");
        emptyFavorites.append(createIcon("bookmark-plus"));
        const copy = emptyFavorites.createDiv();
        copy.createEl("strong", { text: "Tus favoritos aparecerán aquí" });
        copy.createEl("small", { text: "Mantén presionada una tarjeta en Android o usa clic derecho en PC y laptop." });
      }
      const categoryGrid = content.createDiv("pfh-category-grid");
      CATALOG_CATEGORIES.filter(([name]) => !["Inicio", "Favoritos"].includes(name)).forEach(([name, iconName]) => {
        const button = categoryGrid.createEl("button", { cls: "pfh-category-card" });
        button.append(createIcon(iconName));
        const copy = button.createSpan(); copy.createEl("strong", { text: name });
        copy.createEl("small", { text: `${enabledTypes.filter((type) => catalogCategory(type) === name).length} opciones` });
        button.addEventListener("click", () => { this.category = name; this.render(); });
      });
    } else if (!this.query && ["Integraciones", "Almacenamiento", "IA", "Plantillas", "Documentos", "Datos y código", "Diseño"].includes(this.category)) {
      const groupOf = (type) => type.subgroup || SUBGROUP_BY_ID[type.id] || (type.category === "Plantillas" ? "Plantillas predeterminadas" : null) || type.group
        || (["Documentos", "Datos y código", "Diseño"].includes(this.category) ? "Otros formatos" : "Complementos y capacidades");
      const groups = [...new Set(all.map(groupOf))];
      groups.forEach((group) => this.renderSection(content, group, "layout-grid", all.filter((type) => groupOf(type) === group), this.category));
    } else {
      this.renderSection(content, this.query ? "Resultados" : this.category, "layout-grid", all, this.category);
    }
    if (!all.length) content.createDiv({ cls: "pfh-empty", text: "No encontramos ese formato." });
    const live = root.querySelector(".pfh-sr-only");
    if (live) live.setText(this.query ? `${all.length} resultados` : "");
  }

  renderSection(parent, title, icon, types, sectionKey = title) {
    if (!types.length) return;
    const section = parent.createEl("section", { cls: "pfh-section" });
    const heading = section.createDiv("pfh-section-heading");
    heading.append(createIcon(icon));
    heading.createEl("h2", { text: title });
    const grid = section.createDiv("pfh-grid");
    this.plugin.orderedTypes(types, sectionKey).forEach((type) => grid.append(this.createCard(type, sectionKey)));
    grid.addEventListener("dragover", (event) => event.preventDefault());
  }

  createCard(type, sectionKey) {
    const availability = this.plugin.availability(type);
    const personalizationSection = ["Recientes", "Favoritos", "Resultados"].includes(sectionKey) ? catalogCategory(type) : sectionKey;
    const card = document.createElement("article");
    card.className = `pfh-card pfh-${type.color}`;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", type.action ? type.name : `Crear ${type.name}`);
    card.draggable = !window.matchMedia?.("(pointer: coarse)")?.matches;
    const top = card.createDiv("pfh-card-top");
    const icon = top.createDiv("pfh-card-icon");
    setIcon(icon, type.icon);
    const handle = top.createSpan({ cls: "pfh-drag-handle", attr: { "aria-hidden": "true" } });
    setIcon(handle, "grip-vertical");
    card.createEl("h3", { text: type.name });
    card.createSpan({ cls: "pfh-kind", text: kindFor(type) });
    card.createEl("p", { text: type.description });
    const footer = card.createDiv("pfh-card-footer");
    footer.createSpan({ cls: `pfh-status is-${availability.state}`, text: availability.label });
    footer.createSpan({ cls: "pfh-extension", text: type.action === "open-pdf" ? "Buscar y abrir" : type.action === "import-pdf" ? "Elegir del equipo" : type.action === "companion" ? "Enlazar archivo" : type.action === "web-link" ? type.mode : type.action === "new-template" ? "Nueva plantilla" : type.userTemplate ? "Mi plantilla" : `.${type.ext}` });
    const activate = () => this.plugin.beginCreate(type);
    let timer = null; let held = false; let pressX = 0; let pressY = 0;
    card.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      held = false;
      pressX = event.clientX; pressY = event.clientY;
      timer = window.setTimeout(() => { held = true; navigator.vibrate?.(25); new CardActionsModal(this.app, this.plugin, type, personalizationSection).open(); }, 560);
    });
    ["pointerup", "pointercancel"].forEach((name) => card.addEventListener(name, () => { if (timer) window.clearTimeout(timer); timer = null; }));
    card.addEventListener("pointermove", (event) => {
      if (Math.hypot(event.clientX - pressX, event.clientY - pressY) > 14) {
        if (timer) window.clearTimeout(timer);
        timer = null;
      }
    });
    card.addEventListener("contextmenu", (event) => { event.preventDefault(); new CardActionsModal(this.app, this.plugin, type, personalizationSection).open(); });
    card.addEventListener("click", (event) => { if (held) { event.preventDefault(); held = false; return; } activate(); });
    card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); } });
    card.addEventListener("dragstart", (event) => { this.draggedId = type.id; event.dataTransfer.effectAllowed = "move"; card.addClass("is-dragging"); });
    card.addEventListener("dragend", () => { this.draggedId = null; card.removeClass("is-dragging"); });
    card.addEventListener("dragover", (event) => { event.preventDefault(); card.addClass("is-drop-target"); });
    card.addEventListener("dragleave", () => card.removeClass("is-drop-target"));
    card.addEventListener("drop", async (event) => { event.preventDefault(); card.removeClass("is-drop-target"); await this.plugin.moveType(personalizationSection, this.draggedId, type.id); });
    return card;
  }
}

class FileShellView extends ItemView {
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; this.filePath = ""; }
  getViewType() { return SHELL_VIEW; }
  getDisplayText() { return this.filePath ? this.filePath.split("/").pop() : "Archivo externo"; }
  getIcon() { return "panel-top-open"; }
  async setState(state, result) { this.filePath = state?.file || ""; await this.render(); return super.setState(state, result); }
  getState() { return { file: this.filePath }; }
  async onOpen() { await this.render(); }

  async render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("pointix-file-shell");
    const file = this.app.vault.getAbstractFileByPath(this.filePath);
    if (!file || !file.extension) {
      root.createDiv({ cls: "pfh-empty", text: "El archivo ya no está disponible." });
      return;
    }
    if (SHELL_TEXT_EXTS.includes(file.extension.toLowerCase())) {
      await this.renderTextEditor(root, file);
      return;
    }
    const panel = root.createDiv("pfs-panel");
    const visual = panel.createDiv("pfs-visual");
    visual.append(createIcon(iconForExtension(file.extension)));
    visual.createSpan({ text: file.extension.toUpperCase() });
    panel.createEl("h1", { text: file.name });
    panel.createEl("p", { cls: "pfs-path", text: file.path });
    panel.createEl("p", { cls: "pfs-copy", text: "Este archivo vive en tu bóveda. Pointix conserva el contexto y la aplicación instalada se encarga de editarlo." });
    const actions = panel.createDiv("pfs-actions");
    const open = actions.createEl("button", { cls: "mod-cta", text: "Abrir en la aplicación" });
    open.prepend(createIcon("external-link"));
    open.addEventListener("click", () => this.plugin.openExternal(file));
    const reveal = actions.createEl("button", { text: "Ubicación / carpeta" });
    reveal.prepend(createIcon("folder-open"));
    reveal.addEventListener("click", () => this.plugin.revealFile(file));
    const info = panel.createDiv("pfs-info");
    info.createDiv().setText(`Formato\n.${file.extension}`);
    info.createDiv().setText(`Tamaño\n${formatBytes(file.stat?.size || 0)}`);
    info.createDiv().setText(`Modificado\n${new Date(file.stat?.mtime || Date.now()).toLocaleString()}`);
  }

  async renderTextEditor(root, file) {
    root.addClass("pointix-text-editor");
    const header = root.createDiv("pte-header");
    const identity = header.createDiv("pte-identity");
    const icon = identity.createSpan("pte-icon");
    setIcon(icon, iconForExtension(file.extension));
    const labels = identity.createDiv();
    labels.createEl("h2", { text: file.name });
    labels.createEl("small", { text: file.path });
    const actions = header.createDiv("pte-actions");
    const status = actions.createSpan({ cls: "pte-status", text: "Guardado" });
    const save = actions.createEl("button", { cls: "mod-cta", text: "Guardar" });
    save.prepend(createIcon("save"));
    const editor = root.createEl("textarea", {
      cls: "pte-editor",
      attr: { spellcheck: "false", "aria-label": `Editar ${file.name}` },
    });
    editor.value = await this.app.vault.read(file);
    let dirty = false;
    editor.addEventListener("input", () => {
      dirty = true;
      status.setText("Cambios sin guardar");
      status.addClass("is-dirty");
    });
    const saveFile = async () => {
      if (!dirty) return;
      if (["json", "ipynb"].includes(file.extension.toLowerCase())) {
        try { JSON.parse(editor.value); }
        catch (error) { new Notice("JSON inválido: corrige la sintaxis antes de guardar."); return; }
      }
      save.disabled = true;
      try {
        await this.app.vault.modify(file, editor.value);
        dirty = false;
        status.setText("Guardado");
        status.removeClass("is-dirty");
      } finally {
        save.disabled = false;
      }
    };
    save.addEventListener("click", saveFile);
    editor.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveFile();
      }
    });
    setTimeout(() => editor.focus(), 50);
  }
}

class PdfPickerModal extends Modal {
  constructor(app, plugin) { super(app); this.plugin = plugin; this.query = ""; }
  onOpen() {
    this.modalEl.addClass("pfh-pdf-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Abrir un PDF de tu bóveda" });
    contentEl.createEl("p", { text: "Busca por nombre o carpeta. Pointix no mueve ni copia el archivo: Obsidian lo abre directamente desde su ubicación actual." });
    const searchWrap = contentEl.createDiv("pfh-search pfh-pdf-search");
    searchWrap.append(createIcon("search"));
    const search = searchWrap.createEl("input", { attr: { type: "search", placeholder: "Buscar PDF o carpeta…", "aria-label": "Buscar PDF" } });
    const results = contentEl.createDiv("pfh-pdf-results");
    const allPdfs = this.app.vault.getFiles()
      .filter((file) => file.extension?.toLowerCase() === "pdf")
      .sort((a, b) => a.path.localeCompare(b.path));

    const render = () => {
      results.empty();
      const query = this.query.trim().toLowerCase();
      const matches = allPdfs.filter((file) => !query || file.path.toLowerCase().includes(query));
      if (!matches.length) {
        results.createDiv({ cls: "pfh-empty", text: allPdfs.length ? "No encontramos un PDF con ese nombre o ruta." : "Todavía no hay archivos PDF dentro de esta bóveda." });
        return;
      }
      matches.slice(0, 200).forEach((file) => {
        const item = results.createDiv("pfh-pdf-item");
        const icon = item.createSpan("pfh-picker-icon");
        setIcon(icon, "file-text");
        const labels = item.createSpan("pfh-picker-text");
        labels.createEl("strong", { text: file.name });
        labels.createEl("small", { text: file.parent?.path || "Raíz de la bóveda" });
        const actions = item.createSpan("pfh-picker-actions");
        const native = actions.createEl("button", { text: "Obsidian", attr: { "aria-label": `Abrir ${file.path} con el visor de Obsidian` } });
        native.addEventListener("click", async () => { this.close(); await this.app.workspace.getLeaf("tab").openFile(file); });
        const external = actions.createEl("button", { text: "App", attr: { "aria-label": `Abrir ${file.path} con una aplicación` } });
        external.addEventListener("click", async () => { await this.plugin.openExternal(file); });
        const reveal = actions.createEl("button", { text: "Ubicación", attr: { "aria-label": `Ver ubicación de ${file.path}` } });
        reveal.addEventListener("click", () => this.plugin.revealFile(file));
      });
      if (matches.length > 200) results.createDiv({ cls: "pfh-pdf-limit", text: `Mostrando 200 de ${matches.length} resultados. Escribe parte del nombre o de la carpeta para precisar la búsqueda.` });
    };
    search.addEventListener("input", () => { this.query = search.value; render(); });
    render();
    setTimeout(() => search.focus(), 50);
  }
  onClose() { this.contentEl.empty(); }
}

class CompanionPickerModal extends Modal {
  constructor(app, plugin, type) { super(app); this.plugin = plugin; this.type = type; this.query = ""; }
  onOpen() {
    this.modalEl.addClass("pfh-pdf-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `Crear notas para ${this.type.mediaKind}` });
    contentEl.createEl("p", { text: "Elige un archivo de cualquier carpeta de la bóveda o importa exactamente uno desde el dispositivo. Tú decides en qué carpeta del proyecto guardar el archivo y su nota." });
    const folderField = addVaultFolderField(contentEl, this.app, this.plugin.settings.defaultFolder, "Carpeta del proyecto");
    const importBox = contentEl.createDiv("pfh-import-companion");
    importBox.createEl("strong", { text: "Importar desde el dispositivo" });
    const accept = this.type.mediaExtensions.map((ext) => `.${ext}`).join(",");
    const chooser = importBox.createEl("input", { cls: "pfh-file-input", attr: { type: "file", accept, "aria-label": `Importar ${this.type.mediaKind}` } });
    const importAction = importBox.createEl("button", { cls: "mod-cta", text: "Importar y crear notas" }); importAction.disabled = true;
    chooser.addEventListener("change", () => { importAction.disabled = !chooser.files?.[0]; });
    importAction.addEventListener("click", async () => {
      const source = chooser.files?.[0]; if (!source) return;
      importAction.disabled = true;
      try {
        const folder = folderField.getValue();
        const file = await this.plugin.importBrowserFile(source, folder, this.type.mediaExtensions);
        this.close();
        await this.plugin.createCompanionNote(file, this.type.mediaKind, folder);
      } catch (error) {
        console.error("Pointix File Hub: companion import failed", error);
        new Notice(error?.message === "file-too-large" ? `El archivo supera el límite seguro de ${maxImportLabel()}.` : "No se pudo importar ese archivo. No se examinó ni copió su carpeta.");
        importAction.disabled = false;
      }
    });
    contentEl.createEl("h3", { text: "O elegir de la bóveda" });
    const searchWrap = contentEl.createDiv("pfh-search pfh-pdf-search");
    searchWrap.append(createIcon("search"));
    const search = searchWrap.createEl("input", { attr: { type: "search", placeholder: "Buscar por nombre o carpeta…", "aria-label": "Buscar archivo multimedia" } });
    const results = contentEl.createDiv("pfh-pdf-results");
    const allowed = new Set(this.type.mediaExtensions);
    const files = this.app.vault.getFiles().filter((file) => allowed.has(file.extension?.toLowerCase())).sort((a, b) => a.path.localeCompare(b.path));
    const render = () => {
      results.empty();
      const query = this.query.trim().toLowerCase();
      const matches = files.filter((file) => !query || file.path.toLowerCase().includes(query));
      if (!matches.length) {
        results.createDiv({ cls: "pfh-empty", text: files.length ? "No encontramos un archivo con esa búsqueda." : `No hay archivos compatibles de ${this.type.mediaKind} en la bóveda.` });
        return;
      }
      matches.slice(0, 200).forEach((file) => {
        const button = results.createEl("button", { cls: "pfh-pdf-item", attr: { "aria-label": `Crear notas para ${file.path}` } });
        const icon = button.createSpan("pfh-picker-icon"); setIcon(icon, this.type.icon);
        const labels = button.createSpan("pfh-picker-text"); labels.createEl("strong", { text: file.name }); labels.createEl("small", { text: file.parent?.path || "Raíz de la bóveda" });
        button.addEventListener("click", async () => { this.close(); await this.plugin.createCompanionNote(file, this.type.mediaKind, folderField.getValue()); });
      });
    };
    search.addEventListener("input", () => { this.query = search.value; render(); });
    render();
    setTimeout(() => search.focus(), 50);
  }
  onClose() { this.contentEl.empty(); }
}

class PdfToolsModal extends Modal {
  constructor(app, plugin) { super(app); this.plugin = plugin; }
  onOpen() {
    this.modalEl.addClass("pfh-modal", "pfh-pdf-tools-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "PDF: editar, anotar y firmar" });
    contentEl.createEl("p", { text: "Pointix coordina el archivo y su contexto. El visor nativo sirve para leer; para modificar físicamente el PDF debes elegir una aplicación instalada o un complemento compatible." });
    const options = contentEl.createDiv("pfh-capability-list");
    const item = (iconName, title, copy) => {
      const row = options.createDiv("pfh-capability-item"); row.append(createIcon(iconName));
      const text = row.createDiv(); text.createEl("strong", { text: title }); text.createEl("small", { text: copy });
    };
    item("eye", "Visor de Obsidian", "Lectura y navegación sin alterar el archivo original.");
    item("notebook-tabs", "PDF + notas", "Resumen, citas, páginas, pendientes y conexiones en una nota Markdown.");
    item("external-link", "Aplicación instalada", "Resaltar, anotar, firmar, rellenar formularios o modificar con la app elegida por el sistema.");
    item("shield-check", "Guardado seguro", "La aplicación externa controla los cambios. Mantén respaldo antes de sobrescribir un PDF importante.");
    const actions = contentEl.createDiv("pfh-modal-actions");
    actions.createEl("button", { text: "Abrir PDF de la bóveda" }).addEventListener("click", () => { this.close(); new PdfPickerModal(this.app, this.plugin).open(); });
    actions.createEl("button", { text: "Importar PDF" }).addEventListener("click", () => { this.close(); new ExternalPdfImportModal(this.app, this.plugin).open(); });
    const notes = FILE_TYPES.find((type) => type.id === "pdf-notes");
    actions.createEl("button", { cls: "mod-cta", text: "Crear PDF + notas" }).addEventListener("click", () => { this.close(); new CompanionPickerModal(this.app, this.plugin, notes).open(); });
  }
  onClose() { this.contentEl.empty(); }
}

class ExternalPdfImportModal extends Modal {
  constructor(app, plugin) { super(app); this.plugin = plugin; this.selectedFile = null; }
  onOpen() {
    this.modalEl.addClass("pfh-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Importar un PDF del equipo" });
    contentEl.createEl("p", { text: "Selecciona un único PDF. Pointix creará una copia dentro de la bóveda y nunca recorrerá ni copiará la carpeta que lo contiene." });
    const chooser = contentEl.createEl("input", { cls: "pfh-file-input", attr: { type: "file", accept: "application/pdf,.pdf", "aria-label": "Seleccionar PDF del equipo" } });
    const selected = contentEl.createDiv({ cls: "pfh-selected-file", text: "Ningún archivo seleccionado." });
    const folderField = addVaultFolderField(contentEl, this.app, this.plugin.settings.defaultFolder, "Guardar PDF en");
    const buttons = contentEl.createDiv("pfh-modal-actions");
    const cancel = buttons.createEl("button", { text: "Cancelar" });
    const importButton = buttons.createEl("button", { cls: "mod-cta", text: "Importar y abrir" });
    importButton.disabled = true;
    chooser.addEventListener("change", () => {
      const file = chooser.files?.[0] || null;
      if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
        this.selectedFile = null; selected.setText("Selecciona un archivo PDF válido."); importButton.disabled = true; return;
      }
      this.selectedFile = file;
      selected.setText(`${file.name} · ${formatBytes(file.size)}`);
      importButton.disabled = false;
    });
    cancel.addEventListener("click", () => this.close());
    importButton.addEventListener("click", async () => {
      if (!this.selectedFile || importButton.disabled) return;
      if (this.selectedFile.size > 500 * 1024 * 1024) { new Notice("El PDF supera el límite seguro de 500 MB."); return; }
      importButton.disabled = true;
      try {
        const file = await this.plugin.importBrowserFile(this.selectedFile, folderField.getValue(), ["pdf"]);
        this.close();
        new Notice(`PDF importado: ${file.path}`);
        await this.app.workspace.getLeaf("tab").openFile(file);
      } catch (error) {
        console.error("Pointix File Hub: PDF import failed", error);
        new Notice("No se pudo importar el PDF. No se copiaron carpetas ni archivos adicionales.");
        importButton.disabled = false;
      }
    });
  }
  onClose() { this.selectedFile = null; this.contentEl.empty(); }
}

class ExternalFileImportModal extends Modal {
  constructor(app, plugin) { super(app); this.plugin = plugin; this.selectedFile = null; }
  onOpen() {
    this.modalEl.addClass("pfh-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Importar desde mis dispositivos" });
    contentEl.createEl("p", { text: "El selector oficial del sistema entregará un único archivo. Pointix no examina la carpeta, no recorre el dispositivo y no importa directorios." });
    const chooser = contentEl.createEl("input", { cls: "pfh-file-input", attr: { type: "file", "aria-label": "Elegir un archivo del dispositivo" } });
    const selected = contentEl.createDiv({ cls: "pfh-selected-file", text: "Ningún archivo seleccionado." });
    const folderField = addVaultFolderField(contentEl, this.app, this.plugin.settings.defaultFolder, "Importar en");
    const actions = contentEl.createDiv("pfh-modal-actions");
    actions.createEl("button", { text: "Cancelar" }).addEventListener("click", () => this.close());
    const openButton = actions.createEl("button", { text: "Ver / abrir sin importar" }); openButton.disabled = true;
    const importButton = actions.createEl("button", { cls: "mod-cta", text: "Importar una copia" }); importButton.disabled = true;
    chooser.addEventListener("change", () => {
      this.selectedFile = chooser.files?.[0] || null;
      importButton.disabled = !this.selectedFile;
      openButton.disabled = !this.selectedFile;
      selected.setText(this.selectedFile ? `${this.selectedFile.name} · ${formatBytes(this.selectedFile.size)}` : "Ningún archivo seleccionado.");
    });
    importButton.addEventListener("click", async () => {
      const source = this.selectedFile; if (!source || importButton.disabled) return;
      if (source.size > maxImportBytes()) { new Notice(`El archivo supera el límite seguro de ${maxImportLabel()}.`); return; }
      importButton.disabled = true;
      try {
        const file = await this.plugin.importBrowserFile(source, folderField.getValue());
        this.close(); new Notice(`Archivo importado: ${file.path}`); await this.plugin.openShell(file.path);
      } catch (error) {
        console.error("Pointix File Hub: single file import failed", error);
        new Notice("No se pudo importar el archivo. No se copiaron carpetas ni otros elementos.");
        importButton.disabled = false;
      }
    });
    openButton.addEventListener("click", () => this.plugin.openSelectedFile(this.selectedFile));
  }
  onClose() { this.selectedFile = null; this.contentEl.empty(); }
}

class PreviewExternalFileModal extends Modal {
  constructor(app, source) { super(app); this.source = source; this.objectUrl = ""; }
  static extension(source) {
    const name = String(source?.name || "");
    return name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  }
  static supports(source) {
    const extension = this.extension(source);
    const mime = String(source?.type || "").toLowerCase();
    return mime.startsWith("image/") || mime.startsWith("audio/") || mime.startsWith("video/")
      || mime === "application/pdf" || ["pdf", "png", "jpg", "jpeg", "gif", "webp", "svg", "mp3", "m4a", "wav", "ogg", "mp4", "webm", "txt", "md", "csv", "json", "xml", "yaml", "yml", "toml", "sql", "js", "ts", "css", "html"].includes(extension);
  }
  async onOpen() {
    this.modalEl.addClass("pfh-modal", "pfh-external-preview-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: this.source.name });
    contentEl.createEl("p", { text: "Vista temporal: el archivo permanece en su ubicación original y no se copia a la bóveda." });
    const extension = PreviewExternalFileModal.extension(this.source);
    const mime = String(this.source.type || "").toLowerCase();
    const preview = contentEl.createDiv("pfh-external-preview");
    if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)) {
      this.objectUrl = URL.createObjectURL(this.source);
      preview.createEl("img", { attr: { src: this.objectUrl, alt: this.source.name } });
    } else if (mime.startsWith("audio/") || ["mp3", "m4a", "wav", "ogg"].includes(extension)) {
      this.objectUrl = URL.createObjectURL(this.source);
      preview.createEl("audio", { attr: { src: this.objectUrl, controls: "", preload: "metadata" } });
    } else if (mime.startsWith("video/") || ["mp4", "webm"].includes(extension)) {
      this.objectUrl = URL.createObjectURL(this.source);
      preview.createEl("video", { attr: { src: this.objectUrl, controls: "", preload: "metadata" } });
    } else if (mime === "application/pdf" || extension === "pdf") {
      this.objectUrl = URL.createObjectURL(this.source);
      preview.createEl("iframe", { attr: { src: this.objectUrl, title: `Vista de ${this.source.name}` } });
    } else {
      if (this.source.size > 5 * 1024 * 1024) {
        preview.createDiv({ cls: "pfh-empty", text: "El archivo de texto supera el límite de vista temporal de 5 MB." });
        return;
      }
      const text = await this.source.text();
      preview.createEl("pre", { text });
    }
  }
  onClose() {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = "";
    this.source = null;
    this.contentEl.empty();
  }
}

class WebLinkModal extends Modal {
  constructor(app, plugin, type) { super(app); this.plugin = plugin; this.type = type; }
  onOpen() {
    this.modalEl.addClass("pfh-modal", "pfh-integration-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `Enlazar ${this.type.service}` });
    contentEl.createEl("p", { text: "Pointix guardará una ficha Markdown con acceso, contexto, estado y recuperación. El servicio continúa alojando y controlando el contenido original." });
    const compatibility = contentEl.createDiv("pfh-integration-guidance");
    compatibility.createEl("strong", { text: this.type.mode });
    compatibility.createEl("span", { text: this.type.hasWebApp === false ? ` ${this.type.service} se conecta mediante la aplicación instalada; Pointix no mostrará una sesión web inexistente.` : " Puedes enlazar un recurso público, entrar a la aplicación web cuando esté verificada o abrir la aplicación instalada mediante un enlace oficial." });
    let name = `Proyecto ${this.type.service}`;
    let url = "";
    let appUrl = "";
    let customWebAppUrl = "";
    let access = this.type.defaultAccess || "public-view";
    let purpose = "";
    let notesOnly = false;
    new Setting(contentEl).setName("Nombre").addText((text) => text.setValue(name).onChange((value) => { name = value; }));
    new Setting(contentEl).setName("Enlace público de la nota o recurso").setDesc(this.type.publicLinkHelp || "Opcional. Pega un enlace http/https compartido para visualizar o editar; no pegues la página general del servicio.").addText((text) => text.setPlaceholder(this.type.domains?.[0] ? `https://${this.type.domains[0]}/…` : "https://…").onChange((value) => { url = value.trim(); }));
    new Setting(contentEl).setName(`Abrir en la aplicación ${this.type.service}`).setDesc(this.type.appHelp || "Opcional. Pega un enlace universal o profundo oficial de la aplicación.").addText((text) => text.setPlaceholder(this.type.appUrlPlaceholder || "https://…").onChange((value) => { appUrl = value.trim(); }));
    if (this.type.webAppUserProvided) {
      new Setting(contentEl)
        .setName(`Aplicación web / servidor de ${this.type.service}`)
        .setDesc(this.type.webAppStatus || "Escribe la dirección HTTPS de tu organización o servidor.")
        .addText((text) => text.setPlaceholder(this.type.webAppPlaceholder || "https://…").onChange((value) => { customWebAppUrl = value.trim(); }));
    }
    const routeInfo = contentEl.createDiv("pfh-integration-guidance");
    if (this.type.hasWebApp === false) {
      routeInfo.createEl("strong", { text: "Aplicación instalada" });
      routeInfo.createEl("span", { text: ` ${this.type.service} no dispone de una sesión web verificada para este flujo. Copia su enlace externo oficial; el sistema intentará abrir la aplicación instalada.` });
    } else if (this.type.webAppUrl) {
      routeInfo.createEl("strong", { text: "Aplicación web disponible" });
      routeInfo.createEl("span", { text: ` La ficha incluirá un enlace a la aplicación web de ${this.type.service}. Según tu configuración de Obsidian se abre en el navegador o en un visor integrado, y algunos servicios bloquean los visores integrados. ${this.type.webAppStatus ? `${this.type.webAppStatus}. ` : ""}Pointix no solicita ni conserva credenciales.` });
    } else if (this.type.webAppUserProvided) {
      routeInfo.createEl("strong", { text: "Dirección de organización requerida" });
      routeInfo.createEl("span", { text: ` ${this.type.webAppStatus}. Pointix guardará la dirección en la ficha, pero nunca solicitará ni conservará credenciales.` });
    } else {
      routeInfo.createEl("strong", { text: "Compatibilidad por verificar" });
      routeInfo.createEl("span", { text: " Pointix solo mostrará las rutas confirmadas para este servicio; no inventará accesos a una aplicación web." });
    }
    const accessChoices = {
      "public-view": "Público para visualizar",
      "public-edit": "Público para editar",
      private: "Privado / requiere cuenta",
    };
    new Setting(contentEl).setName("Acceso declarado").setDesc("Pointix lo documenta, pero no modifica los permisos del servicio.").addDropdown((dropdown) => {
      (this.type.accessOptions || Object.keys(accessChoices)).forEach((key) => dropdown.addOption(key, accessChoices[key]));
      return dropdown.setValue(access).onChange((value) => { access = value; });
    });
    new Setting(contentEl).setName("Propósito").setDesc("Opcional: explica por qué este recurso está conectado a tu bóveda.").addText((text) => text.setPlaceholder("Proyecto, reunión, seguimiento…").onChange((value) => { purpose = value.trim(); }));
    new Setting(contentEl)
      .setName("Solo notas")
      .setDesc("Crea la ficha para anotar y relacionar tu trabajo sin guardar ningún enlace de este servicio.")
      .addToggle((toggle) => toggle.setValue(false).onChange((value) => { notesOnly = value; }));
    const folderField = addVaultFolderField(contentEl, this.app, this.plugin.settings.defaultFolder, "Guardar ficha en");
    if (this.type.importHelp) {
      const migration = contentEl.createDiv("pfh-integration-guidance");
      migration.createEl("strong", { text: "Importación manual" });
      migration.createEl("span", { text: ` ${this.type.importHelp}` });
    }
    const buttons = contentEl.createDiv("pfh-modal-actions");
    const cancel = buttons.createEl("button", { text: "Cancelar" });
    const create = buttons.createEl("button", { cls: "mod-cta", text: "Guardar integración" });
    cancel.addEventListener("click", () => this.close());
    create.addEventListener("click", async () => {
      let resolvedWebAppUrl = notesOnly ? "" : (this.type.webAppUrl || "");
      if (customWebAppUrl && !notesOnly) {
        try {
          const parsed = new URL(customWebAppUrl);
          if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("protocol");
          resolvedWebAppUrl = parsed.toString();
        } catch (_) { new Notice("La dirección de la aplicación web debe comenzar con https:// o http://."); return; }
      }
      const typedUrl = notesOnly ? "" : url;
      if (!notesOnly && !typedUrl && !appUrl && !resolvedWebAppUrl) { new Notice("Agrega un enlace, o activa «Solo notas» para crear la ficha sin enlaces."); return; }
      const validation = typedUrl ? validateIntegrationUrl(this.type, typedUrl) : { ok: true };
      if (!validation.ok) { new Notice(validation.message); return; }
      const appValidation = validateAppUrl(notesOnly ? "" : appUrl, this.type);
      if (!appValidation.ok) { new Notice(appValidation.message); return; }
      const linkUrl = validation.parsed ? mdSafeHref(validation.parsed.href) : "";
      const linkApp = appValidation.value ? mdSafeHref(appValidation.value) : "";
      const linkWebApp = resolvedWebAppUrl ? mdSafeHref(resolvedWebAppUrl) : "";
      create.disabled = true;
      try {
        const service = this.type.service;
        const accessLabels = { "public-view": "Público para visualizar", "public-edit": "Público para editar", private: "Privado / requiere cuenta" };
        const securityNotice = access === "public-edit"
          ? "> [!warning] Enlace público con edición\n> Cualquier persona que obtenga el enlace podría modificar o eliminar contenido. Confirma los permisos directamente en el servicio.\n\n"
          : access === "private"
            ? "> [!info] Requiere cuenta\n> Si el inicio de sesión falla en el visor de Obsidian, utiliza **Abrir enlace público en el navegador externo** o la aplicación instalada. Pointix nunca solicita ni guarda tu contraseña.\n\n"
            : "> [!tip] Acceso de visualización\n> La disponibilidad depende de los permisos vigentes en el servicio. Evita publicar información privada o sensible.\n\n";
        const svcId = encodeURIComponent(this.type.id);
        const externalUri = linkUrl ? `obsidian://pointix-open-web?service=${svcId}&url=${encodeURIComponent(validation.parsed.href)}` : "";
        const appUri = linkApp ? `obsidian://pointix-open-app?service=${svcId}&url=${encodeURIComponent(appValidation.value)}` : "";
        const webAppAction = linkWebApp ? `- [Abrir la aplicación web de ${service}](${linkWebApp})\n` : "";
        const appAction = appUri ? `- [Abrir en la aplicación instalada de ${service}](${appUri})\n` : "";
        const publicActions = linkUrl ? `- [Abrir enlace público](${linkUrl})\n- [Abrir enlace público en el navegador externo](${externalUri})\n- Enlace público original: ${linkUrl}\n` : "";

        const noWebNotice = this.type.hasWebApp === false ? `> [!info] Sin aplicación web\n> ${service} se abre mediante la aplicación instalada. Si no responde, comprueba que esté instalada y que el enlace externo se haya copiado desde ${service}.\n\n` : "";
        const notesOnlyNotice = `> [!note] Ficha solo para notas\n> Esta ficha no guarda enlaces de ${service}. Úsala para anotar y relacionar tu trabajo con otras notas.\n\n`;
        const openSection = notesOnly ? notesOnlyNotice : `## Abrir recurso\n\n${webAppAction}${appAction}${publicActions}\n${noWebNotice}${securityNotice}> [!failure] Si aparece un error de acceso, 401 o inicio de sesión\n> Regresa a esta ficha y utiliza otra ruta disponible. Pointix no solicita ni guarda tu contraseña.\n\n`;
        const importSection = this.type.importHelp ? `## Importar manualmente\n\n${this.type.importHelp}\n\n> [!important] Pointix no entra a tu cuenta ni descarga bibliotecas completas. Exporta desde la aplicación original y selecciona únicamente lo que quieras incorporar.\n\n` : "";
        const linkedType = {
          id: this.type.id,
          name: service,
          ext: "md",
          content: ({ title }) => `---\npointix-type: integracion\nservicio: "${yamlText(service)}"\ncategoria-integracion: "${yamlText(this.type.group)}"\nurl-publica: "${yamlText(linkUrl)}"\napp-url: "${yamlText(linkApp)}"\nweb-app: "${yamlText(linkWebApp)}"\nsolo-notas: ${notesOnly}\nacceso: "${yamlText(accessLabels[access])}"\nmodo-pointix: "${yamlText(this.type.mode)}"\nestado: activo\nfecha-creacion: ${today()}\nultima-revision: ${today()}\ntags:\n  - pointix\n  - integracion\n---\n\n# ${title}\n\n> [!abstract] ${service}\n> **Categoría:** ${this.type.group}  ·  **Acceso:** ${accessLabels[access]}  ·  **Compatibilidad:** ${this.type.mode}\n> ${purpose || "Recurso relacionado con esta bóveda."}\n\n${openSection}${importSection}## Estado y responsables\n\n- **Estado:** Activo\n- **Responsable:**\n- **Próxima revisión:**\n\n## Anotaciones\n\n- \n\n## Recursos relacionados\n\n- [[ ]]\n`,
        };
        const result = await this.plugin.createFile(linkedType, name, folderField.getValue());
        if (result) this.close();
      } finally { create.disabled = false; }
    });
  }
  onClose() { this.contentEl.empty(); }
}

class ConfirmOpenModal extends Modal {
  constructor(app, options, onConfirm) { super(app); this.options = options; this.onConfirm = onConfirm; }
  onOpen() {
    this.modalEl.addClass("pfh-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", { text: this.options.message });
    contentEl.createEl("code", { cls: "pfh-confirm-url", text: this.options.url });
    const buttons = contentEl.createDiv("pfh-modal-actions");
    const cancel = buttons.createEl("button", { text: "Cancelar" });
    const confirm = buttons.createEl("button", { cls: "mod-cta", text: this.options.confirmText || "Abrir" });
    cancel.addEventListener("click", () => this.close());
    confirm.addEventListener("click", async () => { this.close(); await this.onConfirm(); });
    window.setTimeout(() => cancel.focus(), 30);
  }
  onClose() { this.contentEl.empty(); }
}

class VaultFilePickerModal extends Modal {
  constructor(app, plugin, options) { super(app); this.plugin = plugin; this.options = options; this.query = ""; }
  onOpen() {
    this.modalEl.addClass("pfh-pdf-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", { text: "Busca por nombre o carpeta. Pointix no mueve ni copia nada: lo abre desde donde ya está." });
    const searchWrap = contentEl.createDiv("pfh-search pfh-pdf-search");
    searchWrap.append(createIcon("search"));
    const search = searchWrap.createEl("input", { attr: { type: "search", placeholder: "Buscar por nombre o carpeta…", "aria-label": "Buscar archivo en la bóveda" } });
    const results = contentEl.createDiv("pfh-pdf-results");
    const all = this.app.vault.getFiles().filter((file) => matchesExtensions(file, this.options.extensions)).sort((a, b) => a.path.localeCompare(b.path));
    const render = () => {
      results.empty();
      const query = this.query.trim().toLowerCase();
      const matches = all.filter((file) => !query || file.path.toLowerCase().includes(query));
      if (!matches.length) {
        results.createDiv({ cls: "pfh-empty", text: all.length ? "No encontramos un archivo con ese nombre o ruta." : "Todavía no hay archivos de este tipo en tu bóveda." });
        return;
      }
      matches.slice(0, 200).forEach((file) => {
        const item = results.createEl("button", { cls: "pfh-pdf-item", attr: { type: "button", "aria-label": `Abrir ${file.path}` } });
        const icon = item.createSpan("pfh-picker-icon"); setIcon(icon, iconForExtension(file.extension));
        const labels = item.createSpan("pfh-picker-text");
        labels.createEl("strong", { text: file.name });
        labels.createEl("small", { text: file.parent?.path || "Raíz de la bóveda" });
        item.addEventListener("click", async () => { this.close(); await this.options.onPick(file); });
      });
      if (matches.length > 200) results.createDiv({ cls: "pfh-pdf-limit", text: `Mostrando 200 de ${matches.length}. Escribe más del nombre para precisar.` });
    };
    search.addEventListener("input", () => { this.query = search.value; render(); });
    render();
    setTimeout(() => search.focus(), 50);
  }
  onClose() { this.contentEl.empty(); }
}

class NameFileModal extends Modal {
  constructor(app, plugin, type) { super(app); this.plugin = plugin; this.type = type; }
  onOpen() {
    this.modalEl.addClass("pfh-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `Nuevo: ${this.type.name}` });
    contentEl.createEl("p", { text: this.type.office ? `Se generará un archivo .${this.type.ext} válido desde una plantilla interna segura.` : this.type.description });
    let name = "Sin título";
    new Setting(contentEl).setName("Nombre").addText((text) => text.setValue(name).onChange((value) => { name = value; }));
    const folderField = addVaultFolderField(contentEl, this.app, this.plugin.settings.defaultFolder, "Guardar en");
    const buttons = contentEl.createDiv("pfh-modal-actions");
    const cancel = buttons.createEl("button", { text: "Cancelar" });    cancel.addEventListener("click", () => this.close());
    const create = buttons.createEl("button", { cls: "mod-cta", text: "Crear" });
    create.addEventListener("click", async () => {
      if (create.disabled) return;
      create.disabled = true;
      try {
        const result = await this.plugin.createFile(this.type, name, folderField.getValue());
        if (result) this.close();
      } catch (error) {
        console.error("Pointix File Hub: file creation failed", error);
        new Notice("No se pudo crear el archivo. No se realizó ninguna copia adicional.");
      } finally {
        create.disabled = false;
      }
    });
    this.renderOpenSection(contentEl, folderField);
    setTimeout(() => contentEl.querySelector("input")?.select(), 50);
  }

  // «Abrir existente»: solo en los tipos donde tiene sentido (ver openModesFor).
  renderOpenSection(contentEl, folderField) {
    const modes = openModesFor(this.type);
    if (!modes) return;
    contentEl.createEl("hr", { cls: "pfh-modal-divider" });
    contentEl.createEl("h3", { cls: "pfh-open-title", text: `Abrir ${modes.noun} existente` });
    const row = (label, hint, buttonText, onClick) => {
      const item = contentEl.createDiv("pfh-open-row");
      const copy = item.createDiv("pfh-open-copy");
      copy.createEl("strong", { text: label });
      copy.createEl("small", { text: hint });
      const button = item.createEl("button", { text: buttonText, attr: { type: "button", "aria-label": `${label}: ${buttonText}` } });
      button.addEventListener("click", onClick);
      return item;
    };
    row("De la bóveda", `Busca un ${modes.noun} que ya está guardado en tu bóveda.`, "Buscar…", () => {
      new VaultFilePickerModal(this.app, this.plugin, {
        title: `Abrir ${modes.noun} de tu bóveda`,
        extensions: modes.vault,
        onPick: async (file) => { this.close(); await this.plugin.openVaultFile(file); },
      }).open();
    });
    if (!modes.device) return;
    const chooser = contentEl.createEl("input", { attr: { type: "file", accept: modes.device.map((ext) => `.${ext}`).join(","), "aria-label": "Elegir un archivo del dispositivo", tabindex: "-1", hidden: "" } });
    row("De mis dispositivos", `Elige un ${modes.noun} de este equipo, de Descargas o de otra carpeta.`, "Buscar…", () => chooser.click());
    const chosen = contentEl.createDiv({ cls: "pfh-device-choice", attr: { "aria-live": "polite" } });
    let source = null;
    chooser.addEventListener("change", () => {
      source = chooser.files?.[0] || null;
      chosen.empty();
      if (!source) return;
      chosen.createDiv({ cls: "pfh-selected-file", text: `${source.name} · ${formatBytes(source.size)}` });
      const actions = chosen.createDiv("pfh-device-actions");
      const importButton = actions.createEl("button", { cls: "mod-cta", text: "Importar una copia" });
      const openButton = actions.createEl("button", { text: Platform.isMobile ? "Abrir con otra app" : "Abrir desde su ubicación" });
      chosen.createEl("small", { text: "«Importar» copia solo este archivo a la carpeta de «Guardar en». Después se abre con la aplicación predeterminada." });
      importButton.addEventListener("click", async () => {
        if (!source || importButton.disabled) return;
        if (source.size > maxImportBytes()) { new Notice(`El archivo supera el límite seguro de ${maxImportLabel()}.`); return; }
        importButton.disabled = true;
        try {
          const file = await this.plugin.importBrowserFile(source, folderField.getValue());
          this.close(); new Notice(`Archivo importado: ${file.path}`);
          await this.plugin.openVaultFile(file);
        } catch (error) {
          console.error("Pointix File Hub: import from creation dialog failed", error);
          new Notice(error?.message === "hidden-folder" || error?.message === "path-traversal" || error?.message === "absolute-path" ? "La carpeta debe ser una ruta relativa y segura dentro de la bóveda." : "No se pudo importar el archivo. No se copiaron carpetas ni otros elementos.");
          importButton.disabled = false;
        }
      });
      openButton.addEventListener("click", async () => { await this.plugin.openSelectedFile(source); });
    });
  }
  onClose() { this.contentEl.empty(); }
}

class NewTemplateModal extends Modal {
  constructor(app, plugin) { super(app); this.plugin = plugin; }
  onOpen() {
    this.modalEl.addClass("pfh-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Nueva plantilla propia" });
    contentEl.createEl("p", { text: "Se guarda como una nota Markdown en tu carpeta de plantillas y aparecerá en Plantillas → Mis plantillas. Dentro puedes usar {{title}}, {{date}} y {{time}}." });
    let name = "Mi plantilla"; let purpose = "";
    new Setting(contentEl).setName("Nombre").addText((text) => text.setValue(name).onChange((value) => { name = value; }));
    new Setting(contentEl).setName("Para qué sirve").setDesc("Aparece como descripción de la tarjeta.").addText((text) => text.setPlaceholder("Ej.: seguimiento semanal de clientes").onChange((value) => { purpose = value.trim(); }));
    const folder = this.plugin.templatesFolderPath();
    contentEl.createEl("small", { cls: "pfh-selected-file", text: `Se guardará en: ${folder || "(carpeta no válida; corrígela en Ajustes)"}` });
    const buttons = contentEl.createDiv("pfh-modal-actions");
    buttons.createEl("button", { text: "Cancelar" }).addEventListener("click", () => this.close());
    const create = buttons.createEl("button", { cls: "mod-cta", text: "Crear plantilla" });
    create.addEventListener("click", async () => {
      if (create.disabled) return;
      if (!folder) { new Notice("La carpeta de plantillas no es válida. Corrígela en Ajustes → Pointix File Hub."); return; }
      create.disabled = true;
      try {
        const file = await this.plugin.createUserTemplate(name, purpose);
        if (file) this.close();
      } catch (error) {
        console.error("Pointix File Hub: template creation failed", error);
        new Notice("No se pudo crear la plantilla.");
      } finally { create.disabled = false; }
    });
    setTimeout(() => contentEl.querySelector("input")?.select(), 50);
  }
  onClose() { this.contentEl.empty(); }
}

class CreateFileModal extends Modal {
  constructor(app, plugin) { super(app); this.plugin = plugin; }
  onOpen() {
    this.modalEl.addClass("pfh-picker-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Crea o conecta lo que necesites" });
    contentEl.createEl("p", { text: "Explora por categoría: notas y plantillas, documentos, datos, diseño, multimedia, PDF, almacenamiento e integraciones. Pointix te llevará al flujo correcto." });
    let category = "Todos"; let query = "";
    const searchWrap = contentEl.createDiv("pfh-search"); searchWrap.append(createIcon("search"));
    const search = searchWrap.createEl("input", { attr: { type: "search", placeholder: "Buscar nota, archivo, aplicación o servicio…" } });
    const chips = contentEl.createDiv("pfh-picker-categories");
    const categories = ["Todos", ...CATALOG_CATEGORIES.map(([name]) => name).filter((name) => !["Inicio", "Favoritos"].includes(name))];
    const results = contentEl.createDiv("pfh-picker-results");
    const render = () => {
      chips.empty();
      categories.forEach((name) => {
        const chip = chips.createEl("button", { cls: category === name ? "is-active" : "", text: name });
        chip.addEventListener("click", () => { category = name; render(); });
      });
      results.empty();
      const types = this.plugin.enabledTypes().filter((type) => {
        const matchCategory = category === "Todos" || catalogCategory(type) === category;
        const haystack = `${type.name} ${type.description} ${type.group || ""} ${type.ext}`.toLowerCase();
        return matchCategory && (!query || haystack.includes(query));
      });
      const grouped = category === "Todos" ? [...new Set(types.map((type) => catalogCategory(type)))] : [category];
      grouped.forEach((group) => {
        const groupTypes = types.filter((type) => catalogCategory(type) === group); if (!groupTypes.length) return;
        const section = results.createEl("section", { cls: "pfh-picker-section" });
        section.createEl("h3", { text: group });
        const grid = section.createDiv("pfh-picker-grid");
        groupTypes.forEach((type) => {
          const button = grid.createEl("button", { cls: "pfh-picker-item" });
          const icon = button.createSpan("pfh-picker-icon"); setIcon(icon, type.icon);
          const text = button.createSpan("pfh-picker-text"); text.createEl("strong", { text: type.name }); text.createEl("small", { text: type.action === "web-link" ? type.group : `.${type.ext}` });
          button.addEventListener("click", () => { this.close(); this.plugin.beginCreate(type); });
        });
      });
      if (!types.length) results.createDiv({ cls: "pfh-empty", text: "No encontramos una opción con ese nombre." });
    };
    search.addEventListener("input", () => { query = search.value.trim().toLowerCase(); render(); });
    render();
  }
  onClose() { this.contentEl.empty(); }
}

class PointixFileHubSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Pointix File Hub" });
    containerEl.createEl("p", { text: "Configura dónde crear archivos. Las plantillas de Office son internas y no se copian carpetas ni archivos de tu bóveda." });
    new Setting(containerEl).setName("Carpeta predeterminada").setDesc("Ruta dentro de la bóveda para los archivos nuevos.").addText((text) => text.setPlaceholder("Documentos").setValue(this.plugin.settings.defaultFolder).onChange(async (value) => { this.plugin.settings.defaultFolder = value; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("Carpeta de mis plantillas").setDesc("Cada nota Markdown de esta carpeta aparece como tarjeta en Plantillas → Mis plantillas. Puedes usar {{title}}, {{date}} y {{time}}.").addText((text) => text.setPlaceholder(DEFAULT_TEMPLATES_FOLDER).setValue(this.plugin.settings.templatesFolder || DEFAULT_TEMPLATES_FOLDER).onChange(async (value) => {
      try { safeFolder(value || DEFAULT_TEMPLATES_FOLDER); } catch (error) { return; }
      this.plugin.settings.templatesFolder = value.trim() || DEFAULT_TEMPLATES_FOLDER;
      await this.plugin.saveSettings();
    }));
    new Setting(containerEl).setName("Abrir después de crear").setDesc("Abre el archivo nativo o su ficha de Pointix.").addToggle((toggle) => toggle.setValue(this.plugin.settings.openAfterCreate).onChange(async (value) => { this.plugin.settings.openAfterCreate = value; await this.plugin.saveSettings(); }));
    containerEl.createEl("h3", { text: "Inicio de Obsidian" });
    new Setting(containerEl).setName("Abrir Pointix al iniciar Obsidian").setDesc("Muestra Pointix File Hub como pantalla principal cada vez que abres la bóveda.").addToggle((toggle) => toggle.setValue(Boolean(this.plugin.settings.openOnStartup)).onChange(async (value) => {
      this.plugin.settings.openOnStartup = value; await this.plugin.saveSettings();
    }));
    new Setting(containerEl).setName("Fijar la pestaña de Pointix").setDesc("La pestaña del Hub queda fijada al inicio de la barra de pestañas y no se cierra por accidente.").addToggle((toggle) => toggle.setValue(Boolean(this.plugin.settings.pinHubTab)).onChange(async (value) => {
      this.plugin.settings.pinHubTab = value; await this.plugin.saveSettings(); this.plugin.syncPinned(value);
    }));
    new Setting(containerEl).setName("Pointix en la pestaña nueva").setDesc("Muestra el acceso a Pointix File Hub encima de las opciones de la pestaña nueva de Obsidian.").addToggle((toggle) => toggle.setValue(this.plugin.settings.showStartEntry !== false).onChange(async (value) => {
      this.plugin.settings.showStartEntry = value; await this.plugin.saveSettings(); this.plugin.syncChrome();
    }));
    new Setting(containerEl).setName("Botón en la barra de pestañas").setDesc("Icono de Pointix al inicio de la barra de pestañas (solo escritorio). En el teléfono usa la barra lateral.").addToggle((toggle) => toggle.setValue(this.plugin.settings.showTabBarButton !== false).onChange(async (value) => {
      this.plugin.settings.showTabBarButton = value; await this.plugin.saveSettings(); this.plugin.syncChrome();
    }));
    new Setting(containerEl).setName("Vista móvil").setDesc("La lista prioriza legibilidad; la cuadrícula muestra más opciones a la vez.").addDropdown((dropdown) => dropdown.addOption("list", "Lista compacta").addOption("grid", "Cuadrícula").setValue(this.plugin.settings.mobileView || "list").onChange(async (value) => { this.plugin.settings.mobileView = value; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("Restablecer organización").setDesc("Recupera tarjetas ocultas y el orden original. No modifica ningún archivo.").addButton((button) => button.setButtonText("Restablecer catálogo").onClick(async () => { this.plugin.settings.hiddenIds = []; this.plugin.settings.categoryOrder = {}; await this.plugin.saveSettings(); new Notice("Catálogo restablecido."); }));
    containerEl.createEl("h3", { text: "Paquetes de creación" });
    containerEl.createEl("p", { text: "Activa únicamente las familias de archivos que quieras ver en el Hub. Puedes cambiarlas cuando lo necesites." });
    PACKS.forEach((pack) => {
      new Setting(containerEl)
        .setName(pack.name)
        .setDesc(pack.description)
        .addToggle((toggle) => toggle
          .setValue((this.plugin.settings.enabledPacks || DEFAULT_SETTINGS.enabledPacks).includes(pack.id))
          .onChange(async (value) => {
            const active = new Set(this.plugin.settings.enabledPacks || DEFAULT_SETTINGS.enabledPacks);
            if (value) active.add(pack.id); else active.delete(pack.id);
            this.plugin.settings.enabledPacks = PACKS.map((item) => item.id).filter((id) => active.has(id));
            await this.plugin.saveSettings();
          }));
    });
    containerEl.createEl("h3", { text: "Soporte y desarrollo" });
    const contact = containerEl.createEl("p", { text: "¿Encontraste un problema o tienes una sugerencia? Escríbenos a " });
    contact.createEl("a", { text: "servicios.globix@gmail.com", href: "mailto:servicios.globix@gmail.com" });
    contact.appendText(" o abre un reporte en GitHub. No envíes contraseñas, claves ni contenido privado de tu bóveda.");
    const support = containerEl.createEl("p", { text: "Si Pointix File Hub te ahorra tiempo, puedes apoyar voluntariamente su desarrollo e invitar al proyecto un café en " });
    support.createEl("a", { text: "Ko-fi", href: "https://ko-fi.com/exprorerit" });
    support.appendText(". El apoyo no desbloquea funciones ni cambia el acceso al complemento.");
  }
}

function createIcon(name) {
  const element = document.createElement("span");
  element.className = "pfh-inline-icon";
  setIcon(element, name);
  return element;
}

function iconForExtension(ext) {
  if (["xlsx", "xls", "csv", "univer"].includes(ext)) return "sheet";
  if (["pptx", "ppt"].includes(ext)) return "presentation";
  if (["docx", "doc", "txt", "rtf"].includes(ext)) return "file-text";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  return "file";
}

function mimeForExtension(ext) {
  const key = String(ext || "").toLowerCase();
  return ({
    pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
    mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", ogg: "audio/ogg",
    mp4: "video/mp4", webm: "video/webm", txt: "text/plain", md: "text/markdown",
  })[key] || "application/octet-stream";
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

module.exports = PointixFileHubPlugin;
PointixFileHubPlugin.__test = { safeFolder, safeName, base64ToArrayBuffer, OFFICE_TEMPLATES, FILE_TYPES, WEB_INTEGRATIONS, PACKS, packIdFor, kindFor, smartNote, companionNote, validateIntegrationUrl, validateAppUrl, today };