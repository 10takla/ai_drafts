#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readManifest(sourceDir) {
  const manifestPath = path.join(sourceDir, 'manifest.yaml');
  const defaults = { description: '' };
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Манифест не найден: "${manifestPath}".`);
  }

  const text = fs.readFileSync(manifestPath, 'utf8');
  const result = { ...defaults, custom_conditions: {} };
  let inCustomConditions = false;
  for (const line of text.split(/\r?\n/)) {
    const topLevel = line.match(/^(name|version|description):\s*(.*?)\s*$/);
    if (topLevel) {
      result[topLevel[1]] = parseString(topLevel[2]);
      inCustomConditions = false;
      continue;
    }

    if (/^custom_conditions:\s*$/.test(line)) {
      inCustomConditions = true;
      continue;
    }

    if (inCustomConditions) {
      const customCondition = line.match(/^\s+([a-zA-Z0-9_]+):\s*(.*?)\s*$/);
      if (customCondition) {
        result.custom_conditions[customCondition[1]] = parseString(customCondition[2]);
        continue;
      }
      if (line.trim() && !line.trim().startsWith('#')) inCustomConditions = false;
    }
  }
  if (!result.name) {
    throw new Error(`В манифесте "${manifestPath}" отсутствует поле name.`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result.name)) {
    throw new Error('Поле manifest.name должно содержать только строчные латинские буквы, цифры и одиночные дефисы.');
  }
  if (!result.version) {
    throw new Error(`В манифесте "${manifestPath}" отсутствует поле version.`);
  }
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(result.version)) {
    throw new Error('Поле manifest.version должно иметь формат MAJOR.MINOR.PATCH.');
  }
  return result;
}

function parseString(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error(`Некорректная строка YAML: ${trimmed}`);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  return trimmed;
}

function formatDraftReference(manager, name, isAntigravityRule, packName) {
  if (manager === 'antigravity' && isAntigravityRule) {
    return `[${packName}:${name}](rule;${packName}:${name})`;
  }

  const formatters = {
    antigravity: () => `[${packName}:${name}](slashCommand;${packName}:${name})`,
    codex: () => `$${packName}:${name}`,
    'claude-code': () => `/${packName}:${name}`,
    opencode: () => `/${packName}-${name}`
  };
  return formatters[manager]();
}

function compileContent(content, manager, draftsByName, packName) {
  return content.replace(/@draft\(([a-z0-9]+(?:-[a-z0-9]+)*)\)/g, (_, name) => {
    const draft = draftsByName.get(name);
    if (!draft) {
      throw new Error(`Черновик "${name}" из @draft не найден.`);
    }

    const isExplicit = draft.meta.conditions.includes('explicit_invocation');
    const isImplicit = draft.meta.conditions.includes('implicit_invocation');
    if (isExplicit && isImplicit) {
      throw new Error(`Черновик "${name}" одновременно явный и неявный.`);
    }

    const isAntigravityRule = isImplicit || draft.meta.globs !== undefined;
    return formatDraftReference(manager, name, isAntigravityRule, packName);
  });
}

function parseMeta(content) {
  const conditions = [];
  let description = undefined;
  let globs = undefined;

  const lines = content.split(/\r?\n/);
  let listField = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const descMatch = trimmed.match(/^description:\s*(.*)$/);
    if (descMatch) {
      listField = null;
      description = parseString(descMatch[1]);
      continue;
    }

    const globsMatch = trimmed.match(/^globs:\s*(.*)$/);
    if (globsMatch) {
      const value = globsMatch[1].trim();
      if (!value) {
        globs = [];
        listField = 'globs';
      } else if (value.startsWith('[') && value.endsWith(']')) {
        globs = value.slice(1, -1)
          .split(',')
          .map((item) => parseString(item))
          .filter(Boolean);
        listField = null;
      } else if (/^(?:\{|\d|true$|false$|null$)/i.test(value)) {
        globs = { invalid: value };
        listField = null;
      } else {
        globs = parseString(value);
        listField = null;
      }
      continue;
    }

    if (trimmed.startsWith('conditions:')) {
      listField = 'conditions';
      const inlineMatch = trimmed.match(/conditions:\s*\[(.*?)\]/);
      if (inlineMatch) {
        inlineMatch[1]
          .split(',')
          .map((s) => parseString(s))
          .filter(Boolean)
          .forEach((c) => conditions.push(c));
        listField = null;
      }
      continue;
    }

    if (listField && trimmed.startsWith('-')) {
      const value = parseString(trimmed.replace(/^-\s*/, '').split('#')[0]);
      if (value && listField === 'conditions') conditions.push(value);
      if (value && listField === 'globs') globs.push(value);
    } else if (/^[a-zA-Z0-9_]+:/.test(trimmed)) {
      listField = null;
    }
  }

  return { conditions, description, globs };
}

function validateDraft(draft, manifest) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.name)) {
    throw new Error(
      `Имя черновика "${draft.name}" должно содержать только строчные латинские буквы, цифры и одиночные дефисы.`
    );
  }

  const invocationModes = draft.meta.conditions.filter((condition) =>
    condition === 'explicit_invocation' || condition === 'implicit_invocation'
  );
  if (invocationModes.length === 0) {
    throw new Error(`В черновике "${draft.name}" отсутствует режим вызова.`);
  }
  if (invocationModes.length !== 1) {
    throw new Error(`Черновик "${draft.name}" одновременно явный и неявный.`);
  }

  for (const condition of draft.meta.conditions) {
    if (condition === 'explicit_invocation' || condition === 'implicit_invocation') continue;
    if (!Object.prototype.hasOwnProperty.call(manifest.custom_conditions, condition)) {
      throw new Error(`Условие "${condition}" из черновика "${draft.name}" не определено в manifest.custom_conditions.`);
    }
  }

  const { globs } = draft.meta;
  if (globs !== undefined && typeof globs !== 'string' &&
      !(Array.isArray(globs) && globs.every((glob) => typeof glob === 'string'))) {
    throw new Error(`Поле globs черновика "${draft.name}" должно иметь тип string или string[].`);
  }
}

function formatGlobs(globs) {
  return Array.isArray(globs) ? globs.join(', ') : globs;
}

function buildDescription(draft, manifest, includeGlobsFallback) {
  const parts = [];
  if (draft.meta.description) parts.push(draft.meta.description);
  for (const condition of draft.meta.conditions) {
    if (Object.prototype.hasOwnProperty.call(manifest.custom_conditions, condition)) {
      parts.push(manifest.custom_conditions[condition]);
    }
  }
  if (includeGlobsFallback && draft.meta.globs !== undefined) {
    parts.push(`globs: ${formatGlobs(draft.meta.globs)}.`);
  }
  return parts.filter(Boolean).join(' ');
}

function copyDirectoryRecursive(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      ensureDir(path.dirname(destPath));
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyAuxiliaryFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'meta.yaml' || entry.name === 'content.md') continue;
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      ensureDir(path.dirname(destPath));
      fs.copyFileSync(srcPath, destPath);
    }
  }
}




function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}


function cleanManagerOutputs(outputDir) {
  for (const manager of ['antigravity', 'codex', 'claude-code', 'opencode']) {
    const managerDir = path.join(outputDir, manager);
    if (!fs.existsSync(managerDir)) continue;
    if (!fs.lstatSync(managerDir).isDirectory()) {
      throw new Error(`Ожидалась директория результата менеджера: "${managerDir}".`);
    }
    fs.rmSync(managerDir, { recursive: true, force: true });
  }
}

function validateDraftsDir(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Директория черновиков не найдена: "${dir}".`);
  }
  if (!fs.lstatSync(dir).isDirectory()) {
    throw new Error(`Ожидалась директория черновиков: "${dir}".`);
  }
}

function getDrafts(dir) {
  const drafts = [];

  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(currentDir, entry.name);
        const metaPath = path.join(fullPath, 'meta.yaml');
        const contentPath = path.join(fullPath, 'content.md');

        if (fs.existsSync(metaPath) && fs.existsSync(contentPath)) {
          const meta = parseMeta(fs.readFileSync(metaPath, 'utf8'));
          const content = fs.readFileSync(contentPath, 'utf8');
          drafts.push({ name: entry.name, meta, content, path: fullPath });
        } else {
          scan(fullPath);
        }
      }
    }
  }

  scan(dir);
  return drafts;
}

function compile(sourceDir, outputDir) {
  validateDraftsDir(sourceDir);
  const manifest = readManifest(sourceDir);
  const drafts = getDrafts(sourceDir);
  console.log(`[+] Манифест: ${manifest.name}@${manifest.version}`);
  console.log(`[+] Найдено черновиков: ${drafts.length} в "${sourceDir}"`);

  const draftsByName = new Map();
  for (const draft of drafts) {
    if (draftsByName.has(draft.name)) {
      throw new Error(`Повторяющееся имя черновика: "${draft.name}".`);
    }
    draftsByName.set(draft.name, draft);
  }

  for (const draft of drafts) {
    validateDraft(draft, manifest);
    for (const manager of ['antigravity', 'codex', 'claude-code', 'opencode']) {
      compileContent(draft.content, manager, draftsByName, manifest.name);
    }
  }

  cleanManagerOutputs(outputDir);

  if (drafts.length === 0) {
    console.log(`[✓] Модульных черновиков нет; результаты для 4 менеджеров очищены в "${outputDir}".`);
    return;
  }

  for (const draft of drafts) {
    const { name, meta, content } = draft;
    validateDraft(draft, manifest);
    const isExplicit = meta.conditions.includes('explicit_invocation');
    const isImplicit = meta.conditions.includes('implicit_invocation');
    const hasGlobs = meta.globs !== undefined;
    const antigravityContent = compileContent(content, 'antigravity', draftsByName, manifest.name);
    const codexContent = compileContent(content, 'codex', draftsByName, manifest.name);
    const claudeCodeContent = compileContent(content, 'claude-code', draftsByName, manifest.name);
    const openCodeContent = compileContent(content, 'opencode', draftsByName, manifest.name);

    const antigravityDescription = buildDescription(draft, manifest, !isImplicit);
    const fallbackDescription = buildDescription(draft, manifest, true);

    // 1. Antigravity
    if (hasGlobs || isImplicit) {
      const lines = [
        '---',
        `name: "${manifest.name}-${name}"`
      ];
      if (hasGlobs) {
        lines.push('trigger: "glob"');
        lines.push(`globs: ${JSON.stringify(meta.globs)}`);
      } else {
        lines.push(`description: ${JSON.stringify(antigravityDescription)}`);
        lines.push('trigger: "model_decision"');
      }
      lines.push('---', '', antigravityContent);
      writeFile(path.join(outputDir, 'antigravity', 'rules', `${manifest.name}-${name}.md`), lines.join('\n'));
    } else {
      const frontmatter = [
        '---',
        `name: "${manifest.name}:${name}"`,
        `description: ${JSON.stringify(antigravityDescription)}`,
        '---',
        '',
        antigravityContent
      ].join('\n');
      writeFile(path.join(outputDir, 'antigravity', 'skills', name, 'SKILL.md'), frontmatter);
      copyAuxiliaryFiles(draft.path, path.join(outputDir, 'antigravity', 'skills', name));
    }

    // 2. Codex
    {
      const frontmatter = [
        '---',
        `name: "${name}"`,
        `description: ${JSON.stringify(fallbackDescription)}`,
        '---',
        '',
        codexContent
      ].join('\n');
      writeFile(path.join(outputDir, 'codex', 'skills', name, 'SKILL.md'), frontmatter);
      copyAuxiliaryFiles(draft.path, path.join(outputDir, 'codex', 'skills', name));
      if (isExplicit) {
        writeFile(
          path.join(outputDir, 'codex', 'skills', name, 'agents', 'openai.yaml'),
          'policy:\n  allow_implicit_invocation: false\n'
        );
      }
    }

    // 3. Claude Code
    {
      const lines = [
        '---',
        `name: "${name}"`,
        `description: ${JSON.stringify(fallbackDescription)}`
      ];
      if (isExplicit) {
        lines.push('disable-model-invocation: true');
      }
      if (isImplicit) {
        lines.push('user-invocable: false');
      }
      lines.push('---', '', claudeCodeContent);
      writeFile(path.join(outputDir, 'claude-code', 'skills', name, 'SKILL.md'), lines.join('\n'));
      copyAuxiliaryFiles(draft.path, path.join(outputDir, 'claude-code', 'skills', name));
    }

    // 4. OpenCode
    if (isImplicit) {
      const frontmatter = [
        '---',
        `name: "${manifest.name}-${name}"`,
        `description: ${JSON.stringify(fallbackDescription)}`,
        '---',
        '',
        openCodeContent
      ].join('\n');
      writeFile(path.join(outputDir, 'opencode', 'skills', `${manifest.name}-${name}`, 'SKILL.md'), frontmatter);
      copyAuxiliaryFiles(draft.path, path.join(outputDir, 'opencode', 'skills', `${manifest.name}-${name}`));
    } else {
      const frontmatter = [
        '---',
        `name: "${manifest.name}-${name}"`,
        `description: ${JSON.stringify(fallbackDescription)}`,
        '---',
        '',
        openCodeContent
      ].join('\n');
      writeFile(path.join(outputDir, 'opencode', 'commands', `${manifest.name}-${name}.md`), frontmatter);
      copyAuxiliaryFiles(draft.path, path.join(outputDir, 'opencode', 'skills', `${manifest.name}-${name}`));
    }

  }

  // Манифесты
  writeFile(
    path.join(outputDir, 'antigravity', 'plugin.json'),
    JSON.stringify({ name: manifest.name, version: manifest.version, description: manifest.description }, null, 2) + '\n'
  );

  writeFile(
    path.join(outputDir, 'codex', '.codex-plugin', 'plugin.json'),
    JSON.stringify({ name: manifest.name, version: manifest.version, description: manifest.description }, null, 2) + '\n'
  );

  const claudeManifest = { name: manifest.name, version: manifest.version, description: manifest.description, type: 'skills-directory' };
  writeFile(
    path.join(outputDir, 'claude-code', '.claude-plugin', 'plugin.json'),
    JSON.stringify(claudeManifest, null, 2) + '\n'
  );

  console.log(`[✓] Успешно скомпилировано в "${outputDir}" для 4 менеджеров агентов.`);
}

function watchDrafts(sourceDir, outputDir) {
  compile(sourceDir, outputDir);
  console.log(`[👁️] Отслеживание изменений в "${sourceDir}"...`);

  let debounceTimer = null;
  fs.watch(sourceDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`[↻] Изменение обнаружено (${filename}), повторная компиляция...`);
      compile(sourceDir, outputDir);
    }, 200);
  });
}

function resolvePath(arg, defaultPath) {
  if (!arg) return defaultPath;
  if (path.isAbsolute(arg)) return arg;
  const cwdResolved = path.resolve(arg);
  if (fs.existsSync(cwdResolved)) return cwdResolved;
  const rootResolved = path.resolve(__dirname, arg);
  if (fs.existsSync(rootResolved)) return rootResolved;
  if (arg.includes('/') || arg.includes('\\')) {
    return cwdResolved;
  }
  return rootResolved;
}

function main() {
  const args = process.argv.slice(2);
  const isWatch = args.includes('--watch') || args.includes('-w');
  const positionalArgs = args.filter((arg) => arg !== '--watch' && arg !== '-w');

  if (positionalArgs.length < 2) {
    console.error('Ошибка: Обязательно укажите аргументы <draftsDir> и <outputDir>.');
    console.error('Использование: node integrate.js <draftsDir> <outputDir> [--watch]');
    process.exit(1);
  }

  const sourceDir = resolvePath(positionalArgs[0], positionalArgs[0]);
  const outputDir = resolvePath(positionalArgs[1], positionalArgs[1]);

  try {
    if (isWatch) {
      watchDrafts(sourceDir, outputDir);
    } else {
      compile(sourceDir, outputDir);
    }
  } catch (err) {
    console.error(`[!] Ошибка: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}


if (require.main === module) {
  main();
}
