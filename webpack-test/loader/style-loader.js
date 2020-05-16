function loader(path, source) {
  console.log(source)
  return `
  const style = document.createElement('style')
  style.innerHTML = ${JSON.stringify(source)}
  document.head.appendChild(style)
  `
}

module.exports = loader
