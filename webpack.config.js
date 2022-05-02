const prod = process.env.NODE_ENV === 'production';

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const template = {
  mode: prod ? 'production' : 'development',

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        resolve: {
          extensions: ['.ts', '.tsx', '.js', '.json'],
        },
        use: 'ts-loader',
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ]
  },
  devtool: prod ? undefined : 'source-map',
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/browser/index.html',
    }),
    new MiniCssExtractPlugin(),
  ],
};

module.exports = [
  {
    ...template,
    entry: './src/browser/index.tsx',
    output: {
      path: __dirname + '/dist/',
    },
  },
  {
    ...template,
    entry: './src/server/index.ts',
    output: {
      filename: 'server.js'
    }
  }
]
