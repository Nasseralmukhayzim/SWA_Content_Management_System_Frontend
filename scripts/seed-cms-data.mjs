#!/usr/bin/env node
/**
 * Replays exported_cms_data.json against the admin API of any target environment
 * (local, staging, production — whatever SEED_API_BASE_URL points at).
 *
 * For each item: POST the base fields, PUT the `ar`/`en` translations, then run
 * whatever workflow actions (submit/approve/publish/archive) are needed to reach
 * the item's recorded status. Lookups (event types, FAQ/document categories,
 * service audiences/channels) are seeded first so content items can reference
 * their new ids.
 *
 * Idempotent: before creating anything under a given basePath, it lists what's
 * already there and skips any slug that already exists (reusing its id for FK
 * remapping) — safe to re-run after a partial failure.
 *
 * Deliberately skipped: `Media` (the export only has placeholder/example URLs —
 * there's no real file to upload) and `Users` (no passwords in the export; admin
 * accounts should be created directly). Any field that references a Media item
 * (heroImageId, imageId, coverImageId, iconId, fileId, guideFileId) is always
 * sent as null.
 *
 * Usage:
 *   SEED_API_BASE_URL=https://your-target-host \
 *   SEED_EMAIL=admin@example.com \
 *   SEED_PASSWORD=... \
 *   node scripts/seed-cms-data.mjs [path/to/exported_cms_data.json]
 *
 * Add SEED_DRY_RUN=true to preview what would be created without writing anything.
 * Requires Node 18+ (uses global fetch).
 */

import { fileURLToPath } from 'node:url';

const BASE_URL = process.env.SEED_API_BASE_URL;
const EMAIL = process.env.SEED_EMAIL;
const PASSWORD = process.env.SEED_PASSWORD;
const DRY_RUN = process.env.SEED_DRY_RUN === 'true';
const DATA_FILE = process.argv[2] ?? fileURLToPath(new URL('../exported_cms_data.json', import.meta.url));

if (!BASE_URL || !EMAIL || !PASSWORD) {
  console.error('Missing required env vars: SEED_API_BASE_URL, SEED_EMAIL, SEED_PASSWORD.');
  console.error('Example: SEED_API_BASE_URL=http://localhost:5202 SEED_EMAIL=admin@example.com SEED_PASSWORD=*** node scripts/seed-cms-data.mjs');
  process.exit(1);
}

const LOOKUP_TYPES = [
  { key: 'Event Types (Category)', basePath: 'event-types' },
  { key: 'FAQ Categories', basePath: 'faq-categories' },
  { key: 'Document Categories', basePath: 'document-categories' },
  { key: 'Service Audiences', basePath: 'service-audiences' },
  { key: 'Service Channels', basePath: 'service-channels' },
];

// fkFields: base-field key -> idMaps key it references ('Pages' for self-reference),
// or `null` to mean "references Media, which this script never creates — always send null".
const CONTENT_TYPES = [
  {
    key: 'Pages',
    basePath: 'pages',
    baseFields: ['slug', 'parentId', 'heroImageId', 'showInNavigation', 'sortOrder'],
    fkFields: { parentId: 'Pages', heroImageId: null },
    // `sections` is a PageSection[] (see page-section.model.ts) — copied through as-is per
    // language, not string-templated like the other translation fields.
    translationFields: ['title', 'summary', 'body', 'seoTitle', 'seoDescription', 'sections'],
  },
  {
    key: 'News',
    basePath: 'news',
    baseFields: ['slug', 'heroImageId', 'isFeatured', 'sortOrder'],
    fkFields: { heroImageId: null },
    translationFields: ['title', 'summary', 'body', 'heroImageCaption', 'seoTitle', 'seoDescription'],
  },
  {
    key: 'Events',
    basePath: 'events',
    baseFields: ['slug', 'startsAtUtc', 'endsAtUtc', 'eventTypeId', 'imageId', 'registrationUrl', 'sortOrder'],
    fkFields: { eventTypeId: 'Event Types (Category)', imageId: null },
    translationFields: ['title', 'description', 'location', 'seoTitle', 'seoDescription'],
  },
  {
    key: 'FAQs',
    basePath: 'faqs',
    baseFields: ['slug', 'categoryId', 'sortOrder'],
    fkFields: { categoryId: 'FAQ Categories' },
    translationFields: ['question', 'answer'],
  },
  {
    key: 'Documents',
    basePath: 'documents',
    baseFields: ['slug', 'section', 'categoryId', 'year', 'coverImageId', 'sortOrder'],
    fkFields: { categoryId: 'Document Categories', coverImageId: null },
    translationFields: ['title', 'description', 'seoTitle', 'seoDescription', 'fileId', 'externalFileUrl'],
    translationFkFields: ['fileId'],
  },
  {
    key: 'Services',
    basePath: 'services',
    baseFields: ['slug', 'deliveryType', 'iconId', 'supportPhone', 'faqCategoryId', 'isFeatured', 'sortOrder'],
    fkFields: { iconId: null, faqCategoryId: 'FAQ Categories' },
    translationFields: ['name', 'description', 'fee', 'deliveryTime', 'requiredDocuments', 'steps', 'terms', 'objectives', 'startServiceUrl', 'guideFileId'],
    translationFkFields: ['guideFileId'],
    links: { audienceIdsKey: 'Service Audiences', channelIdsKey: 'Service Channels' },
  },
];

const STATUS_ACTIONS = ['submit', 'approve', 'publish'];
const STATUS_ORDER = ['Draft', 'InReview', 'Approved', 'Published', 'Archived'];

const stats = { created: 0, skipped: 0, errors: [] };
let token = null;

function log(message) {
  console.log(message);
}

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path} -> ${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
  }
  if (res.status === 204) return undefined;
  const contentType = res.headers.get('content-type') ?? '';
  return contentType.includes('application/json') ? res.json() : undefined;
}

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.token;
}

async function listExistingSlugs(basePath) {
  const map = new Map();
  try {
    const result = await request('GET', `/api/admin/${basePath}?page=1&pageSize=500`);
    for (const item of result?.items ?? []) {
      if (item.slug) map.set(item.slug, item.id);
    }
  } catch (err) {
    log(`  ! could not list existing ${basePath}, assuming empty: ${err.message}`);
  }
  return map;
}

function remapFk(value, targetKey, idMaps) {
  if (value === null || value === undefined) return null;
  if (targetKey === null) return null; // references Media — never recreated by this script
  const mapped = idMaps[targetKey]?.get(value);
  return mapped ?? null;
}

async function advanceWorkflow(basePath, id, targetStatus) {
  const targetIndex = STATUS_ORDER.indexOf(targetStatus);
  if (targetIndex <= 0) return;
  const actionCount = Math.min(targetIndex, STATUS_ACTIONS.length);
  for (let i = 0; i < actionCount; i++) {
    await request('POST', `/api/admin/${basePath}/${id}/${STATUS_ACTIONS[i]}`, {});
  }
  if (targetStatus === 'Archived') {
    await request('POST', `/api/admin/${basePath}/${id}/archive`, {});
  }
}

async function seedLookupType(entry, data, idMaps) {
  const items = data[entry.key]?.items ?? [];
  const idMap = new Map();
  idMaps[entry.key] = idMap;
  if (items.length === 0) return;

  log(`\n${entry.key} (${entry.basePath}):`);
  const existing = await listExistingSlugs(entry.basePath);

  for (const item of items) {
    if (existing.has(item.slug)) {
      idMap.set(item.id, existing.get(item.slug));
      stats.skipped++;
      log(`  = ${item.slug} already exists, skipping`);
      continue;
    }
    if (DRY_RUN) {
      log(`  + [dry-run] would create ${item.slug}`);
      continue;
    }
    try {
      const created = await request('POST', `/api/admin/${entry.basePath}`, {
        slug: item.slug,
        isActive: item.isActive ?? true,
        sortOrder: item.sortOrder ?? 0,
      });
      await request('PUT', `/api/admin/${entry.basePath}/${created.id}/translations/ar`, { name: item.nameAr ?? '' });
      await request('PUT', `/api/admin/${entry.basePath}/${created.id}/translations/en`, { name: item.nameEn ?? '' });
      idMap.set(item.id, created.id);
      stats.created++;
      log(`  + created ${item.slug} -> ${created.id}`);
    } catch (err) {
      stats.errors.push(`${entry.basePath}/${item.slug}: ${err.message}`);
      log(`  x FAILED ${item.slug}: ${err.message}`);
    }
  }
}

async function seedContentType(config, data, idMaps) {
  const items = data[config.key]?.items ?? [];
  const idMap = new Map();
  idMaps[config.key] = idMap; // populated as we go, so self-references (Pages.parentId) to
  // earlier siblings in the array resolve; forward references need a second run.
  if (items.length === 0) return;

  log(`\n${config.key} (${config.basePath}):`);
  const existing = await listExistingSlugs(config.basePath);

  for (const item of items) {
    if (existing.has(item.slug)) {
      idMap.set(item.id, existing.get(item.slug));
      stats.skipped++;
      log(`  = ${item.slug} already exists, skipping`);
      continue;
    }
    if (DRY_RUN) {
      log(`  + [dry-run] would create ${item.slug} (${item.status})`);
      continue;
    }

    try {
      const basePayload = {};
      for (const field of config.baseFields) {
        if (field in (config.fkFields ?? {})) {
          basePayload[field] = remapFk(item[field], config.fkFields[field], idMaps);
        } else {
          basePayload[field] = item[field] ?? null;
        }
      }

      const created = await request('POST', `/api/admin/${config.basePath}`, basePayload);
      idMap.set(item.id, created.id);

      for (const lang of ['Ar', 'En']) {
        const payload = {};
        for (const field of config.translationFields) {
          payload[field] = (config.translationFkFields ?? []).includes(field) ? null : item[`${field}${lang}`] ?? null;
        }
        await request('PUT', `/api/admin/${config.basePath}/${created.id}/translations/${lang.toLowerCase()}`, payload);
      }

      await advanceWorkflow(config.basePath, created.id, item.status);

      if (config.links && ((item.audienceIds?.length ?? 0) > 0 || (item.channelIds?.length ?? 0) > 0)) {
        await request('PUT', `/api/admin/${config.basePath}/${created.id}/links`, {
          audienceIds: (item.audienceIds ?? []).map((id) => idMaps[config.links.audienceIdsKey]?.get(id)).filter(Boolean),
          channelIds: (item.channelIds ?? []).map((id) => idMaps[config.links.channelIdsKey]?.get(id)).filter(Boolean),
        });
      }

      stats.created++;
      log(`  + created ${item.slug} -> ${created.id} (${item.status})`);
    } catch (err) {
      stats.errors.push(`${config.basePath}/${item.slug}: ${err.message}`);
      log(`  x FAILED ${item.slug}: ${err.message}`);
    }
  }
}

async function main() {
  const { readFile } = await import('node:fs/promises');
  const data = JSON.parse(await readFile(DATA_FILE, 'utf-8'));

  log(`Target:  ${BASE_URL}`);
  log(`Data:    ${DATA_FILE}`);
  log(`Mode:    ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);

  if (!DRY_RUN) {
    log('\nLogging in...');
    token = await login();
    log('Logged in.');
  }

  const idMaps = {};
  for (const entry of LOOKUP_TYPES) {
    await seedLookupType(entry, data, idMaps);
  }
  for (const config of CONTENT_TYPES) {
    await seedContentType(config, data, idMaps);
  }

  log('\n--- Summary ---');
  log(`Created: ${stats.created}`);
  log(`Skipped (already existed): ${stats.skipped}`);
  log('Not seeded by this script: Media (placeholder URLs, no real files to upload), Users (no passwords in export).');
  if (stats.errors.length > 0) {
    log(`Errors: ${stats.errors.length}`);
    for (const err of stats.errors) log(`  - ${err}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('\nSeed run aborted:', err.message);
  process.exitCode = 1;
});
