const path = require('path');
const fs = require('fs');
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const includeEntries = require('./include-entries.config')

const scriptComponents = require('./script_components.config');

const getEntry = (globPath, exclude) => {
  const entries = {};
  let excludePaths = [];
  let basename;
  let tmp;
  let pathname;

  if (exclude) {
    exclude = (typeof exclude === 'string') ? [exclude] : exclude;
    for (let i = 0; i < exclude.length; i++) {
      excludePaths = excludePaths.concat(glob.sync(exclude[i]));
    }
  }

  glob.sync(globPath).forEach((entry) => {
    if (excludePaths.indexOf(entry) > -1) {
      return;
    }

    basename = path.basename(entry, path.extname(entry));
    tmp = entry.split('/');
    tmp.pop();
    tmp.shift();
    tmp.shift();
    tmp.shift();

    if (tmp[tmp.length - 1] === basename) {
      tmp = tmp.join('/');
      pathname = `${tmp}/${basename}`; // 正确输出js和html的路径
      entries[pathname] = entry;
    }

  });

  return entries;
};

const getHtmlPlugins = (pages, entries) => {
  const confs = [];

  for (let pathname in pages) {
    let pathnameCopy = pathname
    let tmp = pathnameCopy.split('/')
    let pageConfigPath = ''
    let pageConfig = null
    let pageConfigExists = false
    
    // js入口文件名部分去除
    tmp.pop()

    // 每个页面对应config文件路径
    pageConfigPath = path.resolve('.', 'src/pages', tmp.join('/'), 'config.js')
    
    // 文件存在则将相关配置取出
    pageConfigExists = fs.existsSync(pageConfigPath)

    if (pageConfigExists) {
      pageConfig = require(pageConfigPath)
    }

    if (Object.prototype.hasOwnProperty.call(pages, pathname)) {
      // 配置生成的html文件，定义路径等
      let conf = {
        filename: `${pathname}.html`,
        favicon: 'src/assets/imgs/favicon.ico',
        template: pages[pathname], // 模板路径
        inject: true, // js插入位置
        minify: {
          minifyJS: true
        },
        inlineSource: 'manifest', //内联manifest，减少一个请求
        chunks: ['manifest', 'vendor', 'common'], // 依赖插入顺序
        chunksSortMode: 'dependency',
        components: scriptComponents //需要以script链接的方式引入的模块用自定义模板引入
      };

      // 配置页面文件
      if (pageConfig) {
        conf = Object.assign(conf, pageConfig)
      } else {
        conf = Object.assign(conf)
      }

      if (pathname in entries) {
        conf.chunks.push(pathname);
      }

      confs.push(new HtmlWebpackPlugin(conf));
    }
  }

  return confs;
};

const filterEntries = (entries) => {
  if (includeEntries[0] === 'all') {
    return entries
  }

  let filterEntries = {}

  for (let key in entries) {
    for (let i = 0; i < includeEntries.length; i++) {
      let hasInclude = key.indexOf(includeEntries[i])

      if (hasInclude !== -1) {
        filterEntries[key] = entries[key]
      }
    }
  }

  return filterEntries
}

module.exports = {
  getEntry,
  getHtmlPlugins,
  filterEntries
};