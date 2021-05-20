module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  publicPath: "",
  devServer: {
    proxy: {
      '^/api': {
        target: 'https://campus.gkzhb.top',
        changeOrigin: true,
        pathRewrite: {'^/api/': '/'}
      }
    }
  }
}
