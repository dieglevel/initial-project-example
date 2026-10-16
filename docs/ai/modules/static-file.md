# Module: Static File

## Purpose
File upload, storage, and lifecycle management with adapter-based storage backends.

## Responsibilities and Boundaries
- Upload single and multiple files.
- Store file metadata in database (`FileEntity`).
- Serve files via static file serving.
- Clean up orphaned temporary files via scheduled cron.
- Adapter pattern for storage backends (currently: local disk).

## Source Map
```
src/module/static-file/
├── static-file.module.ts
├── static-file.controller.ts
├── static-file.service.ts
├── clean-temp-file.cron.ts         # Daily cleanup of temp files
├── enum.ts                         # FileType, FileProvider enums
├── dto/
│   └── upload.dto.ts               # UploadFileDto, UploadMultipleDto
├── _entities/
│   └── file.entity.ts              # FileEntity
└── storage/
    ├── file-storage.adapter.ts     # FileStorageAdapter interface
    └── service/
        └── local-disk.adapter.ts   # LocalDiskAdapter implementation
```

## Main Components

### `FileEntity`
- Extends `BaseEntity`. Table: `"files"`.
- Columns: `fileType` (enum), `provider` (enum), `storagePath`, `size`, `fileKey`, `originalName`, `mimeType`, `order`, `metadata`, `isTemporary`.
- Computed property `url`: `${APP_URL}/file/${storagePath}`.
- Uses `@Exclude()` / `@Expose({ groups: [...] })` for serialization control.
- Indexed on: `createdAt`, `fileType`, `provider`.

### `StaticFileService`
- `uploadSingle(file, body)`: Upload → create entity (isTemporary=true) → save in transaction.
- `uploadMultiple(files, body)`: Batch upload with rollback on failure.
- `getStream(id, range?)`: Stream file for download/preview.
- `softDelete(id)`: Soft-delete file record.
- `restore(id)`: Restore soft-deleted file.
- `markAsPermanent(id, manager?, oldId?)`: Mark file as permanent; optionally mark old file as temporary.

### `FileCleanupCron`
- Schedule: Daily at midnight (`EVERY_DAY_AT_MIDNIGHT`).
- Logic: Find files where `isTemporary=true` AND `createdAt < 24 hours ago` → hard-delete DB record → delete physical file.
- Reports: detailed counts (dbDeleted, diskDeleted, diskMissing, errors, freed size).

### `FileStorageAdapter` (interface)
- `upload(file, fileType)`: Returns upload result with path/key/metadata.
- `delete(storagePath)`: Delete physical file.
- `getStreamAndHeaders(storagePath, range?)`: Stream file with HTTP range support.

## Dependencies and Integrations
- `ServeStaticModule` serves files at `/{ROUTE_FOLDER}/` path.
- `ProfileEntity` uses `FileEntity` for avatar.
- Other modules that attach files must call `markAsPermanent()` to prevent cleanup.

## Extension Guide
- **New storage backend**: Implement `FileStorageAdapter`, register as provider, add to `getAdapter()` switch.
- **New file types**: Add to `FileType` enum in `enum.ts`.

## Constraints and Common Pitfalls
- **Files are temporary by default** — they will be deleted after 24h if not marked permanent.
- `delete()` in service only deletes from local disk, not from DB.
- `softDelete()` only soft-deletes the DB record, not the physical file.
- Cleanup cron does hard-delete (not soft-delete) of expired temp files.

## Documentation Status
- Status: Verified
- Last Verified: 2026-10-16
- Source Paths: `src/module/static-file/`
- Known Gaps: `file-storage.adapter.ts` interface details not fully expanded.
