import multiEntry from 'rollup-plugin-multi-entry';

export default {
  input: 'test/**/*.test.js',
  output: {
    file: 'build/test/test.js',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [ multiEntry() ],
};
