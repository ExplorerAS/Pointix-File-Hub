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
