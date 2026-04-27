


import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";  // Firestore instance
import { uploadPaymentReceipt } from "./uploadPaymentReceipt";
import { PaymentReleaseFormValues, PaymentReleaseSubmitArgs } from "./types";

interface ReleasePaymentOptions<T> {
  docPath: string[];
  context: T;
  formData: PaymentReleaseFormValues;
  receiptFile: File | null;
  selectedAccount?: any;
  actor: {
    uid?: string;
    email?: string | null;
    displayName?: string | null;
    profileId?: string;
  };
  buildUpdateData: (args: PaymentReleaseSubmitArgs<T>) => Record<string, any>;
}

export async function releasePayment<T>({
  docPath,
  context,
  formData,
  receiptFile,
  selectedAccount,
  actor,
  buildUpdateData,
}: ReleasePaymentOptions<T>) {
  if (!docPath?.length) {
    throw new Error("Invalid document path");
  }

  const receiptUrl = await uploadPaymentReceipt(receiptFile);

  const updateData = buildUpdateData({
    context,
    formData,
    receiptUrl,
    selectedAccount,
    actor,
  });

  // Correct way to create document reference using the `doc` function
  const docRef = doc(db, ...docPath);  // This will correctly reference a document in Firestore

  // Perform the update
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
}