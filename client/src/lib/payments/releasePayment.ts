// import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
// import { db } from "@/lib/firebase";  // Firestore instance
// import { uploadPaymentReceipt } from "./uploadPaymentReceipt";
// import { PaymentReleaseFormValues, PaymentReleaseSubmitArgs } from "./types";

// interface ReleasePaymentOptions<T> {
//   docPath: string[];
//   context: T;
//   formData: PaymentReleaseFormValues;
//   receiptFile: File | null;
//   selectedAccount?: any;
//   actor: {
//     uid?: string;
//     email?: string | null;
//     displayName?: string | null;
//     profileId?: string;
//   };
//   buildUpdateData: (args: PaymentReleaseSubmitArgs<T>) => Record<string, any>;
// }

// export async function releasePayment<T>({
//   docPath,
//   context,
//   formData,
//   receiptFile,
//   selectedAccount,
//   actor,
//   buildUpdateData,
// }: ReleasePaymentOptions<T>) {
//   if (!docPath?.length) {
//     throw new Error("Invalid document path");
//   }

//   const receiptUrl = await uploadPaymentReceipt(receiptFile);

//   const updateData = buildUpdateData({
//     context,
//     formData,
//     receiptUrl,
//     selectedAccount,
//     actor,
//   });

//   // Correct way to create document reference using the `doc` function
//   const docRef = doc(db, ...docPath);  // This will correctly reference a document in Firestore

//   // Perform the update
//   await updateDoc(docRef, {
//     ...updateData,
//     updatedAt: serverTimestamp(),
//   });
// }

import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadPaymentReceipt } from "./uploadPaymentReceipt";
import { PaymentReleaseFormValues, PaymentReleaseSubmitArgs } from "./types";

interface UploadedReceiptFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface ReleasePaymentOptions<T> {
  docPath: string[];
  context: T;
  formData: PaymentReleaseFormValues & {
    chequeNumbers?: string[];
  };

  // Old single-file support
  receiptFile?: File | null;

  // New multiple-file support
  receiptFiles?: File[];

  selectedAccount?: any;

  actor: {
    uid?: string;
    email?: string | null;
    displayName?: string | null;
    profileId?: string;
  };

  buildUpdateData: (
    args: PaymentReleaseSubmitArgs<T> & {
      receiptUrls?: string[];
      receiptFiles?: UploadedReceiptFile[];
    },
  ) => Record<string, any>;
}

function getUniqueFiles(receiptFile?: File | null, receiptFiles: File[] = []) {
  const map = new Map<string, File>();

  if (receiptFile) {
    map.set(
      `${receiptFile.name}-${receiptFile.size}-${receiptFile.lastModified}`,
      receiptFile,
    );
  }

  receiptFiles.forEach((file) => {
    if (!file) return;

    map.set(`${file.name}-${file.size}-${file.lastModified}`, file);
  });

  return Array.from(map.values());
}

export async function releasePayment<T>({
  docPath,
  context,
  formData,
  receiptFile = null,
  receiptFiles = [],
  selectedAccount,
  actor,
  buildUpdateData,
}: ReleasePaymentOptions<T>) {
  if (!docPath?.length) {
    throw new Error("Invalid document path");
  }

  if (docPath.length % 2 !== 0) {
    throw new Error(
      "Invalid Firestore document path. The path must point to a document.",
    );
  }

  const allReceiptFiles = getUniqueFiles(receiptFile, receiptFiles);

  const uploadedReceiptFiles: UploadedReceiptFile[] = [];

  for (const file of allReceiptFiles) {
    const url = await uploadPaymentReceipt(file);

    if (url) {
      uploadedReceiptFiles.push({
        name: file.name,
        url,
        size: file.size,
        type: file.type || "application/octet-stream",
      });
    }
  }

  const receiptUrls = uploadedReceiptFiles.map((file) => file.url);
  const receiptUrl = receiptUrls[0] || "";

  const updateData = buildUpdateData({
    context,
    formData,
    receiptUrl,
    receiptUrls,
    receiptFiles: uploadedReceiptFiles,
    selectedAccount,
    actor,
  } as any);

  const finalUpdateData: Record<string, any> = {
    ...updateData,
    updatedAt: serverTimestamp(),
  };

  if (receiptUrls.length > 0) {
    finalUpdateData.paymentDetails = {
      ...(updateData.paymentDetails || {}),

      // Old single receipt support
      bankReceiptUrl: receiptUrl,

      // New multiple receipt support
      bankReceiptUrls: receiptUrls,

      // Extra support for your Budget Details page
      receiptUrl,
      receiptUrls,
      receiptFiles: uploadedReceiptFiles,
      uploadedFiles: uploadedReceiptFiles,
    };
  }

  const docRef = doc(db, ...docPath);

  await updateDoc(docRef, finalUpdateData);

  return {
    receiptUrl,
    receiptUrls,
    receiptFiles: uploadedReceiptFiles,
  };
}
