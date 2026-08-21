#!/usr/bin/env node
// remove-emojis.js - strips emoji chars from all JSX files in src/
const fs = require('fs');
const path = require('path');

const DIRS = ['src/pages', 'src/components'];

// Explicit string replacements (emoji → icon text)
const REPLACEMENTS = [
  // Food instructions
  [/🍽️\s*After Food/g,    'After Food'],
  [/⏰\s*Before Food/g,   'Before Food'],
  [/🥛\s*With Food/g,     'With Food'],
  [/💧\s*Empty Stomach/g, 'Empty Stomach'],
  // Tab labels
  [/💊\s*Basic Info/g,       'Basic Info'],
  [/🗓️\s*Schedule\s*&\s*Timing/g, 'Schedule & Timing'],
  [/📋\s*Clinical Notes/g,   'Clinical Notes'],
  [/📋\s*Regimen Timeline/g, 'Regimen Timeline'],
  // Quick note chips
  [/💧\s*Take with full glass of water/g, 'Take with full glass of water'],
  [/🌙\s*Best taken at bedtime/g, 'Best taken at bedtime'],
  [/☀️\s*Morning dose/g,   'Morning dose'],
  [/🚫\s*Avoid alcohol/g,  'Avoid alcohol'],
  [/🍋\s*Avoid grapefruit/g,'Avoid grapefruit'],
  [/💊\s*Do not crush\/chew/g,'Do not crush/chew'],
  [/🏃\s*Take before exercise/g,'Take before exercise'],
  [/🧪\s*Monitor blood levels/g,'Monitor blood levels'],
  // Date / reminder
  [/📅\s*Refill due:/g,    'Refill due:'],
  [/📅\s*Follow-Up Notice/g,'Follow-Up Notice'],
  [/✅\s*Enabled/g,        'Enabled'],
  [/❌\s*Disabled/g,       'Disabled'],
  // Buttons
  [/'💾 Save Changes'/g,   "'Save Changes'"],
  [/'💾 Save'/g,           "'Save'"],
  [/←\s*Back/g,            'Back'],
  [/Next\s*→/g,            'Next'],
  // Directive categories
  [/💊\s*Regimen Advice/g,  'Regimen Advice'],
  [/🥗\s*Dietary Instruction/g,'Dietary Instruction'],
  [/🏃\s*Lifestyle Order/g, 'Lifestyle Order'],
  [/📊\s*Monitoring Instruction/g,'Monitoring Instruction'],
  // Priority
  [/🔴\s*Urgent/g,  'Urgent'],
  [/🟠\s*High/g,    'High'],
  [/🟢\s*Normal/g,  'Normal'],
  // Doctor dashboard tab labels
  [/🛡️\s*/g, ''],
  [/🔬\s*/g, ''],
  [/💡\s*/g, ''],
  [/🧬\s*/g, ''],
  [/🩺\s*/g, ''],
  [/🏥\s*/g, ''],
  // bullet points
  [/'•\s*/g, "'- "],
  // Arrow glyphs that look odd when stripped
  [/ → /g, ' to '],
  [/substituted (.+?) → (.+?)\./g, 'substituted $1 with $2.'],
];

// Regex to strip ALL remaining emojis (Unicode ranges)
const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{E0020}-\u{E007F}]/gu;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Apply explicit replacements first
  for (const [pattern, replacement] of REPLACEMENTS) {
    content = content.replace(pattern, replacement);
  }

  // Strip any remaining emoji characters
  content = content.replace(EMOJI_REGEX, '');

  // Clean up double spaces from stripping
  content = content.replace(/  +/g, ' ');
  // Clean up ' : ' artefacts from "Name : Event"
  content = content.replace(/ '\s+\{/g, "' {");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Cleaned: ${path.basename(filePath)}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(fullPath);
    else if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

for (const d of DIRS) walkDir(d);
console.log('Done — all emojis removed.');
