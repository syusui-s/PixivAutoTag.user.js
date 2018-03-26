import multiEntry from "rollup-plugin-multi-entry";

export default {
  input: "test/**/*.test.mjs",
  output: {
    file: 'build/test/test.js',
    format: 'cjs',
  },
  plugins: [ multiEntry() ],
};
