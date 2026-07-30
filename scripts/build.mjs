#!/usr/bin/env node
/**
 * Content build: harvest exercise/study files -> public/content.json
 *
 * Sources live outside this folder (interviews/ and ../airflow/). Nothing is
 * mutated at the source: this only reads and emits a single JSON bundle.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = resolve(HERE, '..');                    // Workspace/prep-web
const WORKSPACE = resolve(APP, '..');               // Workspace
const INTERVIEWS = resolve(WORKSPACE, 'interviews');
const AIRFLOW = resolve(WORKSPACE, 'airflow');
const LOCAL = resolve(APP, 'content');              // decks authored inside this repo
const OUT = resolve(APP, 'public', 'content.json');

// ------------------------------------------------------------------
// Source manifest
// ------------------------------------------------------------------
const S = (file, parser, deck) => ({ file, parser, deck });

const SOURCES = [
  // --- SQL ---
  S(`${INTERVIEWS}/exercises/01_sql_exercises.sql`, 'blocks',
    { id: 'sql-core', title: 'SQL — Core Interview Set', tags: ['sql'], lang: 'sql' }),
  S(`${INTERVIEWS}/exercises/06_sql_window_exercises.sql`, 'blocks',
    { id: 'sql-window', title: 'SQL — Window Functions', tags: ['sql', 'window'], lang: 'sql' }),
  S(`${INTERVIEWS}/exercises/07_snowflake_exercises.sql`, 'blocks',
    { id: 'snowflake', title: 'Snowflake', tags: ['sql', 'snowflake'], lang: 'sql' }),
  S(`${INTERVIEWS}/exercises/08_postgresql_nubank_prep.sql`, 'blocks',
    { id: 'pg-nubank', title: 'PostgreSQL — Nubank Prep', tags: ['sql', 'postgres', 'nubank'], lang: 'sql' }),
  S(`${INTERVIEWS}/exercises/10_postgresql_nubank_advanced.sql`, 'blocks',
    { id: 'pg-advanced', title: 'PostgreSQL — Advanced Patterns', tags: ['sql', 'postgres', 'nubank'], lang: 'sql' }),
  S(`${INTERVIEWS}/exercises/12_bairesdev_sql_challenge.sql`, 'blocks',
    { id: 'sql-challenge', title: 'SQL — Rapid Challenge (Q1–Q12)', tags: ['sql', 'drill'], lang: 'sql' }),
  S(`${INTERVIEWS}/exercises/posrgresql_nubank_supp.sql`, 'blocks',
    { id: 'pg-supp', title: 'PostgreSQL — Supplement', tags: ['sql', 'postgres'], lang: 'sql' }),

  // --- Python / PySpark ---
  S(`${INTERVIEWS}/exercises/05_python_exercises.py`, 'blocks',
    { id: 'py-core', title: 'Python — Pure Python Drills', tags: ['python'], lang: 'python' }),
  S(`${INTERVIEWS}/exercises/09_python_advanced_nubank.py`, 'blocks',
    { id: 'py-advanced', title: 'Python — Advanced (Nubank)', tags: ['python', 'nubank'], lang: 'python' }),
  S(`${INTERVIEWS}/exercises/11_bcgx_codesignal_prep.py`, 'blocks',
    { id: 'py-codesignal', title: 'Python — CodeSignal Style (BCGX)', tags: ['python', 'pandas'], lang: 'python' }),
  S(`${INTERVIEWS}/exercises/02_pyspark_exercises.py`, 'blocks',
    { id: 'pyspark', title: 'PySpark — Transformations', tags: ['pyspark', 'spark'], lang: 'python' }),
  S(`${INTERVIEWS}/exercises/15_nix_bigdata_prep.py`, 'blocks',
    { id: 'bigdata', title: 'Big Data — Spark Deep Dive (Nix)', tags: ['pyspark', 'spark'], lang: 'python' }),
  S(`${INTERVIEWS}/exercises/14_bairesdev_etl_challenge.py`, 'blocks',
    { id: 'etl-challenge', title: 'ETL Challenge — End to End', tags: ['python', 'etl'], lang: 'python' }),

  // --- Airflow ---
  S(`${INTERVIEWS}/exercises/08_airflow_drills.py`, 'blocks',
    { id: 'airflow-drills', title: 'Airflow — Timed Drills', tags: ['airflow', 'drill'], lang: 'python' }),
  S(`${INTERVIEWS}/exercises/05_THE_ONE_DAG.py`, 'file',
    { id: 'the-one-dag', title: 'Airflow — THE ONE DAG (reference)', tags: ['airflow', 'reference'], lang: 'python' }),
  S(`${INTERVIEWS}/exercises/03_production_dag_example.py`, 'file',
    { id: 'dag-production', title: 'Airflow — Production DAG Example', tags: ['airflow', 'reference'], lang: 'python' }),
  S(`${INTERVIEWS}/exercises/04_dag_metas_improved.py`, 'file',
    { id: 'dag-metas', title: 'Airflow — Metas DAG (improved)', tags: ['airflow', 'reference'], lang: 'python' }),
  S(`${INTERVIEWS}/exercises/06_ALL_ARGUMENTS_REFERENCE.txt`, 'blocks',
    { id: 'airflow-args', title: 'Airflow — All Arguments Reference', tags: ['airflow', 'reference'], lang: 'python' }),

  // --- Airflow curriculum (../airflow) ---
  ...[
    ['01_imports.py', 'Imports'],
    ['02_default_args.py', 'default_args'],
    ['03_dag_decorator.py', '@dag decorator'],
    ['04_task_decorator.py', '@task + XCom'],
    ['05_s3_sensor.py', 'S3KeySensor'],
    ['06_external_task_sensor.py', 'ExternalTaskSensor'],
    ['07_s3_hook.py', 'S3Hook'],
    ['08_postgres_hook.py', 'PostgresHook'],
    ['09_snowflake_hook.py', 'SnowflakeHook'],
    ['10_subprocess_spark.py', 'subprocess + spark-submit'],
    ['11_validate_source.py', 'Validate source'],
    ['12_quality_check.py', 'Quality check'],
    ['13_email_notifications.py', 'Email notifications'],
    ['14_wiring_patterns.py', 'Wiring patterns'],
    ['15_trigger_rules.py', 'TriggerRule'],
    ['16_schedule_examples.py', 'Cron schedules'],
    ['17_variable_get.py', 'Variable.get()'],
    ['18_full_dag_template.py', 'Full DAG template'],
  ].map(([f, t]) => S(`${AIRFLOW}/${f}`, 'lesson',
    { id: 'airflow-lessons', title: 'Airflow — Lessons 01–18', tags: ['airflow', 'lesson'], lang: 'python', cardTitle: t })),
  S(`${AIRFLOW}/snippets/dag_factory.py`, 'file',
    { id: 'airflow-lessons', title: 'Airflow — Lessons 01–18', tags: ['airflow', 'lesson'], lang: 'python', cardTitle: 'DAG factory (config-driven)' }),
  S(`${AIRFLOW}/snippets/dag_factory_config.yaml`, 'file',
    { id: 'airflow-lessons', title: 'Airflow — Lessons 01–18', tags: ['airflow', 'lesson'], lang: 'yaml', cardTitle: 'DAG factory YAML config' }),

  // --- Concept / theory ---
  S(`${AIRFLOW}/databricks_study_guide.md`, 'mdqa',
    { id: 'databricks', title: 'Databricks — Certification Q&A', tags: ['databricks', 'quiz'] }),
  S(`${INTERVIEWS}/exercises/13_bairesdev_proficiency_quiz.md`, 'mcq',
    { id: 'etl-quiz', title: 'ETL / DE Concepts — Multiple Choice', tags: ['concepts', 'quiz'] }),
  S(`${INTERVIEWS}/nubank_gaps/01_spark_tuning.md`, 'mdsections',
    { id: 'gap-spark', title: 'Gap — Spark Tuning', tags: ['concepts', 'spark'] }),
  S(`${INTERVIEWS}/nubank_gaps/02_dw_vs_lake.md`, 'mdsections',
    { id: 'gap-dw', title: 'Gap — DW vs Lake vs Lakehouse', tags: ['concepts', 'architecture'] }),
  S(`${INTERVIEWS}/nubank_gaps/03_governance.md`, 'mdsections',
    { id: 'gap-gov', title: 'Gap — Governance', tags: ['concepts', 'governance'] }),
  S(`${INTERVIEWS}/nubank_gaps/04_partitioning.md`, 'mdsections',
    { id: 'gap-part', title: 'Gap — Partitioning', tags: ['concepts', 'architecture'] }),
  S(`${INTERVIEWS}/nubank_gaps/05_tradeoff_framework.md`, 'mdsections',
    { id: 'gap-tradeoff', title: 'Gap — Trade-off Framework', tags: ['concepts', 'framework'] }),

  // --- Authored in this repo (content/) ---
  S(`${LOCAL}/airflow_quiz.md`, 'mcq',
    { id: 'airflow-quiz', title: 'Airflow — Concept Quiz', tags: ['airflow', 'quiz'] }),
  S(`${LOCAL}/airflow_concepts.md`, 'mdsections',
    { id: 'airflow-concepts', title: 'Airflow — Concepts & Recall', tags: ['airflow', 'concepts'] }),
  S(`${LOCAL}/python_stdlib_quiz.md`, 'mcq',
    { id: 'py-stdlib-quiz', title: 'Python — Stdlib Quiz (hackathon)', tags: ['python', 'quiz'] }),
  S(`${LOCAL}/python_stdlib_recall.md`, 'mdsections',
    { id: 'py-stdlib', title: 'Python — Stdlib Cheatsheet', tags: ['python', 'concepts'] }),
  S(`${LOCAL}/python_hackathon_drills.md`, 'mdcards',
    { id: 'py-hackathon', title: 'Python — Hackathon Drills', tags: ['python', 'drill'], lang: 'python' }),
  S(`${LOCAL}/python_types_methods.md`, 'mdsections',
    { id: 'py-types', title: 'Python — Types, Methods & Built-ins', tags: ['python', 'concepts'] }),
  S(`${LOCAL}/python_types_quiz.md`, 'mcq',
    { id: 'py-types-quiz', title: 'Python — Types & Methods Quiz', tags: ['python', 'quiz'] }),
  S(`${LOCAL}/regex_core.md`, 'mdsections',
    { id: 'regex', title: 'Regex & String Manipulation — Core', tags: ['python', 'regex', 'concepts'] }),
  S(`${LOCAL}/regex_quiz.md`, 'mcq',
    { id: 'regex-quiz', title: 'Regex, os & csv Quiz', tags: ['python', 'regex', 'quiz'] }),
  S(`${LOCAL}/python_files_regex_drills.md`, 'mdcards',
    { id: 'files-regex', title: 'Python — Files, CSV & Regex Drills', tags: ['python', 'regex', 'drills'] }),
  S(`${LOCAL}/algorithms_core.md`, 'mdsections',
    { id: 'algos', title: 'Algorithms — Core Patterns', tags: ['algorithms', 'python', 'concepts'] }),
  S(`${LOCAL}/algorithms_quiz.md`, 'mcq',
    { id: 'algos-quiz', title: 'Algorithms & Complexity Quiz', tags: ['algorithms', 'quiz'] }),
  S(`${LOCAL}/nix_deep_quiz.md`, 'mcq',
    { id: 'nix-quiz', title: 'Nix — Deep Quiz (Spark/DE)', tags: ['pyspark', 'spark', 'quiz', 'nix'] }),
  S(`${LOCAL}/nix_deep_concepts.md`, 'mdsections',
    { id: 'nix-concepts', title: 'Nix — Deep Concepts', tags: ['pyspark', 'spark', 'concepts', 'nix'] }),
  S(`${INTERVIEWS}/07_nix_round3_health_insurance.md`, 'mdsections',
    { id: 'nix-health', title: 'Nix R3 — US Health Insurance & Live Data', tags: ['nix', 'domain', 'concepts'] }),
  S(`${LOCAL}/health_insurance_quiz.md`, 'mcq',
    { id: 'health-quiz', title: 'Health Insurance Data & Live Data Quiz', tags: ['nix', 'domain', 'quiz'] }),

  // --- Caylent (AWS Senior DE) ---
  S(`${INTERVIEWS}/caylent_study_guide.md`, 'mdsections',
    { id: 'caylent', title: 'Caylent — AWS Study Guide', tags: ['aws', 'caylent', 'concepts'],
      skip: /^(Table of Contents|Study Resources|Priority Study Order|Interview Q&A Bank)/i }),
  S(`${INTERVIEWS}/caylent_study_guide.md`, 'mdqbank',
    { id: 'caylent-qa', title: 'Caylent — Interview Q&A Bank', tags: ['aws', 'caylent', 'behavioural'] }),
  S(`${LOCAL}/aws_caylent_quiz.md`, 'mcq',
    { id: 'aws-quiz', title: 'AWS Data Services Quiz', tags: ['aws', 'quiz', 'caylent'] }),
  S(`${LOCAL}/aws_migration_deep.md`, 'mdsections',
    { id: 'aws-migration', title: 'AWS — Migration, HA/DR & Cost Deep Dive', tags: ['aws', 'caylent', 'concepts'] }),

  // --- Behavioural / company ---
  S(`${INTERVIEWS}/english_tips.md`, 'mdsections',
    { id: 'english', title: 'English — Interview Phrasing', tags: ['english', 'behavioural'] }),
  S(`${INTERVIEWS}/exercises/caogemini.md`, 'mdsections',
    { id: 'behavioural', title: 'Behavioural — STAR Answers', tags: ['behavioural'] }),
];

/**
 * Tracks = curated study paths. `deep: true` orders the session hardest-first
 * and pulls more new cards per sitting.
 */
const TRACKS = [
  {
    id: 'nix-round3',
    title: 'Nix Round 3 — health insurance + live data',
    blurb: '90-min round: 837/835/834 claims domain, PHI, Avro + schema registry, streaming, then Spark.',
    deep: true,
    decks: ['health-quiz', 'nix-health', 'nix-quiz', 'nix-concepts', 'gap-part', 'english'],
  },
  {
    id: 'nix',
    title: 'Nix — Senior DE deep dive',
    blurb: 'Spark internals, tuning, skew, formats, partitioning. Hardest cards first.',
    deep: true,
    decks: ['nix-quiz', 'nix-concepts', 'bigdata', 'pyspark', 'gap-spark', 'gap-part', 'gap-dw'],
  },
  {
    id: 'caylent',
    title: 'Caylent — AWS Senior DE',
    blurb: 'Weekend order: DMS/SCT/CDC, Kinesis, RDS HA/DR, Python OOP + pytest, IaC, cost, security.',
    deep: true,
    decks: ['aws-quiz', 'aws-migration', 'caylent-qa', 'caylent', 'gap-part', 'gap-gov'],
  },
  {
    id: 'python-tests',
    title: 'Python coding tests',
    blurb: 'Types, methods, stdlib packages, CodeSignal/hackathon patterns, drills.',
    decks: ['py-types-quiz', 'py-types', 'py-stdlib-quiz', 'py-stdlib', 'regex-quiz', 'files-regex', 'py-hackathon', 'py-core', 'py-advanced', 'py-codesignal'],
  },
  {
    id: 'regex-files',
    title: 'Regex, strings & files',
    blurb: 'Coursera chapter: re, greedy vs lazy, groups, sub, os.path, csv reader vs DictReader.',
    decks: ['regex-quiz', 'regex', 'files-regex'],
  },
  {
    id: 'python-api',
    title: 'Python API — types & methods',
    blurb: 'dict / list / str / set / tuple operations, methods, built-in functions, traps.',
    decks: ['py-types-quiz', 'py-types', 'py-stdlib', 'py-stdlib-quiz'],
  },
  {
    id: 'algorithms',
    title: 'Algorithms & complexity',
    blurb: 'Pattern recognition, Big-O, search, windows, heaps, graphs, DP. Hardest first.',
    deep: true,
    decks: ['algos-quiz', 'algos', 'py-hackathon', 'py-codesignal'],
  },
  {
    id: 'sql',
    title: 'SQL interview',
    blurb: 'Windows, dedup, funnels, gaps-and-islands, Snowflake, Postgres.',
    decks: ['sql-core', 'sql-window', 'sql-challenge', 'pg-nubank', 'pg-advanced', 'snowflake', 'pg-supp'],
  },
  {
    id: 'airflow',
    title: 'Airflow end to end',
    blurb: 'Lessons 01–18, concept quiz, timed drills, production templates.',
    decks: ['airflow-quiz', 'airflow-concepts', 'airflow-lessons', 'airflow-drills', 'the-one-dag', 'dag-production', 'airflow-args'],
  },
  {
    id: 'theory',
    title: 'DE theory & architecture',
    blurb: 'Modelling, governance, lakehouse, Databricks cert, trade-off framing.',
    decks: ['etl-quiz', 'databricks', 'gap-dw', 'gap-gov', 'gap-tradeoff', 'gap-part'],
  },
  {
    id: 'interview-day',
    title: 'Interview day — 15 min',
    blurb: 'Fast mixed refresher: quizzes, gaps, English and STAR answers.',
    decks: ['etl-quiz', 'airflow-quiz', 'nix-quiz', 'py-stdlib-quiz', 'algos-quiz', 'gap-tradeoff', 'english', 'behavioural'],
  },
];

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

/** "Difficulty: 7/10" | "Difficulty: ***" -> 1..5 */
function parseDifficulty(text) {
  const stars = text.match(/Difficulty:\s*(⭐+)/);
  if (stars) return Math.min(5, stars[1].length);
  const outOf = text.match(/Difficulty:\s*(\d+)\s*\/\s*10/);
  if (outOf) return Math.max(1, Math.min(5, Math.round(Number(outOf[1]) / 2)));
  return 3;
}

const isSeparator = (l) => /^[\s\-#=*_]*$/.test(l) || /^(--|#)\s*[=\-*]{4,}\s*$/.test(l);

/** FNV-1a — stable across runs, so a card's option order never changes. */
function hash32(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * Deterministic Fisher-Yates. Quiz sources are written with the correct answer
 * in whatever slot was convenient; shuffling removes the positional tell without
 * touching the source files.
 */
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = hash32(seed) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stripComment(line, prefix) {
  const re = prefix === '--' ? /^\s*--\s?/ : /^\s*#\s?/;
  return line.replace(re, '');
}

const isComment = (line, prefix) =>
  prefix === '--' ? /^\s*--/.test(line) : /^\s*#/.test(line);

// ------------------------------------------------------------------
// Parsers — each returns an array of cards
// ------------------------------------------------------------------

/**
 * Comment-delimited exercise blocks:
 *   -- EXERCISE 3: Dedup      |  # LEVEL 2: Task Logic
 *   -- Difficulty: 7/10       |  # SECTION 1: Cleaning
 * Prompt = the leading comment prose. Answer = everything after it
 * (attempt + SOLUTION block), kept verbatim as code.
 */
function parseBlocks(text, deck) {
  const prefix = deck.lang === 'sql' ? '--' : '#';
  const lines = text.split(/\r?\n/);
  const head = new RegExp(
    `^\\s*${prefix === '--' ? '--' : '#'}\\s*(?:={3,}\\s*)?` +
    `(EXERCISE|SECTION|LEVEL|DRILL|CHALLENGE|PART|Q)\\s*(\\d+)\\s*[:.\\-]?\\s*(.*)$`, 'i');

  const blocks = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(head);
    if (m && m[3].trim().length > 1) {
      cur = { kind: m[1].toUpperCase(), n: Number(m[2]), title: m[3].trim().replace(/[=\-]+$/, '').trim(), body: [] };
      blocks.push(cur);
    } else if (cur) {
      cur.body.push(line);
    }
  }

  return blocks.map((b) => {
    const promptLines = [];
    const answerLines = [];
    let inAnswer = false;

    for (const raw of b.body) {
      if (!inAnswer) {
        if (/^\s*(--|#)\s*(SOLUTION|ANSWER|YOUR ANSWER|YOUR CODE|REFERENCE)/i.test(raw)) { inAnswer = true; continue; }
        if (isComment(raw, prefix)) {
          const t = stripComment(raw, prefix);
          if (!/^[=\-*]{4,}\s*$/.test(t) && !/^Difficulty:/i.test(t) && !/^Time( limit| target)?:/i.test(t)) {
            promptLines.push(t);
          }
          continue;
        }
        if (raw.trim() === '') { promptLines.push(''); continue; }
        inAnswer = true;                  // first real code line ends the prompt
      }
      answerLines.push(raw);
    }

    let prompt = promptLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    const answer = answerLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    const bodyText = b.body.join('\n');

    // Python drills often state the task inside a print("""...""") block rather
    // than in comments — pull it up so the card has a real question.
    if (prompt.length < 80) {
      const q = answer.match(/"""([\s\S]*?)"""/);
      if (q && q[1].trim().length > 40) {
        prompt = [prompt, q[1].trim()].filter(Boolean).join('\n\n');
      }
    }

    // Some blocks are verbal Q&A written as "Q: ... A: ..." in comments.
    // Keep the questions on the front, push the answers behind the reveal.
    let front = prompt, back = answer;
    if (/^\s*Q:/m.test(prompt) && /\bA:/.test(prompt)) {
      const qs = [], as = [];
      for (const seg of prompt.split(/\n(?=\s*Q:)/)) {
        const cut = seg.search(/\bA:/);
        if (cut === -1) { qs.push(seg.trim()); continue; }
        qs.push(seg.slice(0, cut).trim());
        as.push(seg.slice(0, cut).trim().replace(/^Q:\s*/, '') + '\n' + seg.slice(cut).trim());
      }
      front = qs.filter(Boolean).join('\n\n');
      back = as.join('\n\n') + (answer ? `\n\n\`\`\`${deck.lang}\n${answer}\n\`\`\`` : '');
    }

    return {
      type: back ? (front === prompt ? 'code' : 'concept') : 'read',
      title: `${b.kind === 'Q' ? 'Q' : b.kind.charAt(0) + b.kind.slice(1).toLowerCase()} ${b.n} — ${b.title}`,
      difficulty: parseDifficulty(bodyText),
      prompt: front || b.title,
      answer: back,
      lang: deck.lang,
    };
  }).filter((c) => c.prompt || c.answer);
}

/** Whole file as one reference card. */
function parseFile(text, deck, file) {
  return [{
    type: 'read',
    title: deck.cardTitle || deck.title,
    difficulty: 3,
    prompt: `Reference — ${deck.cardTitle || deck.title}`,
    answer: text.trim(),
    lang: deck.lang,
  }];
}

/**
 * Airflow lesson file: `# === S3 KEY SENSOR ===` banner + narration comment,
 * then the snippet. Prompt = "write this from memory" cue, answer = full file.
 */
function parseLesson(text, deck) {
  const lines = text.split(/\r?\n/);
  const banner = lines.find((l) => /^#\s*={2,}.*={2,}\s*$/.test(l));
  const title = deck.cardTitle
    || (banner ? banner.replace(/^#\s*=+\s*/, '').replace(/\s*=+\s*$/, '') : deck.title);

  // Narration = the comment lines right after the banner.
  const idx = banner ? lines.indexOf(banner) : -1;
  const narration = [];
  for (let i = idx + 1; i < lines.length && /^\s*#/.test(lines[i]); i++) {
    narration.push(lines[i].replace(/^\s*#\s?/, ''));
  }

  return [{
    type: 'code',
    title,
    difficulty: 2,
    prompt: `**${title}** — write it from memory.\n\n${narration.join('\n').trim()}`,
    answer: text.trim(),
    lang: deck.lang,
  }];
}

/**
 * Databricks guide: `### Q4 ✅ Title` then `**Q:** ...` and answer prose.
 * ❌ = previously answered wrong -> starts harder so it surfaces sooner.
 */
function parseMdQA(text, deck) {
  const chunks = text.split(/\n(?=###\s)/);
  const cards = [];
  for (const chunk of chunks) {
    const m = chunk.match(/^###\s*(.+)/);
    if (!m) continue;
    const heading = m[1].trim();
    const body = chunk.slice(chunk.indexOf('\n') + 1).replace(/\n---\s*$/, '').trim();
    if (!body) continue;

    const wrong = /❌/.test(heading);
    const qm = body.match(/\*\*Q:\*\*\s*([\s\S]*?)(?=\n\s*\n|\n\*\*)/);
    const question = qm ? qm[1].trim() : heading.replace(/[✅❌]/g, '').trim();
    const answer = qm ? body.slice(body.indexOf(qm[0]) + qm[0].length).trim() : body;

    cards.push({
      type: 'concept',
      title: heading.replace(/[✅❌]/g, '').replace(/\s{2,}/g, ' ').trim(),
      difficulty: wrong ? 5 : 2,
      flagged: wrong,
      prompt: question,
      answer,
      lang: 'md',
    });
  }
  return cards;
}

/** Multiple-choice quiz + trailing answer key + rationales. */
function parseMCQ(text, deck) {
  const keyBlock = text.match(/##\s*Answer key\s*\n+([\s\S]*?)(?=\n###|\n##|$)/i);
  const key = {};
  if (keyBlock) {
    for (const m of keyBlock[1].matchAll(/(\d+)\s*-\s*([A-D])/g)) key[m[1]] = m[2];
  }
  const rationales = {};
  const ratBlock = text.match(/###\s*One-line rationales[^\n]*\n([\s\S]*)$/i);
  if (ratBlock) {
    for (const m of ratBlock[1].matchAll(/^(\d+)\.\s*([\s\S]*?)(?=\n\d+\.\s|\n*$)/gm)) {
      rationales[m[1]] = m[2].trim();
    }
  }

  const qSection = text.split(/##\s*Answer key/i)[0];
  const cards = [];
  const parts = qSection.split(/\n(?=\*\*\d+\.\*\*)/);
  for (const part of parts) {
    const m = part.match(/^\*\*(\d+)\.\*\*\s*([\s\S]*)$/);
    if (!m) continue;
    const n = m[1];
    const rest = m[2];
    const firstOpt = rest.search(/\n\s*-\s*A\)/);
    if (firstOpt === -1) continue;

    const question = rest.slice(0, firstOpt).trim();
    const optText = rest.slice(firstOpt);
    const options = [];
    const re = /([A-D])\)\s*([\s\S]*?)(?=\s{2,}[A-D]\)|\n\s*-\s*[A-D]\)|$)/g;
    for (const om of optText.matchAll(re)) {
      const text = om[2]
        .replace(/\s*\n\s*/g, ' ')
        .replace(/^-\s*/, '')
        .replace(/\s*(-{3,}|#{2,}.*)\s*$/, '')   // trailing markdown rule / next heading
        .trim();
      options.push({ key: om[1], text });
    }
    if (options.length < 2 || !key[n]) continue;

    // Re-label after shuffling so the answer key position carries no information.
    const correctText = options.find((o) => o.key === key[n])?.text;
    const shuffled = seededShuffle(options, `${deck.id}:${n}:${question}`)
      .map((o, i) => ({ key: 'ABCD'[i], text: o.text }));
    const correct = shuffled.find((o) => o.text === correctText)?.key || key[n];

    cards.push({
      type: 'mcq',
      title: `Q${n}`,
      difficulty: 2,
      prompt: question,
      options: shuffled,
      correct,
      answer: rationales[n] ? rationales[n] : '',
      lang: 'md',
    });
  }
  return cards;
}

/**
 * Markdown split on `## ` headings -> one concept card per section.
 * Sections too long to study on a phone are split again on `### `.
 */
function parseMdSections(text, deck) {
  const MAX = 1800;
  const cards = [];

  const push = (title, body) => {
    if (body.length < 40) return;
    cards.push({ type: 'concept', title, difficulty: 3, prompt: title, answer: body, lang: 'md' });
  };

  for (const chunk of text.split(/\n(?=##\s)/)) {
    const m = chunk.match(/^##\s*(.+)/);
    if (!m) continue;
    const title = m[1].trim().replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '');
    // Navigation / link sections carry nothing to study.
    if (deck.skip && deck.skip.test(title)) continue;
    const body = chunk.slice(chunk.indexOf('\n') + 1).trim();

    if (body.length <= MAX || !/^###\s/m.test(body)) { push(title, body); continue; }

    const parts = body.split(/\n(?=###\s)/);
    // A section can open straight into `###` — then there is no intro, only subsections.
    const intro = /^###\s/.test(parts[0]) ? '' : parts.shift();
    const subs = parts;
    if (intro.trim().length > 200) push(title, intro.trim());
    for (const sub of subs) {
      const sm = sub.match(/^###\s*(.+)/);
      if (!sm) continue;
      push(`${title} — ${sm[1].trim()}`, sub.slice(sub.indexOf('\n') + 1).trim());
    }
  }
  if (!cards.length) {
    cards.push({ type: 'read', title: deck.title, difficulty: 3, prompt: deck.title, answer: text.trim(), lang: 'md' });
  }
  return cards;
}

/**
 * Drill cards: `## Task title` + task text, then `### Solution` (or `**Answer:**`)
 * splits front from back. Optional `<!-- difficulty: 4 -->` per section.
 */
function parseMdCards(text, deck) {
  const cards = [];
  for (const chunk of text.split(/\n(?=##\s)/)) {
    const m = chunk.match(/^##\s*(.+)/);
    if (!m) continue;
    const title = m[1].trim();
    const body = chunk.slice(chunk.indexOf('\n') + 1).trim();
    if (!body) continue;

    const cut = body.search(/^(###\s*Solution|\*\*Answer:?\*\*)/im);
    const front = cut === -1 ? title : body.slice(0, cut).trim();
    const back = cut === -1 ? body : body.slice(cut).replace(/^###\s*Solution\s*/i, '').trim();
    const diff = body.match(/<!--\s*difficulty:\s*(\d)\s*-->/);

    cards.push({
      type: 'concept',
      title,
      difficulty: diff ? Number(diff[1]) : 3,
      prompt: front.replace(/<!--[\s\S]*?-->/g, '').trim(),
      answer: back.replace(/<!--[\s\S]*?-->/g, '').trim(),
      lang: deck.lang || 'md',
    });
  }
  return cards;
}

/**
 * Q&A bank: `**Q: question**` followed by `A: "answer"`. Question on the front,
 * answer behind the reveal — the point is rehearsing the answer out loud.
 */
function parseMdQBank(text, deck) {
  const cards = [];
  const re = /^\*\*Q:\s*([\s\S]*?)\*\*\s*\n+A:\s*([\s\S]*?)(?=\n\*\*Q:|\n#{2,3}\s|\n---\s*$|$)/gm;
  for (const m of text.matchAll(re)) {
    const question = m[1].replace(/\s+/g, ' ').trim();
    const answer = m[2].trim().replace(/^"|"$/g, '').trim();
    if (!question || answer.length < 40) continue;
    cards.push({
      type: 'concept',
      title: question.replace(/\?$/, '').slice(0, 70),
      difficulty: 4,          // spoken answers need more reps than facts
      prompt: question,
      answer,
      lang: 'md',
    });
  }
  return cards;
}

const PARSERS = {
  blocks: parseBlocks,
  mdcards: parseMdCards,
  mdqbank: parseMdQBank,
  file: parseFile,
  lesson: parseLesson,
  mdqa: parseMdQA,
  mcq: parseMCQ,
  mdsections: parseMdSections,
};

// ------------------------------------------------------------------
// Build
// ------------------------------------------------------------------
const decks = new Map();
const missing = [];

for (const src of SOURCES) {
  if (!existsSync(src.file)) { missing.push(src.file); continue; }
  const text = readFileSync(src.file, 'utf8');
  const parse = PARSERS[src.parser];
  let cards = [];
  try {
    cards = parse(text, src.deck, src.file) || [];
  } catch (err) {
    console.error(`  ! parse failed: ${src.file}\n    ${err.message}`);
    continue;
  }
  // No structured blocks found — keep the file as a readable reference card.
  if (!cards.length) cards = parseFile(text, src.deck, src.file);

  if (!decks.has(src.deck.id)) {
    decks.set(src.deck.id, {
      id: src.deck.id,
      title: src.deck.title,
      tags: src.deck.tags,
      sources: [],
      cards: [],
    });
  }
  const deck = decks.get(src.deck.id);
  const rel = relative(WORKSPACE, src.file).replace(/\\/g, '/');
  deck.sources.push(rel);

  cards.forEach((c, i) => {
    deck.cards.push({
      id: `${deck.id}:${slug(c.title) || 'card'}:${deck.cards.length}`,
      source: rel,
      ...c,
    });
  });
}

const built = [...decks.values()].filter((d) => d.cards.length);
const known = new Set(built.map((d) => d.id));
const badRefs = TRACKS.flatMap((t) => t.decks.filter((id) => !known.has(id)).map((id) => `${t.id} -> ${id}`));

const bundle = {
  generatedAt: new Date().toISOString(),
  decks: built,
  tracks: TRACKS.map((t) => ({ ...t, decks: t.decks.filter((id) => known.has(id)) })).filter((t) => t.decks.length),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(bundle), 'utf8');

const total = bundle.decks.reduce((n, d) => n + d.cards.length, 0);
const byType = {};
for (const d of bundle.decks) for (const c of d.cards) byType[c.type] = (byType[c.type] || 0) + 1;

console.log(`\nBuilt ${bundle.decks.length} decks / ${total} cards -> ${relative(APP, OUT)}`);
for (const d of bundle.decks) console.log(`  ${String(d.cards.length).padStart(4)}  ${d.id.padEnd(18)} ${d.title}`);
console.log(`\n  types: ${Object.entries(byType).map(([k, v]) => `${k}=${v}`).join('  ')}`);
console.log(`  tracks: ${bundle.tracks.map((t) => `${t.id}(${t.decks.reduce((n, id) => n + built.find((d) => d.id === id).cards.length, 0)})`).join('  ')}`);
if (badRefs.length) console.log(`  ! track references unknown decks: ${badRefs.join(', ')}`);
if (missing.length) console.log(`\n  missing sources (skipped):\n${missing.map((f) => '   - ' + f).join('\n')}`);
