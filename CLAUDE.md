# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lernpartner-complete** is a comprehensive language-learning platform designed for multi-user, multi-device use. It supports diverse learning methods (vocabulary, fill-the-gap, dictation, shadowing, and more to come) with spaced repetition and detailed progress tracking. The platform is built for offline-first learning with server-side sync, and its architecture is designed to scale from language learning to other domains.

## UI Language

For the beginning, the app UI is in **German**. Keep all user-facing strings in German when designing. Prepare for a multi-Language app UI in the future, using repositories instead of in-code text strings.

## Look & Feel

**Motto/Claim** (verbatim, in UI-Texten und Marketing verwenden): „schneller lernen – länger behalten – natürlich anwenden"

**„Schwungfeder"**: leicht, schwungvoll, themenoffen (nicht nur Sprachen). Heller, fast weisser Grund; Hauptfarbe **Koenigsblau** (#2452E0); Signalfarben mit fester Bedeutung: Koralle (#FF6E5F, Schwung/Energie), Minze (#22C39F, richtig/Fortschritt), Honig (#FFB92E, Serie/Belohnung). Ueberschriften: **Baloo 2** ExtraBold (rund); Fliesstext: **Nunito**. Schriften werden lokal gebuendelt (@fontsource), kein Font-CDN.

Signatur-Motiv **„Aufschwung"**: eine ansteigende, sich verjuengende Federstrich-Linie (Unterstreichungen, Lernpfad — der Lernpfad steigt an, jede Station liegt hoeher als die letzte). Knoepfe haben eine fuehlbare dunkle Kante (`box-shadow: 0 4px 0 …`) und federn beim Druecken. Grosse Radien (12/18/24px), weiche Schatten, viel Weissraum. Keine Flaggen oder Sprach-Metaphern im Kern-UI — Themen sind farbige Punkte.

Alle Farben, Schriften, Radien und Schatten kommen ausschliesslich aus den Design-Tokens in `packages/client/src/styles/tokens.css` (semantische Namen wie `--color-primary`, nie direkte Hex-Werte in Komponenten). Palette und Ueberschriften-Schrift sind dort per `data-palette` / `data-headings` am `<html>`-Element austauschbar.

## Didaktik (Motto → Mechanik)

Jede Lerneinheit setzt die drei Motto-Versprechen technisch um:

1. **schneller lernen** — klein anfangen und meistern-basiert freischalten (Tier-System: neue Items erst, wenn die aktuellen Box ≥ 2 erreichen); die Stufe ist dabei frei wählbar: Lernende dürfen jederzeit auf niedrigere Stufen zurückgehen (Stufen-Chips in der Lektion, Wahl wird gespeichert, Fortschritt und Freischaltung bleiben unangetastet); adaptive Auswahl (schwache Items kommen häufiger); sofortiges kontrastives Feedback (bei Fehlern richtige und gewählte Antwort direkt vergleichbar machen); ab Beherrschung (≥ 3 Items mit Box ≥ 3) **Schnellmodus** zur Automatisierung: Antworten per Tastatur (Intervalle: Ziffer = Stufenzahl des Namens, danach k/g für klein/groß, t für Tritonus; Ziffer allein genügt, solange nur eine Variante freigeschaltet ist), bei richtiger Antwort sofort weiter (~0,5 s), bei falscher kurze Korrektur mit Label-Aufleuchten, dann automatisch weiter; Antwortzeiten werden gemessen (Vorstufe zu `response_time_ms` in `review_history`).
2. **länger behalten** — Spaced Repetition (Leitner, generisch in `packages/client/src/learning/leitner.ts`); Interleaving statt Themenblöcken; Variabilität der Darbietung (z. B. wechselnde Grundtöne in Musik), damit die Relation gelernt wird statt des Einzelbeispiels; immer aktives Abrufen, nie passives Wiederholen.
3. **natürlich anwenden** — jede Sitzung endet mit Anwendungs-Aufgaben in echtem Material: bekannte Melodien (WICHTIG: nur gemeinfreie — Volkslieder, alte Klassik — wegen Urheberrecht) und zwar **mit echtem Rhythmus** (Notenwerte in Schlägen + BPM pro Melodie; reine Intervallfolgen mit Einheitsdauer sind nicht wiedererkennbar); Eselsbrücken zu realem Material (Anker-Songs); später Produktion statt nur Erkennung (nachsingen/-spielen → `review_artifacts`).

Regel für Aufgabenstellungen: Kriterien müssen für den Lernenden objektiv nachprüfbar sein — nie nach „dem markanten X" fragen, sondern nach messbarem („der größte Sprung") und das Gemeinte zusätzlich wahrnehmbar machen (Zielsprung wird beim Abspielen betont; Invariante: der größte Sprung der Phrase ist immer das Zielintervall, wird per `largestLeapIndex` abgeleitet statt per Hand gepflegt).

Feedback-Regel fürs Einprägen: Wenn ein Klang zu einem Label vorgespielt wird (kontrastives Feedback, „Unterschied hören"), leuchtet das zugehörige Label synchron zur Wiedergabe auf (audio-visuelle Kopplung). Die Feedback-Phase ist explorierbar: Alle Antwort-Chips sind anklickbar (bzw. per Tastenkürzel auslösbar) und spielen ihr Item im Kontext der Frage — Wiederholen im eigenen Tempo. Jede Exploration pausiert das Auto-Weiterschalten des Schnellmodus; der „Weiter"-Knopf ist in der Feedback-Phase deshalb immer sichtbar.

**Generisch vs. domänenspezifisch** (gilt für alle Themen — Musik, Sprache, Geografie …):
- Gleich für alle: Sitzungs-Engine, Fortschritt/Leitner (`src/learning/`), Feedback-Fluss, Freischalt-Logik, Session-UI (Fortschrittsbalken, Antwort-Chips, Feedback-Box, Ergebnis).
- Pro Thema verschieden: Stimulus-Erzeugung, Antwort-Eingabe, Anwendungs-Format und Distraktor-Logik (`src/exercises/<thema>/`).
- Referenz-Implementierung: Musik-Gehörtraining in `src/exercises/music/` (Intervalle + Akkorde als zwei Konfigurationen desselben Übungstyps).

## Debugging

Die App führt ein lokales Sitzungs-Protokoll (`packages/client/src/services/sessionLog.ts`): Ringpuffer (400 Einträge) in `localStorage['lernpartner.sessionlog']`, überlebt Reload/Absturz. Aufgezeichnet werden View-Wechsel, Lektionsstart, Wiedergaben, Antworten (inkl. Antwortzeit), Auto-Weiter, Schnellmodus-Wechsel sowie globale JS-Fehler. Bei Bug-Reports zuerst das Protokoll ansehen: Knopf „Sitzungs-Protokoll kopieren" auf der Startseite oder Konsole `lernpartnerLog.dump()` / `lernpartnerLog.clear()`. Neue Interaktionen bitte ebenfalls über `log(event, data)` protokollieren.

## Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | React + TypeScript + Vite (PWA) |
| **Backend** | Node.js + NestJS (TypeScript) |
| **Database** | PostgreSQL |
| **Media Storage** | S3-compatible: MinIO (dev) / Hetzner Object Storage (prod) |
| **Auth** | JWT + Passport (email/password + Google/Apple OAuth) |
| **Offline** | Service Worker + IndexedDB |
| **Deployment** | Docker Compose |
| **Monorepo** | npm workspaces |

## Commands

- `npm run dev` — Start all services (client + server + DB) via Docker Compose
- `npm run dev:client` — Start frontend dev server only
- `npm run dev:server` — Start backend dev server only
- `npm run build` — Build all packages for production
- `npm run lint` — ESLint across all packages
- `npm run test` — Run tests across all packages
- `npm run typecheck` — TypeScript type checking across all packages
- `npm run db:migrate` — Run database migrations
- `npm run db:seed` — Seed database with sample data

## Architecture

### Monorepo Structure

```
Lernpartner-complete/
├── package.json                  # Workspace root (npm workspaces)
├── docker-compose.yml            # Dev: PostgreSQL + MinIO + App
├── docker-compose.prod.yml       # Production
├── packages/
│   ├── shared/                   # Shared types & utilities
│   │   └── src/
│   │       ├── types/
│   │       │   ├── user.ts           # User, Device, AuthToken
│   │       │   ├── content.ts        # ContentLibrary, ContentMedia, LanguagePack
│   │       │   ├── exercise.ts       # Exercise, ExerciseType, ExerciseConfig
│   │       │   ├── learning.ts       # LearningItem, ReviewHistory, ReviewArtifact
│   │       │   ├── analytics.ts      # AnalyticsSnapshot, CohortData
│   │       │   └── sync.ts           # SyncPayload, SyncConflict
│   │       └── constants/
│   │           ├── box-levels.ts     # Leitner box configuration
│   │           └── cefr-levels.ts    # A1-C2 definitions
│   ├── server/                   # NestJS backend
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/             # Login, Register, OAuth, JWT
│   │       │   ├── users/            # Profile, settings, encryption
│   │       │   ├── content/          # Content library (shared across users)
│   │       │   ├── languages/        # Language definitions, script systems
│   │       │   ├── learning/         # Learning items, review history
│   │       │   ├── exercises/        # Exercise types and configuration
│   │       │   ├── media/            # Upload/download, S3 abstraction
│   │       │   ├── sync/             # Device sync (delta-based)
│   │       │   ├── analytics/        # Anonymized cross-user aggregation
│   │       │   └── backup/           # Automated DB + media backup
│   │       ├── common/
│   │       │   ├── guards/           # Auth guards
│   │       │   ├── interceptors/     # Encryption, logging
│   │       │   └── filters/          # Error handling
│   │       └── config/
│   │           └── database.ts       # TypeORM configuration
│   └── client/                   # React PWA frontend
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── hooks/
│           ├── services/
│           │   ├── api.ts            # REST client
│           │   ├── offline.ts        # IndexedDB + Service Worker logic
│           │   └── sync.ts           # Client-side sync engine
│           ├── stores/               # Zustand state management
│           └── sw.ts                 # Service Worker entry
```

### Data Flow

```
User (Browser/PWA)
  │
  ├── Online: REST API ──► NestJS Server ──► PostgreSQL
  │                                    └──► S3 (media)
  │
  └── Offline: IndexedDB (progress) + Cache Storage (media)
         │
         └── On reconnect: Delta sync via /api/sync
```

## Database Schema

### Shared Content (user-independent)

**language_packs** — Language pair definitions
- `id`, `source_language`, `target_language`, `title`, `description`
- `script_system` (latin, cyrillic, hiragana, katakana, arabic, hanzi, devanagari...)
- `text_direction` (ltr, rtl)
- `metadata` (jsonb)

**content_library** — Central content repository (shared across all users)
- `id`, `language_pack_id` (FK), `content_type` (text, dialogue, article, song_lyrics...)
- `title`, `body` (text), `difficulty_level`, `cefr_level` (A1-C2)
- `tags` (text[]), `metadata` (jsonb)
- `license_info` (jsonb: type, source, expires)
- `created_by` (admin/author), `version`, timestamps

**content_media** — Media attached to content (shared, potentially expensive to produce)
- `id`, `content_id` (FK)
- `role` (illustration, audio_native, audio_slow, video_explanation, pronunciation_guide)
- `storage_key` (S3 path), `mime_type`, `size_bytes`, `duration_ms`
- `license_info` (jsonb), `metadata` (jsonb: speaker, dialect, etc.)

**exercises** — Exercise definitions derived from content
- `id`, `content_id` (FK)
- `type` (vocabulary, fill_gap, dictation, shadowing...)
- `config` (jsonb: type-specific configuration)
- `canonical_item_key` — Stable key for cross-user comparison, e.g. `pack:de-en:vocab:house`
- `difficulty_rating` (float, computed from user data)
- `version`

### User-Specific

**users** — User accounts
- `id` (uuid), `email` (encrypted at rest), `password_hash` (bcrypt)
- `display_name`, `settings` (jsonb), timestamps

**devices** — Registered devices per user
- `id`, `user_id` (FK), `device_name`, `device_info` (jsonb), `last_sync_at`

**learning_items** — Per user + exercise progress (Leitner/SM-2)
- `id`, `user_id` (FK), `exercise_id` (FK → shared exercises)
- `box_level` (smallint, 1-7), `status` (new, learning, known, difficult, suspended)
- `consecutive_correct`, `consecutive_wrong`, `total_attempts`, `total_correct`
- `ease_factor` (float, SM-2), `interval_days` (float)
- `next_review_at`, `last_reviewed_at`, `first_seen_at`, `last_synced_at`

**review_history** — Every single review attempt
- `id`, `learning_item_id` (FK)
- `reviewed_at` (timestamp with timezone), `result` (correct, wrong, partial, skipped)
- `response_time_ms`, `box_before`, `box_after`
- `context` (jsonb: user input, errors, hints used — varies by exercise type)
- `device_id` (FK)

**review_artifacts** — Media produced by user during review
- `id`, `review_history_id` (FK)
- `type` (audio_recording, drawing, handwriting, photo)
- `storage_key` (S3, user-specific prefix), `mime_type`, `size_bytes`, `duration_ms`
- `metadata` (jsonb)

### Analytics (anonymized, no user IDs)

**analytics_snapshots** — Periodically aggregated cross-user data
- `id`, `canonical_item_key` (→ exercises), `period` (date)
- `total_attempts`, `success_rate`, `avg_response_time_ms`, `avg_box_level`
- `common_errors` (jsonb), `difficulty_computed` (float)
- `cohort_data` (jsonb: by CEFR level, source language, etc.)

## Key Design Decisions

1. **Content is shared, progress is private.** `content_library`, `content_media`, and `exercises` belong to no user. `learning_items`, `review_history`, and `review_artifacts` are per-user. This avoids duplicating expensive content.

2. **`canonical_item_key`** on exercises enables cross-user analytics without exposing user data. Same exercise across all users shares the same key.

3. **Exercise types as plugin system.** New exercise type = new enum value + frontend component + config schema. No DB migration needed for the exercise itself (config is JSONB).

4. **Spaced repetition is computed client-side.** The client calculates `next_review_at` and box transitions. On sync, the server merges progress using "last write wins" with timestamps (sufficient since users don't learn on multiple devices simultaneously).

5. **Script system awareness.** `language_packs.script_system` and `text_direction` drive frontend font loading, input methods, and layout direction (RTL/LTR).

6. **Offline-first.** Content and media are cached in IndexedDB / Cache Storage. Learning progress is written locally and synced on reconnect (delta sync based on `last_synced_at`).

7. **Security.** Passwords: bcrypt. Sensitive user data (email): AES-256 encrypted at rest. JWT with refresh token rotation. Backups: pg_dump encrypted to separate S3 bucket.

8. **Review artifacts** capture media from user attempts (audio recordings, drawings, etc.) linked to the specific review event, enabling longitudinal analysis of learner progress.

9. **Analytics snapshots** are pre-aggregated and anonymized — no user IDs, only aggregates per `canonical_item_key` and cohort. This enables insights like "this vocabulary is hard for German speakers" without compromising privacy.
