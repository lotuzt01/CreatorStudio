# JAJA AI Creator Studio — Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Private User Isolation (PII Protection)**:
   - `/users/{userId}` stores PII (`email`, `displayName`, `photoURL`). Only the authenticated verified owner (`request.auth.uid == userId`) can `get`, `create`, or `update` their own document. Blanket `list` queries on `/users` are permanently denied.
2. **Strict Ownership Across Production Resources**:
   - Every document in `/projects/{projectId}`, `/characters/{characterId}`, and `/prompts/{promptId}` must carry an immutable `ownerId` equal to `request.auth.uid`.
   - `allow list` rules explicitly enforce `resource.data.ownerId == request.auth.uid` without `get()` or `exists()` lookups, forcing clients to query with `where('ownerId', '==', uid)`.
3. **Referential Integrity on Create**:
   - When a `Character` or `PromptRecord` specifies a non-empty `projectId`, that project must exist in `/projects/{projectId}` and be owned by `request.auth.uid`.
   - When a `PromptRecord` specifies a non-empty `characterId`, that character must exist in `/characters/{characterId}` and be owned by `request.auth.uid`.
4. **Terminal State Locking**:
   - A `Project` with `status == 'completed'` is locked against further client-side updates.
5. **Temporal Integrity & Immutability**:
   - On `create`: `createdAt == request.time && updatedAt == request.time`.
   - On `update`: `createdAt == resource.data.createdAt && updatedAt == request.time && ownerId == resource.data.ownerId`.
6. **Zero Shadow Fields & Bounded Sizes**:
   - All `create` operations enforce `hasAll(...) && hasOnly(...)`.
   - All `update` operations wrap with `isValid[Entity](incoming())` and explicit action branches with `affectedKeys().hasOnly(...)`.
   - Every string field enforces `.size()` limits; `tags` enforces `tags.size() <= 10` and element type checks.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)

1. **Unauthenticated Read/Write**: Read `/projects/proj_1` with `auth == null`.
2. **Unverified Email Write**: Create `/projects/proj_1` where `auth.token.email_verified == false`.
3. **PII Blanket List**: List `/users` as authenticated user `userA`.
4. **Cross-User PII Get**: Read `/users/userB` as authenticated user `userA`.
5. **Identity Spoofing on Create**: Create `/projects/proj_2` as `userA` with `ownerId: "userB"`.
6. **Shadow Field Injection (Create)**: Create `/characters/char_1` with extra field `isAdmin: true`.
7. **Shadow Field Injection (Update)**: Update `/characters/char_1` adding ghost key `role: "superadmin"`.
8. **ID Poisoning**: Create `/projects/<200-char-invalid-id$!>` violating `isValidId()`.
9. **Value Poisoning / Size Exhaustion**: Update `/prompts/p1` with `title` exceeding 160 chars or `tags` array with 15 items.
10. **Orphaned Relational Reference**: Create `/characters/char_2` referencing `projectId: "nonexistent_proj"` or another user's `projectId`.
11. **Terminal State Bypass**: Update `/projects/proj_done` after `status` is already `'completed'`.
12. **Timestamp / Owner Tampering**: Update `/projects/proj_1` modifying `createdAt` or `ownerId`, or supplying client-forged `updatedAt != request.time`.
