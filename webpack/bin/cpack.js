#! /usr/bin/env node

const path = require('path')

const config = require(path.resolve('webpack.config.js'))

const Complier = require('../lib/Complier.js')
const complier = new Complier(config)

complier.run()
