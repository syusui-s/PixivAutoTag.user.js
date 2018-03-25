const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/main.mjs',
  output: {
    filename: 'pixiv_auto_tag.user.js',
    path: path.join(__dirname, 'build')
  },
  module: {
    rules: [
      { test: /\.mjs/, use: 'babel-loader' }
    ]
  }
};
