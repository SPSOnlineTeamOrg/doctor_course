
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'js')
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
            presets: ['es2015', 'stage-2'],
            plugins: ["syntax-object-rest-spread"]
        }
      }
    ],
    
    rules: [
      {
        test : /\.vue$/,
        use  : 'raw-loader'
        // use : 'vue-loader'
      }
    ]
  },

  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js' // Use the full build
    }
  },

};
