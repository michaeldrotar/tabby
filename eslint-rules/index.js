/**
 * Local ESLint plugin for custom rules.
 */
const funcStyleFix = require('./func-style-fix.js')
const preferInlineExport = require('./prefer-inline-export.js')

module.exports = {
  rules: {
    'func-style-fix': funcStyleFix,
    'prefer-inline-export': preferInlineExport,
  },
}
