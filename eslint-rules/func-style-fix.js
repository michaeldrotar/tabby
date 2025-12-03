/**
 * ESLint rule to enforce function expressions over declarations WITH auto-fix.
 *
 * This is a local replacement for the built-in `func-style` rule, which doesn't have auto-fix.
 *
 * Transforms:
 *   function foo() { ... }              → const foo = () => { ... }
 *   function foo(a, b) { ... }          → const foo = (a, b) => { ... }
 *   export function foo() { ... }       → export const foo = () => { ... }
 *   async function foo() { ... }        → const foo = async () => { ... }
 *   function foo<T>(a: T): T { ... }    → const foo = <T>(a: T): T => { ... }
 *
 * Does NOT transform:
 *   - Generator functions (can't be arrow functions)
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce function expressions with auto-fix support',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
    messages: {
      useExpression:
        'Use a function expression instead of a function declaration.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode()

    /**
     * Get the text for type parameters (generics)
     */
    const getTypeParametersText = (node) => {
      if (!node.typeParameters) return ''
      return sourceCode.getText(node.typeParameters)
    }

    /**
     * Get the text for return type annotation
     */
    const getReturnTypeText = (node) => {
      if (!node.returnType) return ''
      return sourceCode.getText(node.returnType)
    }

    /**
     * Get the text for all parameters including types
     */
    const getParamsText = (node) => {
      if (node.params.length === 0) return '()'

      const firstParam = node.params[0]
      const lastParam = node.params[node.params.length - 1]

      // Get text from first param to last param
      const paramsContent = sourceCode
        .getText()
        .slice(firstParam.range[0], lastParam.range[1])

      return `(${paramsContent})`
    }

    /**
     * Generate the arrow function replacement
     */
    const generateArrowFunction = (node) => {
      const asyncKeyword = node.async ? 'async ' : ''
      const typeParams = getTypeParametersText(node)
      const params = getParamsText(node)
      const returnType = getReturnTypeText(node)
      const body = sourceCode.getText(node.body)

      // For TSX files, generic arrow functions need a trailing comma: <T,> instead of <T>
      // to disambiguate from JSX tags
      let safeTypeParams = typeParams
      if (typeParams && context.filename && /\.tsx$/.test(context.filename)) {
        // Add trailing comma if it's a single type param without one
        if (typeParams.match(/^<\s*\w+\s*>$/)) {
          safeTypeParams = typeParams.replace(/>$/, ',>')
        }
      }

      return `${asyncKeyword}${safeTypeParams}${params}${returnType} => ${body}`
    }

    return {
      FunctionDeclaration(node) {
        // Skip generators
        if (node.generator) return

        // Skip if no name
        if (!node.id) return

        const functionName = node.id.name

        context.report({
          node,
          messageId: 'useExpression',
          fix(fixer) {
            const arrowFunc = generateArrowFunction(node)
            const parent = node.parent

            // Preserve leading comments
            const comments = sourceCode.getCommentsBefore(node)
            const leadingComments = comments
              .map((c) => sourceCode.getText(c))
              .join('\n')
            const prefix = leadingComments ? leadingComments + '\n' : ''

            if (parent.type === 'ExportNamedDeclaration') {
              // export function foo() {} → export const foo = () => {}
              return fixer.replaceText(
                parent,
                `${prefix}export const ${functionName} = ${arrowFunc}`,
              )
            } else if (parent.type === 'ExportDefaultDeclaration') {
              // export default function foo() {} → const foo = () => {}; export default foo
              // or export default function() {} → export default () => {}
              if (functionName) {
                return fixer.replaceText(
                  parent,
                  `${prefix}const ${functionName} = ${arrowFunc}\nexport default ${functionName}`,
                )
              } else {
                return fixer.replaceText(
                  parent,
                  `${prefix}export default ${arrowFunc}`,
                )
              }
            } else {
              // Regular function declaration
              return fixer.replaceText(
                node,
                `${prefix}const ${functionName} = ${arrowFunc}`,
              )
            }
          },
        })
      },
    }
  },
}
