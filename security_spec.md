# BasharTube Security Specification

## 1. Data Invariants
1. **PII Isolation**: Private user records (`/users/{userId}`) containing `email`, watch history, search queries, and liked/disliked/saved video lists MUST only be read by `userId == request.auth.uid` or a verified admin.
2. **Identity Integrity**: Every user-created resource (`channels`, `videos`, `comments`, `posts`, `users`) MUST bind its `ownerUid` / `authorUid` / `uid` to `request.auth.uid` on creation and preserve it as immutable on update.
3. **Parent Gate & Relational Sync**:
   - A `Video` cannot be created unless its referenced `channelId` exists in `/channels/{channelId}` and belongs to `request.auth.uid` (or caller is a verified admin).
   - A `Comment` cannot be created under `/videos/{videoId}/comments/{commentId}` unless `/videos/{videoId}` exists, and `incoming().videoId == videoId`.
   - A `CommunityPost` cannot be created unless `/channels/{incoming().channelId}` exists and belongs to `request.auth.uid` (or caller is a verified admin).
4. **Verified Writes Only**: Every write operation (`create`, `update`, `delete`) requires `request.auth != null && request.auth.token.email_verified == true`.
5. **Temporal Integrity**: `createdAt == request.time` and `updatedAt == request.time` on creation; `createdAt` immutable and `updatedAt == request.time` on updates.
6. **Privilege Escalation Prevention**: Regular users cannot set `isVerified: true` on channels, cannot modify `/appConfig/brand`, and cannot impersonate the bootstrapped admin email unless `request.auth.token.email_verified == true`.
7. **Query Enforcement (`allow list`)**: No blanket `allow list: if isSignedIn();`. List rules evaluate `resource.data` directly (e.g., `visibility == 'Public'`, `status == 'Published'`, `isPublic == true`, or `ownerUid == request.auth.uid`) without `get()`/`exists()` inside `allow list`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing on Video Create**: Creating `/videos/vid-1` with `ownerUid: "victim_uid"` while authenticated as `"attacker_uid"` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection on Channel Create**: Creating `/channels/ch-1` with an extra ghost field `isAdminChannel: true` -> `PERMISSION_DENIED` (blocked by `keys().hasOnly(...)`).
3. **Privilege Escalation on Channel Create**: Creating `/channels/ch-1` with `isVerified: true` or `subscribersCount: 100000` -> `PERMISSION_DENIED`.
4. **PII Blanket Read**: User B calling `getDoc(doc(db, 'users', 'userA'))` or `getDocs(collection(db, 'users'))` -> `PERMISSION_DENIED`.
5. **Unverified Email Spoof**: User with `email: "abulhasanmohim@gmail.com"` and `email_verified: false` attempting admin write on `/appConfig/brand` -> `PERMISSION_DENIED`.
6. **ID Poisoning**: Attempting `create` at `/videos/invalid!id$$withspaces` or a 200-character ID -> `PERMISSION_DENIED` (blocked by `isValidId`).
7. **Orphaned Comment Write**: Creating `/videos/nonexistent-vid/comments/cmt-1` -> `PERMISSION_DENIED` (blocked by parent `exists()`).
8. **Value Poisoning on Video Update**: Updating `/videos/vid-1` with `affectedKeys().hasOnly(['title', 'updatedAt'])` where `title` is a 500KB string or boolean -> `PERMISSION_DENIED` (blocked by `isValidVideo(incoming())`).
9. **Immutable Timestamp Tampering**: Updating `/videos/vid-1` while mutating `createdAt` or providing a backdated `updatedAt != request.time` -> `PERMISSION_DENIED`.
10. **Array Exhaustion (Denial of Wallet)**: Creating a video with 50 tags in `tags` or non-string first tag -> `PERMISSION_DENIED`.
11. **Unfiltered Private Video List Scraping**: Unauthenticated or non-owner listing `/videos` without `where('visibility', '==', 'Public')` -> `PERMISSION_DENIED`.
12. **Comment Author Impersonation / Deletion**: User B updating or deleting User A's comment on User C's video -> `PERMISSION_DENIED`.
