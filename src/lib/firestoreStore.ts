import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import type {
  AspectRatio,
  ProjectCategory,
  ProjectStatus,
  PromptModule,
  StudioCharacter,
  StudioProject,
  StudioPromptRecord,
  VisualStyle,
} from '../types/studio';

function toMillis(ts: unknown): number {
  if (ts instanceof Timestamp) return ts.toMillis();
  if (typeof ts === 'number') return ts;
  return Date.now();
}

export function generateSafeId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 14)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${rand}`;
}

export function sanitizeIdSegment(input: string, maxLen = 64): string {
  const clean = input.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, maxLen);
  return clean.length >= 2 ? clean : `ID_${Date.now().toString(36)}`;
}

export async function syncUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    const displayName = (user.displayName || user.email?.split('@')[0] || 'Creator').slice(0, 120);
    const email = (user.email || 'user@studio.local').slice(0, 254);
    const photoURL = (user.photoURL || '').slice(0, 1000);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        displayName,
        email,
        photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        displayName,
        email,
        photoURL,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribeProjects(
  uid: string,
  onData: (items: StudioProject[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, 'projects'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const rows: StudioProject[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerId: String(data.ownerId || uid),
            title: String(data.title || ''),
            category: (data.category || 'UGC') as ProjectCategory,
            description: String(data.description || ''),
            aspectRatio: (data.aspectRatio || '9:16') as AspectRatio,
            targetPlatform: String(data.targetPlatform || ''),
            status: (data.status || 'draft') as ProjectStatus,
            createdAtMs: toMillis(data.createdAt),
            updatedAtMs: toMillis(data.updatedAt),
          };
        })
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onData(rows);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'projects');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function createProjectDoc(
  uid: string,
  input: {
    title: string;
    category: ProjectCategory;
    description: string;
    aspectRatio: AspectRatio;
    targetPlatform: string;
    status?: ProjectStatus;
  }
): Promise<string> {
  const id = generateSafeId('proj');
  const path = `projects/${id}`;
  try {
    await setDoc(doc(db, 'projects', id), {
      ownerId: uid,
      title: input.title.trim().slice(0, 140),
      category: input.category,
      description: input.description.trim().slice(0, 1200),
      aspectRatio: input.aspectRatio,
      targetPlatform: input.targetPlatform.trim().slice(0, 80),
      status: input.status || 'draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateProjectDoc(
  projectId: string,
  input: {
    title?: string;
    category?: ProjectCategory;
    description?: string;
    aspectRatio?: AspectRatio;
    targetPlatform?: string;
    status?: ProjectStatus;
  }
): Promise<void> {
  const path = `projects/${projectId}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (input.title !== undefined) payload.title = input.title.trim().slice(0, 140);
  if (input.category !== undefined) payload.category = input.category;
  if (input.description !== undefined) payload.description = input.description.trim().slice(0, 1200);
  if (input.aspectRatio !== undefined) payload.aspectRatio = input.aspectRatio;
  if (input.targetPlatform !== undefined)
    payload.targetPlatform = input.targetPlatform.trim().slice(0, 80);
  if (input.status !== undefined) payload.status = input.status;

  try {
    await updateDoc(doc(db, 'projects', projectId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteProjectDoc(projectId: string): Promise<void> {
  const path = `projects/${projectId}`;
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeCharacters(
  uid: string,
  onData: (items: StudioCharacter[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, 'characters'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const rows: StudioCharacter[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerId: String(data.ownerId || uid),
            projectId: String(data.projectId || ''),
            name: String(data.name || ''),
            archetype: String(data.archetype || ''),
            visualStyle: (data.visualStyle || 'Photorealistic') as VisualStyle,
            faceDescription: String(data.faceDescription || ''),
            hairAndWardrobe: String(data.hairAndWardrobe || ''),
            bodyAndTraits: String(data.bodyAndTraits || ''),
            signatureOutfit: String(data.signatureOutfit || ''),
            consistencyCode: String(data.consistencyCode || ''),
            identityLocked: Boolean(data.identityLocked),
            identityLockPrompt: String(data.identityLockPrompt || ''),
            referenceImageUrl: String(data.referenceImageUrl || ''),
            createdAtMs: toMillis(data.createdAt),
            updatedAtMs: toMillis(data.updatedAt),
          };
        })
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onData(rows);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'characters');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function createCharacterDoc(
  uid: string,
  input: Omit<StudioCharacter, 'id' | 'ownerId' | 'createdAtMs' | 'updatedAtMs'>
): Promise<string> {
  const id = generateSafeId('char');
  const path = `characters/${id}`;
  try {
    await setDoc(doc(db, 'characters', id), {
      ownerId: uid,
      projectId: input.projectId ? sanitizeIdSegment(input.projectId, 128) : '',
      name: input.name.trim().slice(0, 100),
      archetype: (input.archetype.trim() || 'Virtual Creator').slice(0, 100),
      visualStyle: input.visualStyle,
      faceDescription: input.faceDescription.trim().slice(0, 800),
      hairAndWardrobe: input.hairAndWardrobe.trim().slice(0, 800),
      bodyAndTraits: input.bodyAndTraits.trim().slice(0, 800),
      signatureOutfit: input.signatureOutfit.trim().slice(0, 500),
      consistencyCode: sanitizeIdSegment(
        input.consistencyCode || `JAJA_${input.name.toUpperCase()}`,
        64
      ),
      identityLocked: Boolean(input.identityLocked),
      identityLockPrompt: input.identityLockPrompt.trim().slice(0, 3000),
      referenceImageUrl: input.referenceImageUrl.trim().slice(0, 2000),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateCharacterDoc(
  characterId: string,
  input: Partial<Omit<StudioCharacter, 'id' | 'ownerId' | 'createdAtMs' | 'updatedAtMs'>>
): Promise<void> {
  const path = `characters/${characterId}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (input.projectId !== undefined)
    payload.projectId = input.projectId ? sanitizeIdSegment(input.projectId, 128) : '';
  if (input.name !== undefined) payload.name = input.name.trim().slice(0, 100);
  if (input.archetype !== undefined)
    payload.archetype = (input.archetype.trim() || 'Virtual Creator').slice(0, 100);
  if (input.visualStyle !== undefined) payload.visualStyle = input.visualStyle;
  if (input.faceDescription !== undefined)
    payload.faceDescription = input.faceDescription.trim().slice(0, 800);
  if (input.hairAndWardrobe !== undefined)
    payload.hairAndWardrobe = input.hairAndWardrobe.trim().slice(0, 800);
  if (input.bodyAndTraits !== undefined)
    payload.bodyAndTraits = input.bodyAndTraits.trim().slice(0, 800);
  if (input.signatureOutfit !== undefined)
    payload.signatureOutfit = input.signatureOutfit.trim().slice(0, 500);
  if (input.consistencyCode !== undefined)
    payload.consistencyCode = sanitizeIdSegment(input.consistencyCode, 64);
  if (input.identityLocked !== undefined) payload.identityLocked = Boolean(input.identityLocked);
  if (input.identityLockPrompt !== undefined)
    payload.identityLockPrompt = input.identityLockPrompt.trim().slice(0, 3000);
  if (input.referenceImageUrl !== undefined)
    payload.referenceImageUrl = input.referenceImageUrl.trim().slice(0, 2000);

  try {
    await updateDoc(doc(db, 'characters', characterId), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteCharacterDoc(characterId: string): Promise<void> {
  const path = `characters/${characterId}`;
  try {
    await deleteDoc(doc(db, 'characters', characterId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribePrompts(
  uid: string,
  onData: (items: StudioPromptRecord[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, 'prompts'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const rows: StudioPromptRecord[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerId: String(data.ownerId || uid),
            projectId: String(data.projectId || ''),
            characterId: String(data.characterId || ''),
            module: (data.module || 'prompt_lab') as PromptModule,
            title: String(data.title || ''),
            promptText: String(data.promptText || ''),
            secondaryOutput: String(data.secondaryOutput || ''),
            tags: Array.isArray(data.tags) ? data.tags.map(String).slice(0, 10) : [],
            createdAtMs: toMillis(data.createdAt),
            updatedAtMs: toMillis(data.updatedAt),
          };
        })
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onData(rows);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'prompts');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function createPromptDoc(
  uid: string,
  input: {
    projectId?: string;
    characterId?: string;
    module: PromptModule;
    title: string;
    promptText: string;
    secondaryOutput?: string;
    tags?: string[];
  }
): Promise<string> {
  const id = generateSafeId('prm');
  const path = `prompts/${id}`;
  const safeTags = (input.tags || [])
    .map((t) => t.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 10);

  try {
    await setDoc(doc(db, 'prompts', id), {
      ownerId: uid,
      projectId: input.projectId ? sanitizeIdSegment(input.projectId, 128) : '',
      characterId: input.characterId ? sanitizeIdSegment(input.characterId, 128) : '',
      module: input.module,
      title: (input.title.trim() || 'Prompt Studio').slice(0, 160),
      promptText: input.promptText.trim().slice(0, 12000),
      secondaryOutput: (input.secondaryOutput || '').trim().slice(0, 12000),
      tags: safeTags,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function deletePromptDoc(promptId: string): Promise<void> {
  const path = `prompts/${promptId}`;
  try {
    await deleteDoc(doc(db, 'prompts', promptId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
