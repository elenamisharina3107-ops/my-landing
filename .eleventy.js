/**
 * Конфиг генератора сайта (Eleventy v3).
 *
 * Вход  — папка src/
 * Выход — папка _site/
 *
 * Файлы стилей копируются в сборку «как есть».
 * Оригиналы картинок лежат в src/uploads/ и остаются в git;
 * в сборку попадают только сжатые версии из шорткода {% image %}.
 */
const path = require("node:path");
const Image = require("@11ty/eleventy-img");
const MarkdownIt = require("markdown-it");
const md = new MarkdownIt({ html: false });

const IMG_WIDTHS = [640, 1280, 2000];

/**
 * Путь картинки из контента (например "/uploads/hero.jpg")
 * → путь в файловой системе ("src/uploads/hero.jpg").
 * Внешние ссылки (http...) отдаются как есть.
 */
function resolveImageInput(src) {
  if (/^https?:\/\//.test(src)) return src;
  return path.join("src", src.replace(/^\//, ""));
}

module.exports = function (eleventyConfig) {
  // Превратить текст из markdown-поля (JSON-данные, не файл .md) в HTML —
  // нужно для полей типа «свой текст политики», которые редактируются
  // в панели как обычный markdown, но лежат в _data/*.json, а не в
  // отдельном .md-файле (те 11ty рендерит сам, без этого фильтра).
  eleventyConfig.addFilter("markdownify", (value) => md.render(value || ""));

  // Текущий год для копирайта («© 2025–{{ currentYear }}») — считается
  // при каждой сборке, вручную менять не нужно.
  eleventyConfig.addGlobalData("currentYear", () => new Date().getFullYear());

  // Копировать без обработки
  eleventyConfig.addPassthroughCopy({ "src/styles": "styles" });

  // Оригиналы картинок — как есть (favicon, og-image, фото и т.п.,
  // на которые ссылаются напрямую, не через шорткод {% image %}).
  eleventyConfig.addPassthroughCopy({ "src/uploads": "uploads" });

  // robots.txt / sitemap.xml — не .njk/.md/.html, Eleventy их не подхватит
  // сам, нужно явно указать.
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  // sitemap.xml собирается из src/sitemap.njk (статьи блога добавляются сами).

  // .htaccess (редирект www/http → https://vireflow.ru) — тоже dot-файл,
  // Eleventy его сам не подхватит.
  eleventyConfig.addPassthroughCopy("src/.htaccess");

  // Панель Sveltia CMS — статические файлы, Eleventy их не трогает.
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.ignores.add("src/admin/**");

  // Коллекция «Услуги» — карточки из src/content/services/*.md,
  // отсортированы по полю order (затем по имени файла).
  eleventyConfig.addCollection("services", (collectionApi) => {
    return collectionApi
      .getFilteredByTag("services")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });

  // Коллекция «Вопросы и ответы» — src/content/faq/*.md, сортировка по order.
  eleventyConfig.addCollection("faq", (collectionApi) => {
    return collectionApi
      .getFilteredByTag("faq")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });

  // Та же папка, разбита по странице: «Сайты» (/sites/) и «ИИ-менеджеры» (/).
  eleventyConfig.addCollection("faqSites", (collectionApi) => {
    return collectionApi
      .getFilteredByTag("sites")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });
  eleventyConfig.addCollection("faqAi", (collectionApi) => {
    return collectionApi
      .getFilteredByTag("ai")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });

  // Черновики: страница с `draft: true` не собирается и на сайт не попадает.
  // Посмотреть черновики локально: BUILD_DRAFTS=1 npm run build
  eleventyConfig.addPreprocessor("drafts", "*", (data) => {
    if (data.draft && !process.env.BUILD_DRAFTS) return false;
  });

  // Ссылка на статью-черновик (ещё не на сайте) превращается в обычный текст,
  // чтобы не вести на несуществующую страницу. Когда статья выйдет — снова ссылка.
  eleventyConfig.addTransform("unlink-drafts", function (content) {
    if (process.env.BUILD_DRAFTS || !(this.page.outputPath || "").endsWith(".html")) return content;
    const fs = require("node:fs");
    return content.replace(/<a href="\/blog\/([a-z0-9-]+)\.html"[^>]*>(.*?)<\/a>/g, (whole, slug, text) => {
      const src = path.join("src", "blog", `${slug}.md`);
      if (!fs.existsSync(src)) return whole;
      return /^draft:\s*true\s*$/m.test(fs.readFileSync(src, "utf8")) ? text : whole;
    });
  });

  // Коллекция «Блог» — статьи с тегом blog, новые сверху.
  // Из неё собираются список статей (/blog/), «Читайте также» и sitemap.xml.
  eleventyConfig.addCollection("blog", (collectionApi) => {
    return collectionApi.getFilteredByTag("blog").sort((a, b) => b.date - a.date);
  });

  // Дата по-русски: «4 августа 2026»
  const RU_MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  eleventyConfig.addFilter("ruDate", (d) => `${d.getDate()} ${RU_MONTHS[d.getMonth()]} ${d.getFullYear()}`);
  eleventyConfig.addFilter("isoDate", (d) => d.toISOString().slice(0, 10));

  // Шорткод {% image src, alt, sizes %}
  // Любая картинка при сборке → webp + jpeg-фолбэк, ширины 640/1280/2000.
  // Результат — тег <picture> с srcset. Файлы кладутся в _site/img/.
  eleventyConfig.addAsyncShortcode("image", async function (src, alt, sizes = "100vw") {
    if (alt === undefined || alt === null) {
      throw new Error(`У картинки "${src}" не заполнен alt (описание для незрячих и поиска)`);
    }

    const metadata = await Image(resolveImageInput(src), {
      widths: IMG_WIDTHS,
      formats: ["webp", "jpeg"],
      outputDir: "./_site/img/",
      urlPath: "/img/",
    });

    return Image.generateHTML(metadata, {
      alt,
      sizes,
      loading: "lazy",
      decoding: "async",
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    // Шаблоны — Nunjucks
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
