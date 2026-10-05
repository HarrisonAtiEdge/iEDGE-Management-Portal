// Cheque numbers are stored under many field names (and as "reference" values
// on payments), both on a document and inside nested payment objects. These
// helpers collect them all so cheque lookups agree across modules.

export const normalizeChequeNumber = (value: any): string => {
  if (value === undefined || value === null || typeof value === "object") {
    return "";
  }

  return String(value).trim().toLowerCase();
};

const getStringListFromValue = (value: any): string[] => {
  if (value === undefined || value === null) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => getStringListFromValue(item));
  }

  if (typeof value === "object") return [];

  return String(value)
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const uniqueStringList = (values: string[]): string[] => {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = normalizeChequeNumber(value);

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

export const getChequeNumbersFromSource = (source: any): string[] => {
  if (!source) return [];

  const chequeNumbers = [
    ...getStringListFromValue(source?.reference),
    ...getStringListFromValue(source?.Reference),
    ...getStringListFromValue(source?.paymentReference),
    ...getStringListFromValue(source?.paymentRef),
    ...getStringListFromValue(source?.refNo),
    ...getStringListFromValue(source?.referenceNo),
    ...getStringListFromValue(source?.transactionReference),

    ...getStringListFromValue(source?.chequeNumber),
    ...getStringListFromValue(source?.chequeNumbers),
    ...getStringListFromValue(source?.chequeNo),
    ...getStringListFromValue(source?.checkNumber),
    ...getStringListFromValue(source?.checkNo),
    ...getStringListFromValue(source?.bankChequeNumber),
    ...getStringListFromValue(source?.paymentChequeNumber),
    ...getStringListFromValue(source?.receivedChequeNumber),

    ...getStringListFromValue(source?.paymentDetails?.reference),
    ...getStringListFromValue(source?.paymentDetails?.Reference),
    ...getStringListFromValue(source?.paymentDetails?.paymentReference),
    ...getStringListFromValue(source?.paymentDetails?.paymentRef),
    ...getStringListFromValue(source?.paymentDetails?.refNo),
    ...getStringListFromValue(source?.paymentDetails?.referenceNo),
    ...getStringListFromValue(source?.paymentDetails?.transactionReference),
    ...getStringListFromValue(source?.paymentDetails?.chequeNumber),
    ...getStringListFromValue(source?.paymentDetails?.chequeNumbers),
    ...getStringListFromValue(source?.paymentDetails?.chequeNo),
    ...getStringListFromValue(source?.paymentDetails?.checkNumber),
    ...getStringListFromValue(source?.paymentDetails?.checkNo),

    ...getStringListFromValue(source?.accountDetails?.reference),
    ...getStringListFromValue(source?.accountDetails?.Reference),
    ...getStringListFromValue(source?.accountDetails?.paymentReference),
    ...getStringListFromValue(source?.accountDetails?.paymentRef),
    ...getStringListFromValue(source?.accountDetails?.refNo),
    ...getStringListFromValue(source?.accountDetails?.referenceNo),
    ...getStringListFromValue(source?.accountDetails?.transactionReference),
    ...getStringListFromValue(source?.accountDetails?.chequeNumber),
    ...getStringListFromValue(source?.accountDetails?.chequeNumbers),
    ...getStringListFromValue(source?.accountDetails?.chequeNo),
    ...getStringListFromValue(source?.accountDetails?.checkNumber),
    ...getStringListFromValue(source?.accountDetails?.checkNo),

    ...getStringListFromValue(source?.bankDetails?.reference),
    ...getStringListFromValue(source?.bankDetails?.Reference),
    ...getStringListFromValue(source?.bankDetails?.paymentReference),
    ...getStringListFromValue(source?.bankDetails?.paymentRef),
    ...getStringListFromValue(source?.bankDetails?.refNo),
    ...getStringListFromValue(source?.bankDetails?.referenceNo),
    ...getStringListFromValue(source?.bankDetails?.transactionReference),
    ...getStringListFromValue(source?.bankDetails?.chequeNumber),
    ...getStringListFromValue(source?.bankDetails?.chequeNumbers),
    ...getStringListFromValue(source?.bankDetails?.chequeNo),
    ...getStringListFromValue(source?.bankDetails?.checkNumber),
    ...getStringListFromValue(source?.bankDetails?.checkNo),

    ...getStringListFromValue(source?.receivePayment?.reference),
    ...getStringListFromValue(source?.receivePayment?.Reference),
    ...getStringListFromValue(source?.receivePayment?.paymentReference),
    ...getStringListFromValue(source?.receivePayment?.paymentRef),
    ...getStringListFromValue(source?.receivePayment?.refNo),
    ...getStringListFromValue(source?.receivePayment?.referenceNo),
    ...getStringListFromValue(source?.receivePayment?.transactionReference),
    ...getStringListFromValue(source?.receivePayment?.chequeNumber),
    ...getStringListFromValue(source?.receivePayment?.chequeNumbers),
    ...getStringListFromValue(source?.receivePayment?.chequeNo),
    ...getStringListFromValue(source?.receivePayment?.checkNumber),
    ...getStringListFromValue(source?.receivePayment?.checkNo),

    ...getStringListFromValue(source?.latestPaymentRelease?.reference),
    ...getStringListFromValue(source?.latestPaymentRelease?.paymentReference),
    ...getStringListFromValue(source?.latestPaymentRelease?.paymentRef),
    ...getStringListFromValue(source?.latestPaymentRelease?.refNo),
    ...getStringListFromValue(source?.latestPaymentRelease?.referenceNo),
    ...getStringListFromValue(
      source?.latestPaymentRelease?.transactionReference,
    ),
    ...getStringListFromValue(source?.latestPaymentRelease?.chequeNumber),
    ...getStringListFromValue(source?.latestPaymentRelease?.chequeNumbers),
    ...getStringListFromValue(source?.latestPaymentRelease?.chequeNo),
    ...getStringListFromValue(source?.latestPaymentRelease?.checkNumber),
    ...getStringListFromValue(source?.latestPaymentRelease?.checkNo),
  ];

  return uniqueStringList(chequeNumbers);
};

export const getChequeNumbersFromPaymentReleaseHistory = (
  source: any,
): string[] => {
  const history = Array.isArray(source?.paymentReleaseHistory)
    ? source.paymentReleaseHistory
    : [];

  return uniqueStringList(
    history.flatMap((entry: any) => getChequeNumbersFromSource(entry)),
  );
};

// Every cheque number on a document, including its payment release history.
export const getAllChequeNumbers = (source: any): string[] => {
  return uniqueStringList([
    ...getChequeNumbersFromSource(source),
    ...getChequeNumbersFromPaymentReleaseHistory(source),
  ]);
};
