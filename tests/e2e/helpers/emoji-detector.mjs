import fs from 'node:fs';
import path from 'node:path';

// Unicode regular expression matching pictorial emojis and symbols
const EMOJI_PATTERN = /(\p{Extended_Pictographic}|[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1FA70}-\u{1FAFF}])/u;

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  '.next',
  '.idea',
  'target',
  '.agents',
  '.claude',
  '.gemini',
  'scratch'
]);

const BINARY_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.ico',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.db',
  '.tsbuildinfo',
  '.class',
  '.jar',
  '.DS_Store'
]);

/**
 * Scan a single file for Unicode emojis.
 * @param {string} filePath Absolute or relative path to file.
 * @returns {Array<{ file: string, line: number, character: string, codePoint: string }>}
 */
export function scanFileForEmojis(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, index) => {
    const match = line.match(EMOJI_PATTERN);
    if (match) {
      violations.push({
        file: filePath,
        line: index + 1,
        character: match[0],
        codePoint: 'U+' + match[0].codePointAt(0).toString(16).toUpperCase()
      });
    }
  });

  return violations;
}

/**
 * Recursively scan a directory for Unicode emojis.
 * @param {string} dirPath Directory path to scan.
 * @returns {Array<{ file: string, line: number, character: string, codePoint: string }>}
 */
export function scanDirectoryForEmojis(dirPath) {
  const results = [];
  if (!fs.existsSync(dirPath)) {
    return results;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        results.push(...scanDirectoryForEmojis(fullPath));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!BINARY_EXTENSIONS.has(ext)) {
        results.push(...scanFileForEmojis(fullPath));
      }
    }
  }

  return results;
}
