/**
 * Firestore Security Rules Test Suite ("Dirty Dozen" Verification)
 * Verifies Identity, Integrity, PII Isolation, Parent Gates, and Anti-Update-Gap protections
 * against @firebase/rules-unit-testing when run with the Firebase Emulator Suite.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  payload?: Record<string, unknown>;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Identity spoofing on video create',
    collectionPath: 'videos/vid_spoof_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { ownerUid: 'victim_uid', title: 'Spoofed Video' },
  },
  {
    id: 2,
    name: 'Shadow ghost field injection on channel create',
    collectionPath: 'channels/ch_shadow_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { id: 'ch_shadow_1', ownerUid: 'attacker', ghostAdminFlag: true },
  },
  {
    id: 3,
    name: 'Self-verification privilege escalation on channel create',
    collectionPath: 'channels/ch_priv_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { id: 'ch_priv_1', ownerUid: 'attacker', isVerified: true, subscribersCount: 99999 },
  },
  {
    id: 4,
    name: 'PII blanket read of another user document',
    collectionPath: 'users/victim_uid',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Unverified admin email spoof on appConfig/brand',
    collectionPath: 'appConfig/brand',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { name: 'HackedTube' },
  },
  {
    id: 6,
    name: 'Invalid document ID poisoning with illegal characters',
    collectionPath: 'videos/bad$$id!!',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Orphaned comment create under non-existent parent video',
    collectionPath: 'videos/missing_video_id/comments/cmt_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Value poisoning with oversized title string on video update',
    collectionPath: 'videos/vid_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { title: 'x'.repeat(2000) },
  },
  {
    id: 9,
    name: 'Timestamp backdating / createdAt mutation on video update',
    collectionPath: 'videos/vid_1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
  },
  {
    id: 10,
    name: 'Unbounded tags array exhaustion on video create',
    collectionPath: 'videos/vid_tags_1',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { tags: Array.from({ length: 25 }, (_, i) => `tag${i}`) },
  },
  {
    id: 11,
    name: 'Unfiltered private video scraping via collection list',
    collectionPath: 'videos',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unauthorized comment deletion by unrelated user',
    collectionPath: 'videos/vid_1/comments/cmt_victim',
    operation: 'delete',
    expected: 'PERMISSION_DENIED',
  },
];
