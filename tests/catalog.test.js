const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

const root = path.resolve(__dirname, "..");

test("manifest and versions agree", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  const versions = JSON.parse(fs.readFileSync(path.join(root, "versions.json"), "utf8"));
  assert.equal(versions[manifest.version], manifest.minAppVersion);
  assert.equal(manifest.id, "pointix-file-hub");
});

test("release files exist", () => {
  for (const file of ["manifest.json", "main.js", "styles.css"]) {
    assert.ok(fs.statSync(path.join(root, file)).size > 0, `${file} should not be empty`);
  }
});

test("plugin remains network-free", () => {
  const source = fs.readFileSync(path.join(root, "main.js"), "utf8");
  assert.doesNotMatch(source, /\b(fetch|XMLHttpRequest|requestUrl)\s*\(/);
});

test("Office creation contains no vault copy operation", () => {
  const source = fs.readFileSync(path.join(root, "main.js"), "utf8");
  assert.doesNotMatch(source, /adapter\.copy|copyFile|copyFolder|vault\.delete|vault\.trash|vault\.rename/);
  assert.match(source, /vault\.createBinary/);
});

function loadPlugin() {
  const originalLoad = Module._load;
  class Base {}
  Module._load = function mockedLoad(request, parent, isMain) {
    if (request === "obsidian") return {
      Plugin: Base,
      ItemView: Base,
      Modal: Base,
      Notice: Base,
      PluginSettingTab: Base,
      Setting: Base,
      normalizePath: (value) => value.replace(/\/{2,}/g, "/").replace(/^\.\//, ""),
      setIcon: () => {},
    };
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    delete require.cache[require.resolve(path.join(root, "main.js"))];
    return require(path.join(root, "main.js"));
  } finally {
    Module._load = originalLoad;
  }
}

test("folder validation blocks absolute and parent paths", () => {
  const PluginClass = loadPlugin();
  const { safeFolder } = PluginClass.__test;
  assert.equal(safeFolder("Documentos/Office"), "Documentos/Office");
  assert.equal(safeFolder(""), "");
  assert.throws(() => safeFolder("../otra-boveda"));
  assert.throws(() => safeFolder("C:/Usuarios"));
  assert.throws(() => safeFolder("/raiz"));
  assert.throws(() => safeFolder(Array(14).fill("nivel").join("/")));
});

test("embedded Office templates are non-empty ZIP packages", () => {
  const PluginClass = loadPlugin();
  const { OFFICE_TEMPLATES, base64ToArrayBuffer } = PluginClass.__test;
  for (const extension of ["docx", "xlsx", "pptx"]) {
    const bytes = new Uint8Array(base64ToArrayBuffer(OFFICE_TEMPLATES[extension]));
    assert.ok(bytes.length > 4000, `${extension} template is unexpectedly small`);
    assert.deepEqual(Array.from(bytes.slice(0, 4)), [0x50, 0x4b, 0x03, 0x04]);
  }
});

test("Excel creation performs exactly one binary file write", async () => {
  const PluginClass = loadPlugin();
  const writes = [];
  const plugin = new PluginClass();
  plugin.settings = { defaultFolder: "", recentIds: [], favoriteIds: [], openAfterCreate: false };
  plugin.creationLocks = new Set();
  plugin.remember = async () => {};
  plugin.app = {
    vault: {
      getAbstractFileByPath: () => null,
      createFolder: async () => { throw new Error("No folder should be created for a root file"); },
      createBinary: async (filePath, data) => { writes.push({ filePath, size: data.byteLength }); return { path: filePath }; },
      create: async () => { throw new Error("Office files must be binary"); },
      adapter: { copy: async () => { throw new Error("Copy must never be called"); } },
    },
  };
  const result = await plugin.createFile({ id: "xlsx", name: "Libro", ext: "xlsx", office: true }, "Prueba", "");
  assert.equal(result.path, "Prueba.xlsx");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].filePath, "Prueba.xlsx");
  assert.ok(writes[0].size > 4000);
});

test("Excalidraw uses the official automation API and performs no manual write", async () => {
  const PluginClass = loadPlugin();
  const plugin = new PluginClass();
  const calls = [];
  plugin.settings = { defaultFolder: "", recentIds: [], favoriteIds: [], openAfterCreate: true, enabledPacks: [] };
  plugin.creationLocks = new Set();
  plugin.remember = async () => {};
  plugin.app = {
    vault: {
      getAbstractFileByPath: (filePath) => filePath === "Dibujo.excalidraw.md" ? { path: filePath } : null,
      create: async () => { throw new Error("Pointix must let Excalidraw create its own file"); },
      createBinary: async () => { throw new Error("Excalidraw is not an Office file"); },
    },
  };
  globalThis.ExcalidrawAutomate = { getAPI: () => ({ create: async (options) => { calls.push(options); return "Dibujo.excalidraw.md"; } }) };
  try {
    const result = await plugin.createFile({ id: "excalidraw", name: "Dibujo Excalidraw", ext: "excalidraw.md", excalidraw: true }, "Dibujo", "");
    assert.equal(result.path, "Dibujo.excalidraw.md");
    assert.deepEqual(calls, [{ filename: "Dibujo", foldername: undefined, onNewPane: true, silent: false }]);
  } finally {
    delete globalThis.ExcalidrawAutomate;
  }
});

test("smart note pack provides structured Markdown templates", () => {
  const PluginClass = loadPlugin();
  const { FILE_TYPES, PACKS } = PluginClass.__test;
  const smartTypes = FILE_TYPES.filter((type) => type.category === "Plantillas");
  assert.ok(PACKS.some((pack) => pack.id === "smart-notes"));
  assert.equal(smartTypes.length, 15);
  for (const type of smartTypes) {
    assert.equal(type.ext, "md");
    const content = type.content({ title: "Prueba" });
    assert.match(content, /pointix-type:/);
    assert.match(content, /fecha-creacion:/);
    assert.match(content, /> \[![a-z-]+\]/);
    assert.match(content, /## /);
  }
});

test("PDF picker opens existing vault files without copying or importing", () => {
  const source = fs.readFileSync(path.join(root, "main.js"), "utf8");
  assert.match(source, /class PdfPickerModal/);
  assert.match(source, /vault\.getFiles\(\)/);
  assert.match(source, /extension\?\.toLowerCase\(\) === "pdf"/);
  assert.match(source, /getLeaf\("tab"\)\.openFile\(file\)/);
  assert.doesNotMatch(source, /adapter\.list|adapter\.copy|copyFile|copyFolder/);
});

test("expanded text catalog stays editable in Pointix", () => {
  const PluginClass = loadPlugin();
  const { FILE_TYPES } = PluginClass.__test;
  const expected = ["yaml", "xml", "toml", "sql", "py", "js", "ts", "sh", "bat", "mmd", "svg", "opml", "rtf", "drawio", "mm", "bib", "vcf", "ics", "ipynb"];
  for (const extension of expected) {
    const type = FILE_TYPES.find((item) => item.ext === extension);
    assert.ok(type, `missing .${extension}`);
    assert.equal(type.viewer, true, `.${extension} must use the Pointix editor`);
  }
});

test("multimedia companion notes link files without modifying them", () => {
  const PluginClass = loadPlugin();
  const { FILE_TYPES } = PluginClass.__test;
  const companions = FILE_TYPES.filter((type) => type.action === "companion");
  assert.equal(companions.length, 5);
  const source = fs.readFileSync(path.join(root, "main.js"), "utf8");
  assert.match(source, /archivo: "\[\[\$\{safePath\}\]\]"/);
  assert.match(source, /createCompanionNote/);
});

test("external PDF import accepts one selected file and never scans its folder", () => {
  const source = fs.readFileSync(path.join(root, "main.js"), "utf8");
  assert.match(source, /accept: "application\/pdf,\.pdf"/);
  assert.match(source, /chooser\.files\?\.\[0\]/);
  assert.match(source, /500 \* 1024 \* 1024/);
  assert.doesNotMatch(source, /readdir|readDirectory|adapter\.list/);
});

test("catalog exposes all nine configurable packs", () => {
  const PluginClass = loadPlugin();
  const { PACKS } = PluginClass.__test;
  assert.deepEqual(PACKS.map((pack) => pack.id), ["essentials", "smart-notes", "office", "data", "code", "visual", "multimedia", "academic", "business"]);
});

test("web integrations create linked Markdown instead of fake service files", () => {
  const PluginClass = loadPlugin();
  const { FILE_TYPES } = PluginClass.__test;
  const webLinks = FILE_TYPES.filter((type) => type.action === "web-link");
  assert.deepEqual(webLinks.map((type) => type.service), ["Figma", "Canva", "Google Sheets"]);
  assert.ok(webLinks.every((type) => type.ext === "md"));
});

test("text formats use the internal Pointix editor", () => {
  const source = fs.readFileSync(path.join(root, "main.js"), "utf8");
  assert.match(source, /\["json", "txt", "csv", "html"/);
  assert.match(source, /renderTextEditor/);
  assert.match(source, /JSON\.parse\(editor\.value\)/);
});
