const path = require('path');

module.exports = {
  entry: './index.ts',
  context: path.resolve(__dirname, 'src'),
  devtool: 'source-map',
  mode: 'development',
  devServer: {  
      port: 8080,
      contentBase: path.join(__dirname, 'dist'),
      watchContentBase: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'bigspacetinyinvaders.js',
    path: path.resolve(__dirname, 'dist'),
  },
};