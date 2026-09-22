const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

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

test("Office templates reject folders before copying", () => {
  const source = fs.readFileSync(path.join(root, "main.js"), "utf8");
  assert.match(source, /source instanceof TFile/);
  assert.match(source, /source\.extension\.toLowerCase\(\) !== type\.ext/);
  assert.ok(source.indexOf("source instanceof TFile") < source.indexOf("adapter.copy(source.path, path)"));
});
