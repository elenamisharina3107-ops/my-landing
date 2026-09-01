/**
 * Конфиг генератора сайта (Eleventy v3).
 *
 * Вход  — папка src/
 * Выход — папка _site/
 *
 * Файлы стилей и загруженные картинки копируются в сборку «как есть».
 */
module.exports = function (eleventyConfig) {
  // Копировать без обработки
  eleventyConfig.addPassthroughCopy({ "src/styles": "styles" });
  eleventyConfig.addPassthroughCopy({ "src/uploads": "uploads" });

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
