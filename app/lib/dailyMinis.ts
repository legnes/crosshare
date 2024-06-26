import { getDocs, limit, query, where } from 'firebase/firestore';
import {
  DBPuzzleT,
  DBPuzzleV,
  getDateString,
  prettifyDateString,
} from './dbtypes.js';
import { getCollection } from './firebaseWrapper.js';
import { PathReporter } from './pathReporter.js';

const dailyMiniIdsByDate = new Map<string, string | null>();

export function setMiniForDate(pds: string, id: string) {
  const key = 'dmid-' + pds;
  dailyMiniIdsByDate.set(key, id);
  sessionStorage.setItem(key, id);
}

export async function getMiniIdForDate(d: Date): Promise<string | null> {
  const key = 'dmid-' + prettifyDateString(getDateString(d));
  const fromStorage = sessionStorage.getItem(key);
  if (fromStorage) {
    return fromStorage;
  }
  const existing = dailyMiniIdsByDate.get(key);
  if (existing) {
    return existing;
  }
  if (existing === null) {
    return null;
  }
  const puz = await getMiniForDate(d);
  if (puz === null) {
    dailyMiniIdsByDate.set(key, null);
    return null;
  }
  dailyMiniIdsByDate.set(key, puz.id);
  sessionStorage.setItem(key, puz.id);
  return puz.id;
}

/* This gets used client side for loading minis to show in the UpcomingMinisCalendar component.
 * The similarly named function in serverOnly.ts should only be used server side. */
async function getMiniForDate(
  d: Date
): Promise<(DBPuzzleT & { id: string }) | null> {
  const dbres = await getDocs(
    query(
      getCollection('c'),
      where('dmd', '==', prettifyDateString(getDateString(d))),
      limit(1)
    )
  );

  const doc = dbres.docs[0];
  if (!doc) {
    return null;
  }
  const validationResult = DBPuzzleV.decode(doc.data());
  if (validationResult._tag === 'Right') {
    return { ...validationResult.right, id: doc.id };
  }
  console.error('invalid puzzle ', doc.id);
  console.error(PathReporter.report(validationResult).join(','));
  return null;
}
