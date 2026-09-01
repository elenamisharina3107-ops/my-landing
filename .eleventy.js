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
  // Копировать без обработки
  eleventyConfig.addPassthroughCopy({ "src/styles": "styles" });

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
