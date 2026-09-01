#!/usr/bin/env node
/**
 * Лёгкая проверка src/admin/config.yml (схема панели) без браузера:
 * файл — валидный YAML, у каждого поля есть name/widget/label на русском,
 * у картинок рядом есть обязательное поле alt.
 *
 * Не заменяет визуальную проверку в браузере (см. docs/DEV.md) —
 * только ловит опечатки в самой схеме до того, как её увидит браузер.
 */
import { readFileSync } from "node:fs";
import { load } from "js-yaml";

const CONFIG_PATH = "src/admin/config.yml";
const RU_LETTERS = /[а-яё]/i;

let errors = [];

function checkFields(fields, where) {
  if (!Array.isArray(fields)) {
    errors.push(`${where}: нет списка fields`);
    return;
  }
  const names = fields.map((f) => f.name);
  for (const f of fields) {
    const loc = `${where} → поле "${f.name}"`;
    if (!f.name) errors.push(`${where}: у поля нет name`);
    if (!f.widget) errors.push(`${loc}: нет widget`);
    if (!f.label) errors.push(`${loc}: нет label`);
    else if (!RU_LETTERS.test(f.label)) errors.push(`${loc}: label не на русском ("${f.label}")`);
    if (f.hint && !RU_LETTERS.test(f.hint)) errors.push(`${loc}: hint не на русском ("${f.hint}")`);
    // alt обязателен для картинок, которые попадают в <img> на сайте.
    // Служебные картинки только для og:image/превью (например ogImage)
    // рендерятся как meta-тег — alt им не нужен.
    if (f.widget === "image" && f.name !== "ogImage") {
      const altName = `${f.name}Alt`;
      if (!names.includes(altName)) {
        errors.push(`${loc}: у картинки нет обязательного соседнего поля "${altName}" (alt)`);
      }
    }
    if (f.widget === "object" || f.widget === "list") {
      if (f.fields) checkFields(f.fields, loc);
    }
  }
}

const config = load(readFileSync(CONFIG_PATH, "utf8"));

if (!config.backend?.name) errors.push("нет backend.name");
if (!Array.isArray(config.collections) || config.collections.length === 0) {
  errors.push("нет collections");
}

for (const col of config.collections ?? []) {
  if (col.files) {
    for (const file of col.files) checkFields(file.fields, `${col.name} → ${file.name}`);
  } else {
    checkFields(col.fields, col.name);
  }
}

if (errors.length > 0) {
  console.error("❌ Ошибки в config.yml:\n");
  for (const e of errors) console.error(" - " + e);
  process.exit(1);
}

console.log("✅ config.yml: YAML валиден, поля названы, у картинок есть alt.");
