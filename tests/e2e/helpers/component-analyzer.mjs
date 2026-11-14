import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const frontendPkg = path.resolve(process.cwd(), 'frontend/package.json');
const require = createRequire(frontendPkg);
const ts = require('typescript');

/**
 * Read source file relative to repository root.
 * @param {string} relativePath
 * @returns {string}
 */
export function readSourceFile(relativePath) {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Source file does not exist: ${relativePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf-8');
}

/**
 * Parse TypeScript / TSX source code into an AST SourceFile.
 * @param {string} relativePath
 * @returns {import('typescript').SourceFile}
 */
export function parseTsxAst(relativePath) {
  const content = readSourceFile(relativePath);
  return ts.createSourceFile(
    relativePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
}

/**
 * Extract all CSS class tokens from source text.
 * Preserves Tailwind modifiers like focus:, dark:, sm:, opacity /30, and arbitrary values [..].
 * @param {string} content
 * @returns {Set<string>}
 */
export function extractClassTokens(content) {
  const tokens = new Set();

  // Match className="..." or className='...'
  const directClassMatches = content.matchAll(/(?:className|class)\s*=\s*["']([^"'\n]+)["']/g);
  for (const m of directClassMatches) {
    m[1].split(/\s+/).filter(Boolean).forEach((t) => tokens.add(t));
  }

  // Match string literals inside cn(...) or className={cn(...)}
  const cnMatches = content.matchAll(/cn\(([\s\S]*?)\)/g);
  for (const m of cnMatches) {
    const inner = m[1];
    const stringLiterals = inner.matchAll(/['"`]([^'"`\n]+)['"`]/g);
    for (const sm of stringLiterals) {
      sm[1].split(/\s+/).filter(Boolean).forEach((t) => tokens.add(t));
    }
  }

  // Also include template literals or general className expressions
  const curlyClassMatches = content.matchAll(/className=\{`([^`]+)`\}/g);
  for (const m of curlyClassMatches) {
    m[1].split(/\s+/).filter(Boolean).forEach((t) => tokens.add(t));
  }

  return tokens;
}

/**
 * Extract class tokens using AST traversal over JSX elements.
 * @param {import('typescript').SourceFile} sourceFile
 * @returns {Set<string>}
 */
export function extractAstClassTokens(sourceFile) {
  const tokens = new Set();

  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.text === 'className') {
      if (node.initializer) {
        if (ts.isStringLiteral(node.initializer)) {
          node.initializer.text.split(/\s+/).filter(Boolean).forEach((t) => tokens.add(t));
        } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          const expr = node.initializer.expression;
          extractStringsFromExpression(expr, tokens);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  function extractStringsFromExpression(expr, set) {
    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
      expr.text.split(/\s+/).filter(Boolean).forEach((t) => set.add(t));
    } else if (ts.isTemplateExpression(expr)) {
      expr.head.text.split(/\s+/).filter(Boolean).forEach((t) => set.add(t));
      expr.templateSpans.forEach((span) => {
        span.literal.text.split(/\s+/).filter(Boolean).forEach((t) => set.add(t));
      });
    } else if (ts.isCallExpression(expr)) {
      // Handles cn('...', condition && '...')
      expr.arguments.forEach((arg) => {
        extractStringsFromExpression(arg, set);
      });
    } else if (ts.isBinaryExpression(expr)) {
      extractStringsFromExpression(expr.right, set);
      extractStringsFromExpression(expr.left, set);
    } else if (ts.isConditionalExpression(expr)) {
      extractStringsFromExpression(expr.whenTrue, set);
      extractStringsFromExpression(expr.whenFalse, set);
    }
  }

  visit(sourceFile);
  return tokens;
}

/**
 * Assert that a token set contains all required tokens.
 * @param {Set<string>} tokens
 * @param {string[]} requiredTokens
 */
export function assertContainsTokens(tokens, requiredTokens) {
  const missing = requiredTokens.filter((t) => !tokens.has(t));
  assert.equal(
    missing.length,
    0,
    `Missing required CSS tokens: ${missing.join(', ')}`
  );
}

/**
 * Assert that a token set excludes all forbidden tokens.
 * @param {Set<string>} tokens
 * @param {string[]} forbiddenTokens
 */
export function assertExcludesTokens(tokens, forbiddenTokens) {
  const present = forbiddenTokens.filter((t) => tokens.has(t));
  assert.equal(
    present.length,
    0,
    `Forbidden CSS tokens detected: ${present.join(', ')}`
  );
}

/**
 * Extract all JSX element tag names from an AST SourceFile.
 * @param {import('typescript').SourceFile} sourceFile
 * @returns {string[]}
 */
export function extractJsxElementNames(sourceFile) {
  const elements = [];
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      elements.push(node.tagName.getText(sourceFile));
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return elements;
}

/**
 * Extract named imports from a given module specifier.
 * @param {import('typescript').SourceFile} sourceFile
 * @param {string} moduleName
 * @returns {string[]}
 */
export function extractNamedImports(sourceFile, moduleName) {
  const namedImports = [];
  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      const specifier = node.moduleSpecifier.text || (ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : '');
      if (specifier === moduleName) {
        const bindings = node.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) {
          bindings.elements.forEach((el) => namedImports.push(el.name.text));
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return namedImports;
}

/**
 * Extract all string literals from an AST SourceFile.
 * @param {import('typescript').SourceFile} sourceFile
 * @returns {string[]}
 */
export function extractStringLiterals(sourceFile) {
  const strings = [];
  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      strings.push(node.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return strings;
}
