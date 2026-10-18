// ==============================================================================
// AUTOMATED TEST SUITE FOR KALUPUR MASJID TIMINGS
// Verifies formatting, validation rules, file integrity, and SQL consistency.
// ==============================================================================

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

import { formatTo12Hour, formatTo24Hour, getActivePrayer } from './js/utils/formatters.js';
import { validateAndFormatPhone, validatePrayerTimes } from './js/utils/validator.js';

console.log('🕌 Running Kalupur Masjid Timings Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
  }
}

// ------------------------------------------------------------------------------
// 1. Time Formatters Test
// ------------------------------------------------------------------------------
console.log('--- Testing Time Formatting Utilities ---');

it('converts 24-hour time to 12-hour AM/PM format', () => {
  assert.strictEqual(formatTo12Hour('05:30'), '05:30 AM');
  assert.strictEqual(formatTo12Hour('12:45'), '12:45 PM');
  assert.strictEqual(formatTo12Hour('17:25'), '05:25 PM');
  assert.strictEqual(formatTo12Hour('00:15'), '12:15 AM');
  assert.strictEqual(formatTo12Hour('12:00'), '12:00 PM');
  assert.strictEqual(formatTo12Hour('05:30 AM'), '05:30 AM');
});

it('converts 12-hour AM/PM time to HTML5 input 24-hour format', () => {
  assert.strictEqual(formatTo24Hour('05:30 AM'), '05:30');
  assert.strictEqual(formatTo24Hour('12:45 PM'), '12:45');
  assert.strictEqual(formatTo24Hour('05:25 PM'), '17:25');
  assert.strictEqual(formatTo24Hour('12:15 AM'), '00:15');
});

it('calculates active/next upcoming prayer', () => {
  const sampleSchedules = [
    { prayer_name: 'Fajr', jamaat_time: '05:55 AM' },
    { prayer_name: 'Dhuhr', jamaat_time: '01:15 PM' },
    { prayer_name: 'Asr', jamaat_time: '05:25 PM' },
    { prayer_name: 'Maghrib', jamaat_time: '06:45 PM' },
    { prayer_name: 'Isha', jamaat_time: '08:30 PM' }
  ];
  const active = getActivePrayer(sampleSchedules);
  assert.ok(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(active));
});

// ------------------------------------------------------------------------------
// 2. Validation Utilities Test
// ------------------------------------------------------------------------------
console.log('\n--- Testing Validation Utilities ---');

it('validates and formats 10-digit Indian phone numbers', () => {
  const res1 = validateAndFormatPhone('9876543210');
  assert.strictEqual(res1.isValid, true);
  assert.strictEqual(res1.formatted, '+919876543210');

  const res2 = validateAndFormatPhone('+91 98765 43210');
  assert.strictEqual(res2.isValid, true);
  assert.strictEqual(res2.formatted, '+919876543210');

  const res3 = validateAndFormatPhone('09876543210');
  assert.strictEqual(res3.isValid, true);
  assert.strictEqual(res3.formatted, '+919876543210');

  const resInvalid = validateAndFormatPhone('12345');
  assert.strictEqual(resInvalid.isValid, false);
});

it('validates 5 daily prayer timings object completeness', () => {
  const completeTimings = {
    Fajr: { azaan: '05:30 AM', jamaat: '05:55 AM' },
    Dhuhr: { azaan: '12:45 PM', jamaat: '01:15 PM' },
    Asr: { azaan: '05:00 PM', jamaat: '05:25 PM' },
    Maghrib: { azaan: '06:40 PM', jamaat: '06:45 PM' },
    Isha: { azaan: '08:00 PM', jamaat: '08:30 PM' }
  };
  const valComplete = validatePrayerTimes(completeTimings);
  assert.strictEqual(valComplete.isValid, true);
  assert.strictEqual(valComplete.errors.length, 0);

  const incompleteTimings = {
    Fajr: { azaan: '05:30 AM', jamaat: '05:55 AM' },
    Dhuhr: { azaan: '', jamaat: '01:15 PM' }
  };
  const valIncomplete = validatePrayerTimes(incompleteTimings);
  assert.strictEqual(valIncomplete.isValid, false);
  assert.ok(valIncomplete.errors.length > 0);
});

// ------------------------------------------------------------------------------
// 3. File Integrity & Security Checklist
// ------------------------------------------------------------------------------
console.log('\n--- Testing File Integrity & Schema Consistency ---');

it('verifies critical project files exist', () => {
  const requiredFiles = [
    'index.html',
    'manifest.json',
    'sw.js',
    'css/style.css',
    'js/config.js',
    'js/supabase-client.js',
    'js/store.js',
    'js/router.js',
    'js/views/public-home.js',
    'js/views/public-masjid.js',
    'js/views/public-report.js',
    'js/views/auth-login.js',
    'js/views/imam-dashboard.js',
    'js/views/imam-edit.js',
    'js/views/imam-history.js',
    'js/views/admin-dashboard.js',
    'supabase/schema.sql',
    'supabase/functions.sql',
    'supabase/rls.sql',
    'supabase/seed.sql',
    'supabase/complete_setup.sql'
  ];

  for (const file of requiredFiles) {
    const fullPath = path.resolve(file);
    assert.ok(fs.existsSync(fullPath), `Missing required file: ${file}`);
  }
});

it('ensures no Supabase service_role secret key is leaked in frontend code', () => {
  const frontendFiles = [
    'js/config.js',
    'js/supabase-client.js',
    'js/store.js',
    'index.html'
  ];

  for (const file of frontendFiles) {
    const content = fs.readFileSync(path.resolve(file), 'utf8');
    assert.ok(!content.includes('service_role'), `Potential secret leak found in ${file}`);
  }
});

it('verifies SQL files contain mandatory tables and RLS declarations', () => {
  const schemaSql = fs.readFileSync(path.resolve('supabase/complete_setup.sql'), 'utf8');
  assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.masjids'));
  assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.profiles'));
  assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.prayer_schedules'));
  assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.timing_updates'));
  assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.correction_reports'));
  assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS public.audit_logs'));
  assert.ok(schemaSql.includes('ALTER TABLE public.masjids ENABLE ROW LEVEL SECURITY'));
  assert.ok(schemaSql.includes('CREATE OR REPLACE FUNCTION public.approve_timing_update'));
  assert.ok(schemaSql.includes('CREATE OR REPLACE FUNCTION public.reject_timing_update'));
});

console.log(`\n========================================`);
console.log(`Test Results: ${passedTests}/${totalTests} Passed!`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
