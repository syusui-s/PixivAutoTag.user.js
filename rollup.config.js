import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import generateUserJs from './generate_userjs.mjs';

export default {
  input: 'src/main.mjs',
  output: {
    file: 'build/pixiv_auto_tag.user.js',
    format: 'iife',
    name: 'pixiv_auto_tag',
    banner: generateUserJs(),
  },
  watch: {
    include: 'src/**/*',
  },
  plugins: [
    resolve(),
    commonjs(),
  ],
};
