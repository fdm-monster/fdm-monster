import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

// Types/interfaces that should be imported with 'import type'
const TYPE_ONLY_IMPORTS = new Set([
  // Express types
  'Request', 'Response', 'NextFunction',
  // Interface types (starting with I)
  /^I[A-Z]\w+/,
  // DTO types
  /Dto$/,
  // Other common types
  'SecureContextOptions', 'StorageEngine',
  'PermissionName', 'RoleName', 'PermissionGroup',
  'IPrinterApi',
]);

function isTypeOnly(importName) {
  for (const pattern of TYPE_ONLY_IMPORTS) {
    if (pattern instanceof RegExp) {
      if (pattern.test(importName)) return true;
    } else if (importName === pattern) {
      return true;
    }
  }
  return false;
}

function fixImports(content) {
  const lines = content.split('\n');
  const fixed = [];

  for (let line of lines) {
    // Match: import { A, B, C } from "module"
    const match = line.match(/^import\s+\{([^}]+)\}\s+from\s+(['"].*['"])/);

    if (match) {
      const imports = match[1].split(',').map(s => s.trim());
      const modulePath = match[2];

      const typeImports = [];
      const valueImports = [];

      for (const imp of imports) {
        // Handle "type X" already in import
        if (imp.startsWith('type ')) {
          typeImports.push(imp.substring(5));
        } else if (isTypeOnly(imp)) {
          typeImports.push(imp);
        } else {
          valueImports.push(imp);
        }
      }

      // Reconstruct imports
      const newLines = [];
      if (valueImports.length > 0) {
        newLines.push(`import { ${valueImports.join(', ')} } from ${modulePath}`);
      }
      if (typeImports.length > 0) {
        newLines.push(`import type { ${typeImports.join(', ')} } from ${modulePath}`);
      }

      fixed.push(...newLines);
    } else {
      fixed.push(line);
    }
  }

  return fixed.join('\n');
}

// Process all TypeScript files
const files = await glob('src/**/*.ts', { ignore: 'node_modules/**' });

let count = 0;
for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  const fixed = fixImports(content);

  if (content !== fixed) {
    writeFileSync(file, fixed);
    count++;
    console.log(`Fixed: ${file}`);
  }
}

console.log(`\nFixed ${count} files`);
