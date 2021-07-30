const fs = require('fs');

// Import filters
const markdownIt = require('markdown-it')
const filters = require('./src/build/utils/filters.js')
const transforms = require('./src/build/utils/transforms.js')
const shortcodes = require('./src/build/utils/shortcodes.js')
const iconsprite = require('./src/build/utils/iconsprite.js')
const { DateTime } = require("luxon");

const md = new markdownIt({
  html: true,
});

// Lazy load and LQIP
const lazyImagesPlugin = require('eleventy-plugin-lazyimages');

// PWA
const pluginPWA = require("eleventy-plugin-pwa");

module.exports = function (config) {
  // Plugins
  config.addPlugin(lazyImagesPlugin, {
    imgSelector: '.content img',
  });

  // Filters
  Object.keys(filters).forEach((filterName) => {
    config.addFilter(filterName, filters[filterName])
  })

  config.addFilter("markdown", (content) => {
    return md.render(content);
  });

  // Transforms
  Object.keys(transforms).forEach((transformName) => {
    config.addTransform(transformName, transforms[transformName])
  })

  // Shortcodes
  Object.keys(shortcodes).forEach((shortcodeName) => {
    config.addShortcode(shortcodeName, shortcodes[shortcodeName])
  })

  // Icon Sprite
  config.addNunjucksAsyncShortcode('iconsprite', iconsprite)

  // Asset Watch Targets
  config.addWatchTarget('./src/assets')

  // Markdown
  config.setLibrary(
    'md',
    markdownIt({
      html: true,
      breaks: true,
      linkify: true,
      typographer: true
    })
  )

  // Layout aliases
  config.addLayoutAlias('home', 'layouts/home.njk');
  config.addLayoutAlias('page', 'layouts/page.njk');
  config.addLayoutAlias('archive', 'layouts/archive.njk');

  // Passthrough copy
  config.addPassthroughCopy({ 'src/assets/images': 'assets/images' });
  config.addPassthroughCopy({ 'src/assets/icons': 'assets/icons' });
  config.addPassthroughCopy({ 'src/assets/fonts': 'assets/fonts' });
  config.addPassthroughCopy({ 'src/views/admin/config.yml': 'admin/config.yml' });
  config.addPassthroughCopy('node_modules/nunjucks/browser/nunjucks-slim.js');
  config.addPassthroughCopy('src/robots.txt');

  if (process.env.ELEVENTY_ENV != "development") {
    config.addPlugin(pluginPWA, {
      swDest: "_site/service-worker.js",
      globDirectory: "./_site",
      clientsClaim: true,
      skipWaiting: true,
      globIgnores: [
        'index.html',
        'admin\/**',
        'thank-you\/**',
      ]
    });
  }

  /**
   * 404 Config
   */
  config.setBrowserSyncConfig({
    open: true,
    plugins: ['bs-console-qrcode'],
    callbacks: {
      ready: function (err, browserSync) {
        const content_404 = fs.readFileSync('_site/404.html');

        browserSync.addMiddleware('*', (req, res) => {
          // Provides the 404 content without redirect.
          res.write(content_404);
          res.end();
        });
      }
    }
  });

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: 'views/includes',
      data: 'data'
    },
    templateFormats: ['njk', 'md', '11ty.js'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk'
  }
};
