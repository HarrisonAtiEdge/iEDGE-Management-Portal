// export interface Estimate {
//     id?: string; 
//   estimateNo: string;
//   client: string;
//   date: string;
//   expiryDate: string;
//   projectOwner: string;
//   services: { detail: string; description?: string; units: number; rate: number }[];
//   // services: ServiceItem[];
//   subtotal: number;
//   tax: number;
//   poNumber?: string;
//   subject?: string;
//   total: number;
//   paymentTerm: string;
//   company: string;
//   taxType: string;
//   taxPercent: number;
//   taxCategory?: string;
//   message?: string;
//   address?: string;
//   info?: string;
//   editCount?: number;
// }

export type EstimateStatus =
  | "RFQ Sent"
  | "Approved"
  | "Rejected"
  | "Project Cancelled"
  | "Invoiced"
  | "Payment Received"
  | "PO Received";


export interface Estimate {
  id?: string;
  estimateNo: string;
  client: string;
  date: string;
  expiryDate: string;
  projectOwner: string;
  services: { detail: string; description?: string; units: number; rate: number }[];
  subtotal: number;
  tax: number;
  poNumber?: string;
  subject?: string;
  total: number;
  paymentTerm: string;
  company: string;
  taxType: string;
  taxPercent: number;
  taxCategory?: string;
  message?: string;
  address?: string;
  info?: string;
  editCount?: number;
  createdBy: string;
  termsCondition?: string;
  status?: EstimateStatus;
  // Set on copies made when editing; the original keeps its own number.
  copyOfEstimateId?: string;
  copyOfEstimateNo?: string;
  copyNumber?: number;
  copyPurpose?: "revision" | "invoice";
}
