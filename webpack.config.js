const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: {
    bundle: path.resolve(__dirname, 'src/morse.js')
  },
  output: {
    filename: '[name][contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname,'dist')
    },
    watchFiles: {
      paths: ['dist/index.html','src/template.html'],
      options: {
        usePolling: false,
      }
    },
    port: 3000,
    open: false,
    hot: true,
    compress: true,
    historyApiFallback: true,
  },
  devtool: 'inline-source-map',
  plugins: [
    new HtmlWebpackPlugin(
      {
        title: "Morse Tool",
        filename: "index.html",
        template:  path.resolve(__dirname, 'src/template.html')
      }
    ),
    new webpack.ProvidePlugin({ 
    	process: 'process/browser', 
      Buffer: ['buffer', 'Buffer'] 
    }) 
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  },
  resolve: {
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "string_decoder": require.resolve("string_decoder/"),
      "timers": require.resolve("timers-browserify"),
      "url": require.resolve("url/"),
      "buffer": require.resolve("buffer/"),
      "os": require.resolve("os-browserify"), 


    }
  }
};