import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'src/main.mjs',
  output: {
    file: 'build/pixiv_auto_tag.js',
    format: 'iife',
    name: 'pixiv_auto_tag',
  },
  plugins: [
    resolve(),
    commonjs(),
  ],
};
