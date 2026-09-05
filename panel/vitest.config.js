import { defineConfig } from "vitest/config";

// Тесты приложения панели лежат в tests/unit/ в корне репозитория
// (общая папка тестов проекта, см. структуру файлов в плане), а не рядом
// с package.json панели — этот конфиг просто указывает vitest, где искать.
export default defineConfig({
  test: {
    include: ["../tests/unit/**/*.test.js"],
  },
});
