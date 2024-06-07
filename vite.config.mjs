import glsl from 'vite-plugin-glsl'

/** @type {import('vite').UserConfig} */
export default {
  plugins: [glsl()],
  server:{
    port: 5173,
    host: '0.0.0.0'    
  },
  publicDir: 'static',
}