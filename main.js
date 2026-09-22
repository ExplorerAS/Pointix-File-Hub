const {
  Plugin,
  ItemView,
  Modal,
  Notice,
  PluginSettingTab,
  Setting,
  normalizePath,
  setIcon,
  TFile,
} = require("obsidian");

const HUB_VIEW = "pointix-file-hub-view";
const SHELL_VIEW = "pointix-file-shell-view";
const DEFAULT_SETTINGS = {
  defaultFolder: "",
  favoriteIds: ["markdown", "canvas", "docx", "xlsx"],
  recentIds: [],
  officeTemplates: { docx: "", xlsx: "", pptx: "" },
  openAfterCreate: true,
};

const FILE_TYPES = [
  { id: "markdown", name: "Nota", description: "Markdown nativo y conectado", ext: "md", icon: "notebook-pen", category: "Notas", color: "violet", content: ({ title }) => `# ${title}\n\n` },
  { id: "text", name: "Texto", description: "Texto plano universal", ext: "txt", icon: "text", category: "Notas", color: "blue", content: () => "" },
  { id: "canvas", name: "Canvas", description: "Lienzo visual de Obsidian", ext: "canvas", icon: "layout-dashboard", category: "Visual", color: "pink", content: () => '{\n  "nodes": [],\n  "edges": []\n}\n' },
  { id: "base", name: "Base", description: "Vista de datos nativa", ext: "base", icon: "database", category: "Datos", color: "emerald", content: () => "views:\n  - type: table\n    name: Table\n" },
  { id: "csv", name: "Tabla CSV", description: "Datos compatibles con hojas de cálculo", ext: "csv", icon: "table-2", category: "Datos", color: "emerald", content: () => "Columna 1,Columna 2,Columna 3\n" },
  { id: "json", name: "JSON", description: "Datos estructurados", ext: "json", icon: "braces", category: "Código", color: "amber", content: () => '{\n  \n}\n' },
  { id: "html", name: "Página HTML", description: "Documento web portátil", ext: "html", icon: "code-2", category: "Código", color: "orange", content: ({ title }) => `<!doctype html>\n<html lang="es">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${escapeHtml(title)}</title>\n</head>\n<body>\n  <h1>${escapeHtml(title)}</h1>\n</body>\n</html>\n` },
  { id: "docx", name: "Documento Word", description: "Microsoft Word o editor compatible", ext: "docx", icon: "file-text", category: "Office", color: "blue", office: true },
  { id: "xlsx", name: "Libro de Excel", description: "Microsoft Excel o editor compatible", ext: "xlsx", icon: "sheet", category: "Office", color: "emerald", office: true },
  { id: "pptx", name: "Presentación", description: "PowerPoint o editor compatible", ext: "pptx", icon: "presentation", category: "Office", color: "orange", office: true },
  { id: "univer", name: "Hoja Sheet Plus", description: "Libro editable dentro de Obsidian", ext: "univer", icon: "table-properties", category: "Office", color: "green", integration: ["sheet", "excel", "univer"] },
  { id: "excalidraw", name: "Dibujo Excalidraw", description: "Pizarra y diagramación", ext: "md", icon: "pen-tool", category: "Visual", color: "pink", integration: ["excalidraw"] },
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function safeName(value) {
  return value.trim().replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ");
}

function titleFromId(id) {
  return FILE_TYPES.find((item) => item.id === id)?.name || id;
}

class PointixFileHubPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings.officeTemplates = Object.assign({}, DEFAULT_SETTINGS.officeTemplates, this.settings.officeTemplates || {});

    this.registerView(HUB_VIEW, (leaf) => new FileHubView(leaf, this));
    this.registerView(SHELL_VIEW, (leaf) => new FileShellView(leaf, this));

    this.addRibbonIcon("files", "Abrir Pointix File Hub", () => this.openHub());
    this.addCommand({ id: "open-file-hub", name: "Abrir selector de archivos", callback: () => this.openHub() });
    this.addCommand({ id: "create-from-file-hub", name: "Crear archivo…", callback: () => new CreateFileModal(this.app, this).open() });

    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (!file || !file.extension || file.extension === "md") return;
      menu.addItem((item) => item
        .setTitle("Abrir en Pointix File Hub")
        .setIcon("panel-top-open")
        .onClick(() => this.openShell(file.path)));
    }));

    this.addSettingTab(new PointixFileHubSettingTab(this.app, this));
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(HUB_VIEW);
    this.app.workspace.detachLeavesOfType(SHELL_VIEW);
  }

  async openHub() {
    let leaf = this.app.workspace.getLeavesOfType(HUB_VIEW)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: HUB_VIEW, active: true });
    }
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
    if (type.integration) {
      const command = this.findIntegration(type);
      return command
        ? { state: "ready", label: "Complemento disponible", command }
        : { state: "optional", label: "Requiere complemento" };
    }
    if (type.office) {
      const template = this.settings.officeTemplates[type.ext];
      return template
        ? { state: "ready", label: "Plantilla preparada" }
        : { state: "external", label: "Aplicación externa" };
    }
    return { state: "native", label: "Nativo" };
  }

  async beginCreate(type) {
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
    const folder = normalizePath((rawFolder || this.settings.defaultFolder || "").trim());
    if (folder && !this.app.vault.getAbstractFileByPath(folder)) await this.ensureFolder(folder);

    const path = await this.uniquePath(folder, name, type.ext);
    if (type.office) {
      const template = normalizePath((this.settings.officeTemplates[type.ext] || "").trim());
      const source = template && this.app.vault.getAbstractFileByPath(template);
      if (!(source instanceof TFile) || source.extension.toLowerCase() !== type.ext) {
        console.error("Pointix File Hub: rejected unsafe Office template", { template, expectedExtension: type.ext });
        new Notice(`La plantilla debe ser un archivo real .${type.ext}; las carpetas están bloqueadas por seguridad.`);
        return null;
      }
      if (normalizePath(source.path) === normalizePath(path)) {
        new Notice("La plantilla y el archivo nuevo no pueden tener la misma ruta.");
        return null;
      }
      await this.app.vault.adapter.copy(source.path, path);
    } else {
      const content = type.content ? type.content({ title: name }) : "";
      await this.app.vault.create(path, content);
    }

    this.remember(type.id);
    new Notice(`${type.name} creado: ${path}`);
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file && this.settings.openAfterCreate) {
      if (["md", "canvas", "base"].includes(type.ext)) await this.app.workspace.getLeaf("tab").openFile(file);
      else await this.openShell(path);
    }
    return file;
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
    try {
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

  revealFile(file) {
    if (typeof this.app.showInFolder === "function") this.app.showInFolder(file.path);
    else new Notice("Mostrar en carpeta está disponible en escritorio.");
  }
}

class FileHubView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.query = "";
    this.category = "Todos";
  }

  getViewType() { return HUB_VIEW; }
  getDisplayText() { return "Pointix File Hub"; }
  getIcon() { return "files"; }
  async onOpen() { this.render(); }

  render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("pointix-file-hub");

    const hero = root.createDiv("pfh-hero");
    const heroText = hero.createDiv("pfh-hero-text");
    heroText.createEl("div", { cls: "pfh-eyebrow", text: "POINTIX WORKSPACE" });
    heroText.createEl("h1", { text: "¿Qué quieres crear?" });
    heroText.createEl("p", { text: "Notas, documentos y datos sin abandonar tu hub." });
    const quick = hero.createEl("button", { cls: "mod-cta pfh-quick", text: "Crear archivo" });
    quick.prepend(createIcon("plus"));
    quick.addEventListener("click", () => new CreateFileModal(this.app, this.plugin).open());

    const tools = root.createDiv("pfh-tools");
    const searchWrap = tools.createDiv("pfh-search");
    searchWrap.append(createIcon("search"));
    const search = searchWrap.createEl("input", { attr: { type: "search", placeholder: "Buscar un tipo de archivo…", "aria-label": "Buscar tipo de archivo" } });
    search.value = this.query;
    search.addEventListener("input", () => { this.query = search.value.toLowerCase(); this.renderGrid(root); });

    const chips = tools.createDiv("pfh-chips");
    ["Todos", "Notas", "Office", "Datos", "Visual", "Código"].forEach((category) => {
      const chip = chips.createEl("button", { text: category, cls: this.category === category ? "is-active" : "" });
      chip.addEventListener("click", () => { this.category = category; this.render(); });
    });

    this.renderGrid(root);
  }

  renderGrid(root) {
    root.querySelector(".pfh-content")?.remove();
    const content = root.createDiv("pfh-content");
    const all = FILE_TYPES.filter((type) => {
      const categoryMatches = this.category === "Todos" || type.category === this.category;
      const searchMatches = !this.query || `${type.name} ${type.description} ${type.ext}`.toLowerCase().includes(this.query);
      return categoryMatches && searchMatches;
    });

    if (this.category === "Todos" && !this.query && this.plugin.settings.favoriteIds.length) {
      this.renderSection(content, "Favoritos", "star", this.plugin.settings.favoriteIds.map((id) => FILE_TYPES.find((type) => type.id === id)).filter(Boolean));
    }
    this.renderSection(content, this.query ? "Resultados" : (this.category === "Todos" ? "Todos los formatos" : this.category), "layout-grid", all);
    if (!all.length) content.createDiv({ cls: "pfh-empty", text: "No encontramos ese formato." });
  }

  renderSection(parent, title, icon, types) {
    if (!types.length) return;
    const section = parent.createEl("section", { cls: "pfh-section" });
    const heading = section.createDiv("pfh-section-heading");
    heading.append(createIcon(icon));
    heading.createEl("h2", { text: title });
    const grid = section.createDiv("pfh-grid");
    types.forEach((type) => grid.append(this.createCard(type)));
  }

  createCard(type) {
    const availability = this.plugin.availability(type);
    const card = document.createElement("article");
    card.className = `pfh-card pfh-${type.color}`;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Crear ${type.name}`);
    const top = card.createDiv("pfh-card-top");
    const icon = top.createDiv("pfh-card-icon");
    setIcon(icon, type.icon);
    const favorite = top.createEl("button", { cls: "pfh-favorite", attr: { "aria-label": "Cambiar favorito" } });
    setIcon(favorite, this.plugin.settings.favoriteIds.includes(type.id) ? "star" : "star-off");
    favorite.addEventListener("click", async (event) => { event.stopPropagation(); await this.plugin.toggleFavorite(type.id); });
    card.createEl("h3", { text: type.name });
    card.createEl("p", { text: type.description });
    const footer = card.createDiv("pfh-card-footer");
    footer.createSpan({ cls: `pfh-status is-${availability.state}`, text: availability.label });
    footer.createSpan({ cls: "pfh-extension", text: `.${type.ext}` });
    const activate = () => this.plugin.beginCreate(type);
    card.addEventListener("click", activate);
    card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") activate(); });
    return card;
  }
}

class FileShellView extends ItemView {
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; this.filePath = ""; }
  getViewType() { return SHELL_VIEW; }
  getDisplayText() { return this.filePath ? this.filePath.split("/").pop() : "Archivo externo"; }
  getIcon() { return "panel-top-open"; }
  async setState(state, result) { this.filePath = state?.file || ""; this.render(); return super.setState(state, result); }
  getState() { return { file: this.filePath }; }
  async onOpen() { this.render(); }

  render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("pointix-file-shell");
    const file = this.app.vault.getAbstractFileByPath(this.filePath);
    if (!file || !file.extension) {
      root.createDiv({ cls: "pfh-empty", text: "El archivo ya no está disponible." });
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
    const reveal = actions.createEl("button", { text: "Mostrar en carpeta" });
    reveal.prepend(createIcon("folder-open"));
    reveal.addEventListener("click", () => this.plugin.revealFile(file));
    const info = panel.createDiv("pfs-info");
    info.createDiv().setText(`Formato\n.${file.extension}`);
    info.createDiv().setText(`Tamaño\n${formatBytes(file.stat?.size || 0)}`);
    info.createDiv().setText(`Modificado\n${new Date(file.stat?.mtime || Date.now()).toLocaleString()}`);
  }
}

class NameFileModal extends Modal {
  constructor(app, plugin, type) { super(app); this.plugin = plugin; this.type = type; }
  onOpen() {
    this.modalEl.addClass("pfh-modal");
    const { contentEl } = this;
    contentEl.createEl("h2", { text: `Nuevo: ${this.type.name}` });
    contentEl.createEl("p", { text: this.type.office ? `Se copiará tu plantilla .${this.type.ext} para crear un archivo válido.` : this.type.description });
    let name = "Sin título";
    let folder = this.plugin.settings.defaultFolder;
    new Setting(contentEl).setName("Nombre").addText((text) => text.setValue(name).onChange((value) => { name = value; }));
    new Setting(contentEl).setName("Carpeta").setDesc("Déjala vacía para usar la raíz de la bóveda.").addText((text) => text.setValue(folder).setPlaceholder("Documentos").onChange((value) => { folder = value; }));
    const buttons = contentEl.createDiv("pfh-modal-actions");
    const cancel = buttons.createEl("button", { text: "Cancelar" });
    cancel.addEventListener("click", () => this.close());
    const create = buttons.createEl("button", { cls: "mod-cta", text: "Crear" });
    create.addEventListener("click", async () => {
      if (create.disabled) return;
      create.disabled = true;
      try {
        const result = await this.plugin.createFile(this.type, name, folder);
        if (result) this.close();
      } catch (error) {
        console.error("Pointix File Hub: file creation failed", error);
        new Notice("No se pudo crear el archivo. No se realizó ninguna copia adicional.");
      } finally {
        create.disabled = false;
      }
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
    contentEl.createEl("h2", { text: "Crear nuevo archivo" });
    contentEl.createEl("p", { text: "Elige el formato; Pointix se encargará de la ruta correcta." });
    const grid = contentEl.createDiv("pfh-picker-grid");
    FILE_TYPES.forEach((type) => {
      const button = grid.createEl("button", { cls: "pfh-picker-item" });
      const icon = button.createSpan("pfh-picker-icon"); setIcon(icon, type.icon);
      const text = button.createSpan("pfh-picker-text"); text.createEl("strong", { text: type.name }); text.createEl("small", { text: `.${type.ext}` });
      button.addEventListener("click", () => { this.close(); this.plugin.beginCreate(type); });
    });
  }
  onClose() { this.contentEl.empty(); }
}

class PointixFileHubSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Pointix File Hub" });
    containerEl.createEl("p", { text: "Configura dónde crear archivos y qué documentos usar como plantilla. No se envían datos fuera de tu dispositivo." });
    new Setting(containerEl).setName("Carpeta predeterminada").setDesc("Ruta dentro de la bóveda para los archivos nuevos.").addText((text) => text.setPlaceholder("Documentos").setValue(this.plugin.settings.defaultFolder).onChange(async (value) => { this.plugin.settings.defaultFolder = value; await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("Abrir después de crear").setDesc("Abre el archivo nativo o su ficha de Pointix.").addToggle((toggle) => toggle.setValue(this.plugin.settings.openAfterCreate).onChange(async (value) => { this.plugin.settings.openAfterCreate = value; await this.plugin.saveSettings(); }));
    containerEl.createEl("h3", { text: "Plantillas de Office" });
    containerEl.createEl("p", { text: "Crea una vez archivos vacíos válidos con Word, Excel y PowerPoint, guárdalos en la bóveda e indica aquí sus rutas." });
    [["docx", "Plantilla de Word"], ["xlsx", "Plantilla de Excel"], ["pptx", "Plantilla de PowerPoint"]].forEach(([ext, label]) => {
      new Setting(containerEl).setName(label).setDesc(`Ruta a un archivo .${ext} existente.`).addText((text) => text.setPlaceholder(`Plantillas/Vacío.${ext}`).setValue(this.plugin.settings.officeTemplates[ext]).onChange(async (value) => { this.plugin.settings.officeTemplates[ext] = value; await this.plugin.saveSettings(); }));
    });
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

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

module.exports = PointixFileHubPlugin;
