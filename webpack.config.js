const prod = process.env.NODE_ENV === 'production';

const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const typescriptIsTransformer = require('typescript-is/lib/transform-inline/transformer').default

const plugins = [
  new HtmlWebpackPlugin({
    template: 'src/browser/index.html',
  }),
  new MiniCssExtractPlugin(),
]

const resolve = {
  alias: {
    Common: path.resolve(__dirname, 'src/common/'),
  },
}

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
        //use: 'ts-loader',
        loader: 'ts-loader',
        options: {
          getCustomTransformers: program => ({
            before: [typescriptIsTransformer(program)]
          })
        }
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ]
  },
  devtool: prod ? undefined : 'source-map',
};

module.exports = [
  {
    ...template, 
    target: 'web',
    entry: './src/browser/index.tsx',
    output: {
      path: __dirname + '/dist/',
      publicPath: '/'
    },
    plugins: [
      ...plugins, 
      new webpack.IgnorePlugin({
        resourceRegExp: /^ws$/,
        contextRegExp: /peer-relay/
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer']
      }) 
    ],
    resolve: {
      ...resolve,
      fallback: {
        buffer: require.resolve('buffer/'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/')
      }
    },
  },
  {
    ...template,
    target: 'node',
    entry: './src/server/index.ts',
    output: {
      filename: 'server.js'
    },
    /*optimization: {
      minimize: false
    },*/
    plugins,
    resolve
  }
]
