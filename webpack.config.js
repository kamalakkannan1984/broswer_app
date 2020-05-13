const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const packageJson = require('./package.json');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require('terser-webpack-plugin');


const JS_BUNDLE_NAME = 'urweb.bundle.js';

const dependencies = Object.keys(packageJson.dependencies).map(function (name) {
   let package = require('./node_modules/' + name + '/package.json');

   return `${package.name}@${package.version}`;
});
let version = packageJson.version.replace(/-.+$/, '');
let definePluginConfig = {
    __BUNDLE_NAME__: JSON.stringify(JS_BUNDLE_NAME),
    __DEPENDENCIES__: JSON.stringify(dependencies.join(', ')),
 };

const OUTPUT_PATH = path.resolve(__dirname, './public/');
const fileLoader = {
   loader: 'file-loader',
   options: {
      name: '[path][name]-[sha1:hash:hex:8].[ext]',
      outputPath: OUTPUT_PATH
   }
};



let config = {
 //  entry: './src/index.js',
entry:{"login": ["@babel/polyfill","./src/index.js"],"mainpage": ["@babel/polyfill","./src/mainpage.js"]},

   output: {
      filename: `[name]-bundle.js`,
      chunkFilename: "[name].chunk.js",
      path: `${OUTPUT_PATH}`,
      publicPath: 'public',
      libraryTarget: 'var',
      library: 'URWEB'
   },
   optimization: {
      splitChunks: {
         minSize: 10,
         cacheGroups: {
            styles: {
               name: 'styles',
               test: /\.css$/,
               chunks: 'all',
               enforce: true
            }
         }
      },
      minimizer: [
         new TerserPlugin({
            terserOptions: {
               keep_fnames: /Session$/,
            },
         }),
      ],
   },
   performance: {
      maxEntrypointSize: 1024 * 1000 * 1000 * 3,
      maxAssetSize: 1024 * 1000 * 1000 * 3,
   },
   node: {
      fs: 'empty'
   },
   module: {
      rules: [
        
            
         
         { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader",options: {
            presets: ['@babel/preset-env',
                      {
                      'plugins': ['@babel/plugin-proposal-class-properties']}]
        } },
          
         
      
        {
         test: /\.hbs$/,
         loader: 'handlebars-loader',
         exclude: /node_modules/,
         options: {
            helperDirs: [
               path.resolve(__dirname,'src', 'Template', 'helpers')
            ],
            partialDirs: [
               path.resolve(__dirname, 'src', 'Template', 'partials')
            ]
         }
      },
         
         {
            test: /\.css$/,
            use: [
               MiniCssExtractPlugin.loader,
               'css-loader?importLoaders=1',
            ],
         },
         {
            test: /\.(sass|scss)$/,
            use: [
               MiniCssExtractPlugin.loader, {
                  loader: 'css-loader',
                  options: {
                     url: false
                  }
               },
               'sass-loader'
            ]
         },
         {
            test: /.*\.(png|jpg|gif|mp3|wav)$/,
            use: [fileLoader]
         },
       
      ]
   },
   resolve: {
      extensions: [".js", ".hbs"],
   },
  
   externals: {
      'jquery': 'jQuery',
      'child_process': 'child_process',
      'webworker-threads': 'webworker-threads'
   },
   plugins: [
      new MiniCssExtractPlugin({
         filename: 'styles/urweb.bundle.css',

      }),
      //new CleanWebpackPlugin(),
      new CopyWebpackPlugin([{
         from: 'src/assets/',         
      }, {
         from:'src/index.html'
        
      }, {
         from:'src/mainWindow.html'
        
      }]),
      new webpack.LoaderOptionsPlugin({
         options: {
            handlebarsLoader: {}
         }
      }),
      
   ],
   devServer: {
      port: 8091,
      inline: true,
      open: true,
      contentBase: path.join(__dirname,'public'),
      // openPage: 'src/index.html',
      writeToDisk:true,
      watchOptions: {
         aggregateTimeout: 1300,
         ignored: [
            path.resolve(__dirname, 'public'),
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, '.git'),
            path.resolve(__dirname, 'test'),
            '**/*.swp',
         ]
      }
   },
};

module.exports = (env, argv) => {

   if (typeof argv.mode === 'string') {
      config.mode = argv.mode;
   }

   if (argv.release) {
      version = packageJson.version;
   }

   if (argv.bundleAnalyzer) {
      config.plugins.push(new BundleAnalyzerPlugin());
   }

   definePluginConfig['__VERSION__'] = JSON.stringify(version);
   config.plugins.push(new webpack.DefinePlugin(definePluginConfig));

   config.plugins.push(new webpack.BannerPlugin({
      banner: `UnifiedRings web Application`
   }));

   return config;
};
