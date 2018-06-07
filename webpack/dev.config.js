const path = require('path');
const webpack = require('webpack');
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const packageConfig = require('../package.json')

//项目配置
const config = require('./config/config')[process.env.NODE_ENV];
const utils = require('./config/utils');
const postConfig = require('./config/postcss.config');
const resolveConfig = require('./config/resolve.config.js')

let entries = utils.getEntry('./src/pages/**/*.js');
// 过滤不必要修改的入口js，加快编译速度
entries = utils.filterEntries(entries)

let pages = utils.getEntry('./src/pages/**/*.html');
// 过滤不必要修改的html模板，加快编译速度
pages = utils.filterEntries(pages)

const htmlPlugins = utils.getHtmlPlugins(pages, entries);
const chunks = Object.keys(entries);

module.exports = {
  devtool: '#cheap-module-eval-source-map',

  entry: entries,

  output: {
    path: config.outputDir,
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    publicPath: config.publicPath
  },

  module: {
    rules: [
      // {
      //   enforce: 'pre',
      //   test: /\.(js|jsx)$/,
      //   loader: 'eslint-loader',
      //   exclude: /node_modules/
      // },
      {
        test: /\.(js|jsx)$/,
        use: [
          'babel-loader'
        ],
        include: [
          path.join(__dirname, '../src')
        ]
      },
      {
        test: /\.css$/,
        include: /(node_modules|assets)/,
        use: [
          'style-loader', 
          'css-loader'
        ]
      },
      {
        test: /\.scss/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'style-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[nam]-[local]-[hash:base64:5]',
              camelCase: true,
              sourceMap: true
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: postConfig,
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          },
          {
            // 在scss文件中不需要@import来引入scss文件就可使用mixin.scss中的全局变量与mixin
            loader: 'sass-resources-loader',
            options: {
              resources: [
                path.resolve(__dirname, '../src/assets/sass/mixin.scss')
              ]
            }
          }
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?\S*)?$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'img/[name].[hash:7].[ext]'
          }
        }]
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,
        exclude: /node_modules/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 1024,
            name: 'fonts/[name].[hash].[ext]'
          }
        }]
      },
      {
        test: /\.ico$/,
        loader: 'file-loader?name=[name].[ext]'
      }
    ]

  },

  //webpack-dev-server开启
  devServer: {
    port: config.port,
    contentBase: config.outputDir,
    watchContentBase: true, //文件改动将触发整个页面重新加载
    quiet: true,
    proxy: config.proxy
  },

  resolve: resolveConfig,

  plugins: [
    // 将文件同步输出到build
    new WriteFilePlugin(),

    //定义环境变量
    new webpack.DefinePlugin({
      __MODE__: JSON.stringify(process.env.NODE_ENV)
    }),

    //稳定moduleId，避免引入了一个新模块后，导致模块ID变更使得vender和common的hash变化缓存失效
    new webpack.NamedModulesPlugin(),

    //稳定chunkId
    //避免异步加载chunk(或减少chunk)，导致的chunkId变化（做持久化缓存）
    new webpack.NamedChunksPlugin((chunk) => {
      if (chunk.name) {
        return chunk.name;
      }

      return chunk.mapModules(m => path.relative(m.context, m.request)).join("_");
    }),

    //指导webpack打包业务代码时，使用预先打包好的vender.dll.js
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require('../build/vendor-manifest.json'),
    }),

    //给每一个入口添加打包好的vender.dll.js
    new HtmlWebpackIncludeAssetsPlugin({
      assets: ['vendor.dll.js'],
      append: false, //在body尾部的第一条引入
      hash: true
    }),

    // 允许错误不打断程序
    new webpack.NoEmitOnErrorsPlugin(),

    new FriendlyErrorsPlugin({
      compilationSuccessInfo: {
        messages: [`Your application is running here: http://${config.host}:${config.port}`],
      },
      onErrors: () => {
        const notifier = require('node-notifier')

        return (severity, errors) => {
          if (severity !== 'error') return

          const error = errors[0]
          const filename = error.file && error.file.split('!').pop()

          notifier.notify({
            title: packageConfig.name,
            message: severity + ': ' + error.name,
            subtitle: filename || ''
          })
        }
      }
    }),

    //html-Templlate
    ...htmlPlugins
  ]
};