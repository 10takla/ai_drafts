#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

function readManifest(sourceDir) {
  const manifestPath = path.join(sourceDir, 'manifest.yaml');
  const defaults = { name: 'impl-instrs', version: '1.0.0', description: '', managers: {} };
  if (!fs.existsSync(manifestPath)) return defaults;

  const text = fs.readFileSync(manifestPath, 'utf8');
  const result = { ...defaults };
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^(name|version|description):\s*(.*?)\s*$/);
    if (m) result[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return result;
}

const DESCRIPTION_REACTS_TO_INSTRUCTIONS =
  "КРИТИЧЕСКАЯ БЛОКИРОВКА: ВЫ ОБЯЗАНЫ прочитать это перед ЛЮБЫМ взаимодействием (даже при простом исправлении опечаток) с файлами и папками по паттернам: 'ai_instrs/', '*.ai_instrs/', 'ai_instrs.*/', 'ai_instrs.*', '*.ai_instrs.*'. Файл содержит нестандартные правила, которые отменяют ваши базовые знания по умолчанию. Вы провалите задачу, если проигнорируете это.";

const EXPLICIT_DRAFT_REFERENCE_FORMATTERS = {
  antigravity: (name) => `[impl-instrs:${name}](slashCommand;impl-instrs:${name})`,
  codex: (name) => `$impl-instrs:${name}`,
  'claude-code': (name) => `/impl-instrs:${name}`,
  opencode: (name) => `/impl-instrs-${name}`
};

const ANTIGRAVITY_PLUGIN_DIR = process.env.ANTIGRAVITY_PLUGIN_DIR || path.join(
  os.homedir(),
  '.gemini',
  'config',
  'plugins',
  'impl_instrs'
);

const IMPLICIT_DRAFT_REFERENCE_FORMATTERS = {
  antigravity: (name) => {
    const ruleUri = pathToFileURL(
      path.join(ANTIGRAVITY_PLUGIN_DIR, 'rules', `impl-instrs-${name}.md`)
    ).href;
    return `[impl-instrs-${name}.md](*rule;${ruleUri}*)`;
  },
  codex: (name) => `$impl-instrs:${name}`,
  'claude-code': (name) => `/impl-instrs:${name}`,
  opencode: (name) => `/impl-instrs-${name}`
};

function compileContent(content, manager, draftsByName) {
  return content.replace(/@draft\(([a-z0-9]+(?:-[a-z0-9]+)*)\)/g, (_, name) => {
    const draft = draftsByName.get(name);
    if (!draft) {
      throw new Error(`Черновик "${name}" из @draft не найден.`);
    }

    const isExplicit = draft.meta.conditions.includes('explicit_invocation');
    const isImplicit = draft.meta.conditions.includes('implicit_invocation') ||
      Boolean(draft.meta.trigger || draft.meta.globs);
    if (isExplicit && isImplicit) {
      throw new Error(`Черновик "${name}" одновременно явный и неявный.`);
    }

    const formatters = isImplicit
      ? IMPLICIT_DRAFT_REFERENCE_FORMATTERS
      : EXPLICIT_DRAFT_REFERENCE_FORMATTERS;
    return formatters[manager](name);
  });
}

function parseMeta(content) {
  const conditions = [];
  let description = undefined;
  let trigger = undefined;
  let globs = undefined;

  const lines = content.split(/\r?\n/);
  let inConditions = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const descMatch = trimmed.match(/^description:\s*(.*)$/);
    if (descMatch) {
      inConditions = false;
      let val = descMatch[1].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      description = val;
      continue;
    }

    const trigMatch = trimmed.match(/^trigger:\s*(.*)$/);
    if (trigMatch) {
      inConditions = false;
      let val = trigMatch[1].trim().replace(/^['"]|['"]$/g, '');
      trigger = val;
      continue;
    }

    const globsMatch = trimmed.match(/^globs:\s*(.*)$/);
    if (globsMatch) {
      inConditions = false;
      let val = globsMatch[1].trim().replace(/^['"]|['"]$/g, '');
      globs = val;
      continue;
    }

    if (trimmed.startsWith('conditions:')) {
      inConditions = true;
      const inlineMatch = trimmed.match(/conditions:\s*\[(.*?)\]/);
      if (inlineMatch) {
        inlineMatch[1]
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean)
          .forEach((c) => conditions.push(c));
        inConditions = false;
      }
      continue;
    }

    if (inConditions) {
      if (trimmed.startsWith('-')) {
        const cond = trimmed
          .replace(/^-\s*/, '')
          .split('#')[0]
          .trim()
          .replace(/^['"]|['"]$/g, '');
        if (cond) conditions.push(cond);
      } else if (/^[a-zA-Z0-9_]+:/.test(trimmed)) {
        inConditions = false;
      }
    }
  }

  return { conditions, description, trigger, globs };
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

function getDrafts(dir) {
  if (!fs.existsSync(dir)) return [];
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
  const drafts = getDrafts(sourceDir);
  if (drafts.length === 0) {
    console.log(`[!] В директории "${sourceDir}" не найдено модульных черновиков ({name}/meta.yaml + content.md).`);
    return;
  }

  console.log(`[+] Найдено черновиков: ${drafts.length} в "${sourceDir}"`);

  const manifest = readManifest(sourceDir);
  console.log(`[+] Манифест: ${manifest.name}@${manifest.version}`);


  const draftsByName = new Map();
  for (const draft of drafts) {
    if (draftsByName.has(draft.name)) {
      throw new Error(`Повторяющееся имя черновика: "${draft.name}".`);
    }
    draftsByName.set(draft.name, draft);
  }

  let hasExplicit = false;

  for (const draft of drafts) {
    const { name, meta, content } = draft;
    const isExplicit = meta.conditions.includes('explicit_invocation');
    const isImplicit = meta.conditions.includes('implicit_invocation');
    const reacts = meta.conditions.includes('reacts_to_instruction_files');
    const hasCustomTrigger = Boolean(meta.trigger || meta.globs);
    const antigravityContent = compileContent(content, 'antigravity', draftsByName);
    const codexContent = compileContent(content, 'codex', draftsByName);
    const claudeCodeContent = compileContent(content, 'claude-code', draftsByName);
    const openCodeContent = compileContent(content, 'opencode', draftsByName);

    if (isExplicit) hasExplicit = true;

    const description = meta.description !== undefined
      ? meta.description
      : (reacts ? DESCRIPTION_REACTS_TO_INSTRUCTIONS : '');

    // 1. Antigravity
    if (isImplicit || hasCustomTrigger) {
      const lines = ['---'];
      if (!hasCustomTrigger) {
        lines.push(`name: "impl-instrs-${name}"`);
      }
      lines.push(`description: ${JSON.stringify(description)}`);
      lines.push(`trigger: ${JSON.stringify(meta.trigger || 'model_decision')}`);
      if (meta.globs) {
        lines.push(`globs: ${JSON.stringify(meta.globs)}`);
      }
      lines.push('---', '', antigravityContent);
      writeFile(path.join(outputDir, 'antigravity', 'rules', `impl-instrs-${name}.md`), lines.join('\n'));
    } else {
      const frontmatter = [
        '---',
        `name: "impl-instrs:${name}"`,
        `description: ${JSON.stringify(description)}`,
        '---',
        '',
        antigravityContent
      ].join('\n');
      writeFile(path.join(outputDir, 'antigravity', 'skills', name, 'SKILL.md'), frontmatter);
    }

    // 2. Codex
    {
      const frontmatter = [
        '---',
        `name: "${name}"`,
        `description: ${JSON.stringify(description)}`,
        '---',
        '',
        codexContent
      ].join('\n');
      writeFile(path.join(outputDir, 'codex', 'skills', name, 'SKILL.md'), frontmatter);
    }

    // 3. Claude Code
    {
      const lines = [
        '---',
        `name: "${name}"`,
        `description: ${JSON.stringify(description)}`
      ];
      if (isExplicit) {
        lines.push('disable-model-invocation: true');
      }
      if (isImplicit && !hasCustomTrigger) {
        lines.push('user-invocable: false');
      }
      lines.push('---', '', claudeCodeContent);
      writeFile(path.join(outputDir, 'claude-code', 'skills', name, 'SKILL.md'), lines.join('\n'));
    }

    // 4. OpenCode
    if (isImplicit || hasCustomTrigger) {
      const frontmatter = [
        '---',
        `name: "impl-instrs-${name}"`,
        `description: ${JSON.stringify(description)}`,
        '---',
        '',
        openCodeContent
      ].join('\n');
      writeFile(path.join(outputDir, 'opencode', 'skills', `impl-instrs-${name}`, 'SKILL.md'), frontmatter);
    } else {
      const frontmatter = [
        '---',
        `name: "impl-instrs-${name}"`,
        `description: ${JSON.stringify(description)}`,
        '---',
        '',
        openCodeContent
      ].join('\n');
      writeFile(path.join(outputDir, 'opencode', 'commands', `impl-instrs-${name}.md`), frontmatter);
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

  if (hasExplicit) {
    writeFile(
      path.join(outputDir, 'codex', 'agents', 'openai.yaml'),
      'policy:\n  allow_implicit_invocation: false\n'
    );
  }

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

  if (isWatch) {
    watchDrafts(sourceDir, outputDir);
  } else {
    compile(sourceDir, outputDir);
  }
}

if (require.main === module) {
  main();
}

