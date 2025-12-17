const path = require('path');
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix for Excalidraw roughjs module resolution
      // Configure resolve to handle roughjs/bin/* imports without extensions
      
      if (!webpackConfig.resolve) {
        webpackConfig.resolve = {};
      }
      
      // Add aliases for roughjs/bin/* imports (using absolute paths)
      if (!webpackConfig.resolve.alias) {
        webpackConfig.resolve.alias = {};
      }
      
      try {
        const roughjsPath = path.dirname(require.resolve('roughjs/package.json'));
        webpackConfig.resolve.alias['roughjs/bin/rough'] = path.join(roughjsPath, 'bin', 'rough.js');
        webpackConfig.resolve.alias['roughjs/bin/generator'] = path.join(roughjsPath, 'bin', 'generator.js');
        webpackConfig.resolve.alias['roughjs/bin/math'] = path.join(roughjsPath, 'bin', 'math.js');
      } catch (e) {
        console.warn('Could not resolve roughjs path:', e);
      }
      
      // Use NormalModuleReplacementPlugin to rewrite imports at module resolution time
      webpackConfig.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^roughjs\/bin\/(rough|generator|math)$/,
          function(resource) {
            resource.request = resource.request + '.js';
          }
        )
      );
      
      // Ensure .js and .mjs are in extensions (prepend for priority)
      if (!webpackConfig.resolve.extensions) {
        webpackConfig.resolve.extensions = [];
      }
      if (!webpackConfig.resolve.extensions.includes('.js')) {
        webpackConfig.resolve.extensions.unshift('.js');
      }
      if (!webpackConfig.resolve.extensions.includes('.mjs')) {
        webpackConfig.resolve.extensions.unshift('.mjs');
      }
      
      // Set fullySpecified to false at the top-level resolve config
      webpackConfig.resolve.fullySpecified = false;
      
      // Make webpack less strict about file extensions for node_modules in rules
      const rules = webpackConfig.module.rules.find(
        (rule) => rule.oneOf
      );
      
      if (rules) {
        rules.oneOf.forEach((rule) => {
          if (rule.resolve) {
            rule.resolve.fullySpecified = false;
          } else if (rule.test && (rule.test.toString().includes('.js') || rule.test.toString().includes('.mjs'))) {
            rule.resolve = {
              fullySpecified: false,
            };
          }
        });
      }
      
      // Add a specific rule for node_modules to disable fullySpecified
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        include: /node_modules/,
        resolve: {
          fullySpecified: false,
        },
      });
      
      return webpackConfig;
    },
  },
};
