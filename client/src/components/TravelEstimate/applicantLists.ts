import {
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { createApplicant } from "./applicants";
import { applicantListDoc, applicantListsCol } from "./firestorePaths";
import { readApplicants, toFirestoreApplicants } from "./formModel";
import type { Applicant, LinkedApplicantList, SavedApplicantList, UserStamp } from "./types";

// Application Details saved on their own, so a group's applicants can be kept
// while the rest of the estimate is still being worked on, and loaded into
// any estimate later. Saving an estimate never changes these lists.

export const MAX_LIST_NAME_LENGTH = 100;

/** The applicants as they'd be saved, for telling whether they've changed (ids aside, as loading renews them). */
export const applicantsJson = (applicants: Applicant[]) =>
  JSON.stringify(toFirestoreApplicants(applicants).map(({ id: _id, ...applicant }) => applicant));

export class ApplicantListMissingError extends Error {
  constructor() {
    super("This saved list no longer exists.");
    this.name = "ApplicantListMissingError";
  }
}

const toDate = (value: any): Date | null => (value && typeof value.toDate === "function" ? value.toDate() : null);

function readList(id: string, data: DocumentData): SavedApplicantList {
  const user = data.updatedBy;
  return {
    id,
    name: String(data.name || "").trim() || "Untitled list",
    applicants: readApplicants(data.applicants),
    updatedAt: toDate(data.updatedAt),
    updatedBy: user && typeof user === "object" && user.uid ? { uid: String(user.uid), name: String(user.name || "") } : null,
  };
}

/** Live list of saved lists, most recently saved first. */
export function subscribeApplicantLists(
  onLists: (lists: SavedApplicantList[]) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    query(applicantListsCol(), orderBy("updatedAt", "desc")),
    (snapshot) =>
      onLists(snapshot.docs.map((docSnap) => readList(docSnap.id, docSnap.data({ serverTimestamps: "estimate" })))),
    onError,
  );
}

/**
 * Saves the applicants as a new list, or over the list `id` when given.
 * Returns the link the form keeps to that list.
 */
export async function saveApplicantList(
  { id, name, applicants }: { id?: string; name: string; applicants: Applicant[] },
  user: UserStamp,
): Promise<LinkedApplicantList> {
  const trimmed = name.trim().slice(0, MAX_LIST_NAME_LENGTH);
  const data = {
    name: trimmed,
    applicants: toFirestoreApplicants(applicants),
    applicantCount: applicants.length,
    updatedAt: serverTimestamp(),
    updatedBy: user,
  };

  let listId = id;
  if (listId) {
    try {
      await updateDoc(applicantListDoc(listId), data);
    } catch (error) {
      if ((error as FirestoreError)?.code === "not-found") throw new ApplicantListMissingError();
      throw error;
    }
  } else {
    listId = (await addDoc(applicantListsCol(), { ...data, createdAt: serverTimestamp(), createdBy: user })).id;
  }

  return { id: listId, name: trimmed, savedJson: applicantsJson(applicants) };
}

export async function deleteApplicantList(id: string): Promise<void> {
  await deleteDoc(applicantListDoc(id));
}

/** A saved list's applicants with new ids, so loading one twice can't repeat an id on the estimate. */
export const applicantsForLoading = (list: SavedApplicantList) =>
  list.applicants.map(({ id: _id, ...applicant }) => createApplicant(applicant));
