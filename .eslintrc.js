module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "mocha": true,
    "greasemonkey": true,
  },
  "extends": [
    "eslint:recommended",
    "plugin:prettier/recommended",
    "prettier/@typescript-eslint",
  ],
  "plugins": [
    "prettier",
    "@typescript-eslint",
  ],
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": "2020",
  },
  "rules": {
    "prettier/prettier": [
      "error",
      {
        "singleQuote": true,
        "trailingComma": "es5"
      }
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ],
    "eqeqeq": ["error", "always"],
    "arrow-body-style": "error",
    "arrow-parens": ["error", "as-needed"],
    "arrow-spacing": "error",
    "generator-star-spacing": "error",
    "no-duplicate-imports": "error",
    "no-useless-computed-key": "error",
    "no-useless-constructor": "error",
    "no-useless-rename": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-arrow-callback": "error",
    "prefer-const": "error",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
    "prefer-template": "error",
    "rest-spread-spacing": "error",
    "template-curly-spacing": "error",
    "yield-star-spacing": "error"
  }
};
