import { createServer } from "node:http";
import { loadConfig } from "./config.js";
import { createApp } from "./server.js";

// Отдельная точка входа, а не хвост в server.js — там раньше был запуск
// сервера под условием `import.meta.url === file://process.argv[1]` (node
// server.js — да, тест-раннер, который лишь импортирует createApp — нет).
// Оказалось, что под Apache mod_passenger (Beget) это условие никогда не
// выполняется: Passenger подключает файл не так, как обычный `node
// server.js`, и сравнение не совпадает — сервер просто никогда не
// запускался, без единой ошибки в логах. Решение — не гадать, как именно
// нас запустили, а развести «модуль с роутером» (server.js, безопасно
// импортировать откуда угодно) и «точка входа, которая запускает» (этот
// файл) по разным файлам.
const BASE = "/admin/_panel";
const PORT = process.env.PORT || 3000;
// 127.0.0.1, а не все интерфейсы — так проверено вживую на Beget
// (Apache mod_passenger обращается к приложению именно по loopback).
const HOST = process.env.HOST || "127.0.0.1";

const config = loadConfig();
const app = createApp(config);
createServer(app).listen(PORT, HOST, () => {
  console.log(`Панель слушает http://${HOST}:${PORT}${BASE}/health`);
});
