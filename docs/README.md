# FDM Monster — Documentation

This directory contains all feature design documents, architecture decision records, API specifications, and user guides for FDM Monster.

## Organization

- **\`architecture/\`** — Architectural decision records (ADRs) and system design documents
- **\`api/\`** — API endpoint specifications and schema references
- **\`features/\`** — Feature design and requirements documents
- **\`guides/\`** — User guides, setup instructions, and tutorials

## Key Documents

### Architecture
- [\`architecture/file-storage.md\`](./architecture/file-storage.md) — File storage subsystem design
- [\`architecture/metadata-handling.md\`](./architecture/metadata-handling.md) — Metadata normalization and storage

### API
- [\`api/file-storage-api.md\`](./api/file-storage-api.md) — File storage API reference
- [\`api/print-jobs-api.md\`](./api/print-jobs-api.md) — Print job API reference

### Features
- [\`features/sqlite-metadata-storage.md\`](./features/sqlite-metadata-storage.md) — SQLite metadata migration proposal
- [\`features/file-crud-api.md\`](./features/file-crud-api.md) — Full CRUD API enhancement spec
- [\`features/multi-plate-3mf.md\`](./features/multi-plate-3mf.md) — Multi-plate 3MF support

## Adding New Documentation

1. Choose the appropriate category (architecture, api, features, guides)
2. Create a new \`.md\` file with a clear, descriptive name
3. Follow the template below
4. Link to the new document from this README

### Document Template

\`\`\`markdown
# [Document Title]

**Category:** Architecture | API | Feature | Guide  
**Status:** Draft | In Review | Approved | Archived  
**Version:** 1.0  
**Last Updated:** YYYY-MM-DD  

## Overview
[2-3 sentence summary of what this document covers]

## Context
[Why is this needed? What problem does it solve?]

## Proposal / Details
[Main content]

## Related Documents
- [Link to related docs]

## Open Questions
- [List any unresolved items]
\`\`\`

---

## Navigation

- **[Project Root](../README.md)** — Main project README
- **[Development Changelog](../DEVELOPMENT.md)** — Effort tracking and version history
- **[Contributing Guide](../CONTRIBUTING.md)** — Guidelines for contributors
