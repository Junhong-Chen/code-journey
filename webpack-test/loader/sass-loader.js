const sass = require('sass')

function loader(path, source) {
  let css = ''
  css = sass.renderSync({file: path}).css.toString()
  return css.replace(/\n/g, '\\n')
}

module.exports = loader
