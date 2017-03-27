var webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const extractSass = new ExtractTextPlugin('../css/landat.css')

module.exports = {
  devtool: '#cheap-inline-source-map',
  entry: [
    './js/base.js'
  ],
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  output: {
    path: __dirname + '/dist',
    filename: "index_bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loaders: [
          'babel?presets[]=react,presets[]=es2015',
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.scss$/,
        loader: extractSass.extract(['css-loader?sourceMap', 'sass-loader?sourceMap'])
        //loaders: ["style-loader", "css-loader?sourceMap", "sass-loader?sourceMap"]
      }
    ]
  },
  plugins: [
    extractSass,
    new UglifyJSPlugin({
      sourceMap: true,
      // Needed so uglify does not drop "unreachable" sass file in entry file
      dead_code: false
    })
  ]

};
