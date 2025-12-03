/**
 * ESLint rule to enforce inline exports over standalone export statements WITH auto-fix.
 *
 * Transforms:
 *   const foo = () => {}
 *   export { foo }
 *   →
 *   export const foo = () => {}
 *
 * Also handles:
 *   - Multiple exports in one statement
 *   - Type exports (export { type Foo })
 *   - Mixed exports with renamed items (inlines what it can, keeps renamed)
 *
 * Does NOT transform (skips entirely):
 *   - Re-exports from other modules (export { foo } from './bar')
 *   - Renamed exports (export { foo as bar }) - these are left as-is
 *   - Default exports
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce inline exports over standalone export statements',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
    messages: {
      useInlineExport:
        'Use inline export instead of standalone export statement.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode()

    // Track declarations that can be converted to inline exports
    // Map of name -> { node, kind ('const'|'let'|'function'|'class'|'type'|'interface'), canExport: boolean }
    const declarations = new Map()

    // Track standalone export statements and their specifiers
    // We'll process these at the end
    const exportStatements = []

    return {
      // Collect variable declarations
      VariableDeclaration(node) {
        // Skip if already exported
        if (node.parent.type === 'ExportNamedDeclaration') return

        for (const declarator of node.declarations) {
          if (declarator.id.type === 'Identifier') {
            declarations.set(declarator.id.name, {
              node,
              declarator,
              kind: node.kind,
              canExport: true,
            })
          }
        }
      },

      // Collect type aliases
      TSTypeAliasDeclaration(node) {
        if (node.parent.type === 'ExportNamedDeclaration') return
        if (node.id.type === 'Identifier') {
          declarations.set(node.id.name, {
            node,
            kind: 'type',
            canExport: true,
          })
        }
      },

      // Collect interfaces
      TSInterfaceDeclaration(node) {
        if (node.parent.type === 'ExportNamedDeclaration') return
        if (node.id.type === 'Identifier') {
          declarations.set(node.id.name, {
            node,
            kind: 'interface',
            canExport: true,
          })
        }
      },

      // Collect standalone export statements
      ExportNamedDeclaration(node) {
        // Skip if it has a declaration (already inline)
        if (node.declaration) return

        // Skip re-exports from other modules
        if (node.source) return

        exportStatements.push(node)
      },

      // Process at end of file
      'Program:exit'() {
        for (const exportNode of exportStatements) {
          // Categorize specifiers
          const inlinableSpecifiers = []
          const renamedSpecifiers = []

          for (const specifier of exportNode.specifiers) {
            const isRenamed = specifier.local.name !== specifier.exported.name

            if (isRenamed) {
              renamedSpecifiers.push(specifier)
              continue
            }

            const name = specifier.local.name
            const isType =
              specifier.exportKind === 'type' ||
              exportNode.exportKind === 'type'
            const decl = declarations.get(name)

            // Check if this specifier can be inlined
            if (!decl || !decl.canExport) {
              // Can't inline - treat like renamed (keep in export statement)
              renamedSpecifiers.push(specifier)
              continue
            }

            // For type exports of values, we can't inline
            if (isType && !['type', 'interface'].includes(decl.kind)) {
              renamedSpecifiers.push(specifier)
              continue
            }

            // For multi-declaration statements, skip for now
            if (decl.node.declarations && decl.node.declarations.length > 1) {
              renamedSpecifiers.push(specifier)
              continue
            }

            inlinableSpecifiers.push({ specifier, decl, isType })
          }

          // Skip if nothing can be inlined
          if (inlinableSpecifiers.length === 0) continue

          context.report({
            node: exportNode,
            messageId: 'useInlineExport',
            fix(fixer) {
              const fixes = []

              // Add 'export' to each inlinable declaration
              for (const { decl, isType } of inlinableSpecifiers) {
                // For type/interface declarations, just add 'export '
                // The 'type' keyword is already part of the declaration
                if (decl.kind === 'type' || decl.kind === 'interface') {
                  fixes.push(fixer.insertTextBefore(decl.node, 'export '))
                } else {
                  fixes.push(fixer.insertTextBefore(decl.node, 'export '))
                }
              }

              // Handle the export statement
              if (renamedSpecifiers.length === 0) {
                // Remove the entire export statement
                let rangeEnd = exportNode.range[1]
                const textAfter = sourceCode.text.slice(
                  exportNode.range[1],
                  exportNode.range[1] + 2,
                )
                if (textAfter.startsWith('\n')) {
                  rangeEnd += 1
                } else if (textAfter.startsWith('\r\n')) {
                  rangeEnd += 2
                }
                fixes.push(fixer.removeRange([exportNode.range[0], rangeEnd]))
              } else {
                // Rewrite the export statement with only the renamed specifiers
                const specifierTexts = renamedSpecifiers.map((spec) => {
                  const typePrefix = spec.exportKind === 'type' ? 'type ' : ''
                  return `${typePrefix}${spec.local.name} as ${spec.exported.name}`
                })
                const newExport = `export { ${specifierTexts.join(', ')} }`
                fixes.push(fixer.replaceText(exportNode, newExport))
              }

              return fixes
            },
          })
        }
      },
    }
  },
}
