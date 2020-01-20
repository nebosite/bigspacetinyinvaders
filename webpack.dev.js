const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
//   devtool: 'source-map',
  devServer: {  
      port: 8080,
      contentBase: path.join(__dirname, 'dist'),
      watchContentBase: true
  },
});

