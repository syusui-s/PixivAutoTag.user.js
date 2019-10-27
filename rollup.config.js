import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import generateUserJs from './generate_userjs.mjs';

export default {
  input: 'src/main.mjs',
  output: {
    banner: generateUserJs,
    file: 'build/pixiv_auto_tag.user.js',
    format: 'iife',
    name: 'pixiv_auto_tag',
  },
  watch: {
    include: 'src/**/*',
  },
  plugins: [
    resolve(),
    commonjs(),
  ],
};
