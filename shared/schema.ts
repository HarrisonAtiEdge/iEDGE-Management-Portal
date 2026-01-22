import { z } from "zod";

// User roles enum
export const UserRole = z.enum([
  "operation",
  "finance", 
  "operational_admin",
  "financial_admin",
  "main_admin",
  "sales"
]);

export type UserRole = z.infer<typeof UserRole>;

// User account status
export const AccountStatus = z.enum([
  "pending",
  "approved", 
  "rejected"
]);

export type AccountStatus = z.infer<typeof AccountStatus>;

// Invoice status enum
export const InvoiceStatus = z.enum([
  "draft",
  "pending_operational_admin",
  "pending_main_admin", 
  "pending_finance",
  "approved",
  "rejected",
  "payment_released"
]);

export type InvoiceStatus = z.infer<typeof InvoiceStatus>;

// Expense sheet status
export const ExpenseStatus = z.enum([
  "draft",
  "pending_operational_admin",
  "pending_main_admin",
  "approved",
  "acknowledged",
  "rejected"
]);

export type ExpenseStatus = z.infer<typeof ExpenseStatus>;

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: UserRole,
  accountStatus: AccountStatus,
  createdAt: z.date(),
  updatedAt: z.date()
});

export const insertUserSchema = userSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Invoice request schema
export const invoiceRequestSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  clientName: z.string(),
  project: z.string(),
  lineItems: z.array(z.object({
    id: z.number(),
    vendor: z.string(),
    description: z.string(),
    quantity: z.string(),
    unitPrice: z.string(),
    amount: z.number()
  })),
  totalAmount: z.number(),
  comment: z.string().optional(),
  supportingDocuments: z.array(z.string()).optional(),
  status: InvoiceStatus,
  currentApprover: z.string().optional(),
  submittedBy: z.string(),
  submittedAt: z.date(),
  approvalHistory: z.array(z.object({
    approver: z.string(),
    action: z.enum(["approved", "rejected"]),
    timestamp: z.date(),
    notes: z.string().optional()
  })).optional(),
  paymentDetails: z.object({
    paymentMethod: z.string(),
    transactionReference: z.string(),
    bankReceiptUrl: z.string(),
    paymentNotes: z.string().optional(),
    releasedBy: z.string(),
    releasedAt: z.date()
  }).optional()
});

export const insertInvoiceRequestSchema = invoiceRequestSchema.omit({
  id: true,
  submittedAt: true,
  status: true
}).extend({
  status: InvoiceStatus.optional().default("draft")
});

export type InvoiceRequest = z.infer<typeof invoiceRequestSchema>;
export type InsertInvoiceRequest = z.infer<typeof insertInvoiceRequestSchema>;

// Expense sheet schema
export const expenseSheetSchema = z.object({
  id: z.string(),
  linkedRequestId: z.string().optional(),
  clientName: z.string(),
  project: z.string(),
  comment: z.string().optional(),
  expenseItems: z.array(z.object({
    id: z.number(),
    vendor: z.string(),
    description: z.string(),
    quantity: z.string(),
    unitPrice: z.string(),
    amount: z.number()
  })),
  totalAmount: z.number(),
  expenseDocuments: z.array(z.string()).optional(),
  status: ExpenseStatus,
  currentApprover: z.string().optional(),
  submittedBy: z.string(),
  submittedAt: z.date(),
  approvalHistory: z.array(z.object({
    approver: z.string(),
    action: z.enum(["approved", "rejected"]),
    timestamp: z.date(),
    notes: z.string().optional()
  })).optional(),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.date().optional(),
  acknowledgmentNotes: z.string().optional()
});

export const insertExpenseSheetSchema = expenseSheetSchema.omit({
  id: true,
  submittedAt: true,
  status: true
}).extend({
  status: ExpenseStatus.optional().default("draft")
});

export type ExpenseSheet = z.infer<typeof expenseSheetSchema>;
export type InsertExpenseSheet = z.infer<typeof insertExpenseSheetSchema>;

// Activity log schema for audit trail
export const activityLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  action: z.string(),
  entityType: z.enum(["invoice", "expense", "user"]),
  entityId: z.string(),
  details: z.record(z.any()),
  timestamp: z.date()
});

export const insertActivityLogSchema = activityLogSchema.omit({
  id: true,
  timestamp: true
});

export type ActivityLog = z.infer<typeof activityLogSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Bank account schemas
export const chequeAccountSchema = z.object({
  id: z.string(),
  accountTitle: z.string(),
  accountNo: z.string(),
  bank: z.string(),
  branch: z.string(),
  city: z.string(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean().default(true)
});

export const insertChequeAccountSchema = chequeAccountSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type ChequeAccount = z.infer<typeof chequeAccountSchema>;
export type InsertChequeAccount = z.infer<typeof insertChequeAccountSchema>;

// Online account schema
export const onlineAccountSchema = z.object({
  id: z.string(),
  accountTitle: z.string(),
  accountNo: z.string(),
  bank: z.string(),
  platform: z.string(), // e.g., "Internet Banking", "Mobile App"
  routingNumber: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean().default(true)
});

export const insertOnlineAccountSchema = onlineAccountSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type OnlineAccount = z.infer<typeof onlineAccountSchema>;
export type InsertOnlineAccount = z.infer<typeof insertOnlineAccountSchema>;

// Sales record status enum
export const SalesStatus = z.enum([
  "Lead",
  "Discussion",
  "Negotiation", 
  "Won",
  "Lost",
  "Invoiced",
  "Payment Received"
]);

export type SalesStatus = z.infer<typeof SalesStatus>;

// Sales record schema
export const salesRecordSchema = z.object({
  id: z.string(),
  client: z.string(),
  contactPerson: z.string(),
  contactMobile: z.string().optional(),
  projectCode: z.string(),
  projectName: z.string(),
  estimateNumber: z.string(),
  invoiceNumber: z.string(),
  paymentRef: z.string(),
  projectValue: z.number().optional(), // Keep for backward compatibility
  projectedValue: z.number().default(0),
  wonValue: z.number().optional().default(0),
  visit: z.boolean().default(false),
  needHelp: z.boolean().default(false),
  goal: z.string().optional(),
  actionItems: z.array(z.string()).default([]),
  nextFollowUp: z.object({
    date: z.date().nullable().optional(),
    actionItems: z.array(z.string()).default([])
  }).optional(),
  startDate: z.date().optional(),
  dayPlanSummary: z.object({
    days: z.number().default(0),
    visits: z.number().default(0),
    lastUpdated: z.date()
  }).optional(),
  projectStatus: SalesStatus,
  salesPersonId: z.string(),
  salesPersonName: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  attachments: z.array(z.string()).optional(),
  comments: z.array(z.object({
    text: z.string(),
    timestamp: z.date(),
    userName: z.string().optional()
  })).optional(),
});

export const insertSalesRecordSchema = salesRecordSchema.omit({
  id: true,
  salesPersonId: true,
  salesPersonName: true,
  createdAt: true,
  updatedAt: true,
  projectValue: true // Exclude deprecated field
});

export type SalesRecord = z.infer<typeof salesRecordSchema>;
export type InsertSalesRecord = z.infer<typeof insertSalesRecordSchema>;

// Notification types enum
export const NotificationType = z.enum([
  "record_update",
  "comment", 
  "need_help",
  "meeting_update"
]);

export type NotificationType = z.infer<typeof NotificationType>;

// Meeting update schema for subcollection meetingUpdates
export const meetingUpdateSchema = z.object({
  id: z.string(),
  recordId: z.string(),
  meetingDate: z.string(), // YYYY-MM-DD format for the actual meeting date
  discussionNotes: z.string().default(''), // What was discussed in the meeting
  actionItems: z.array(z.string()).default([]),
  visit: z.boolean().default(false), // Whether this was an in-person visit
  createdById: z.string(),
  createdByName: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const insertMeetingUpdateSchema = meetingUpdateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type MeetingUpdate = z.infer<typeof meetingUpdateSchema>;
export type InsertMeetingUpdate = z.infer<typeof insertMeetingUpdateSchema>;

// Meeting update comment schema for subcollection meetingUpdates/{updateId}/comments  
export const meetingUpdateCommentSchema = z.object({
  id: z.string(),
  meetingUpdateId: z.string(),
  text: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorRole: UserRole,
  createdAt: z.date()
});

export const insertMeetingUpdateCommentSchema = meetingUpdateCommentSchema.omit({
  id: true,
  createdAt: true
});

export type MeetingUpdateComment = z.infer<typeof meetingUpdateCommentSchema>;
export type InsertMeetingUpdateComment = z.infer<typeof insertMeetingUpdateCommentSchema>;

// Notification schema
export const notificationSchema = z.object({
  id: z.string(),
  recipientId: z.string(),
  type: NotificationType,
  recordId: z.string(),
  meetingUpdateId: z.string().optional(),
  message: z.string(),
  createdById: z.string(),
  createdByName: z.string(),
  createdAt: z.date(),
  read: z.boolean().default(false)
});

export const insertNotificationSchema = notificationSchema.omit({
  id: true,
  createdAt: true
});

export type Notification = z.infer<typeof notificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Helper function to convert Firestore Timestamp to Date
function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value.toDate && typeof value.toDate === 'function') return value.toDate();
  return new Date(value);
}

// Helper function to handle backward compatibility for projectValue -> projectedValue
export function mapSalesRecordForBackwardCompatibility(record: any): SalesRecord {
  const nextFollowUp = record.nextFollowUp ? {
    date: record.nextFollowUp.date ? toDate(record.nextFollowUp.date) : null,
    actionItems: record.nextFollowUp.actionItems ?? []
  } : { date: null, actionItems: [] };

  const dayPlanSummary = record.dayPlanSummary ? {
    days: record.dayPlanSummary.days ?? 0,
    visits: record.dayPlanSummary.visits ?? 0,
    lastUpdated: toDate(record.dayPlanSummary.lastUpdated)
  } : { days: 0, visits: 0, lastUpdated: new Date() };

  return {
    ...record,
    projectedValue: record.projectedValue ?? record.projectValue ?? 0,
    projectValue: record.projectValue,
    wonValue: record.wonValue ?? 0,
    visit: record.visit ?? false,
    needHelp: record.needHelp ?? false,
    goal: record.goal ?? "",
    actionItems: record.actionItems ?? [],
    nextFollowUp,
    contactMobile: record.contactMobile ?? "",
    startDate: toDate(record.startDate ?? record.createdAt),
    dayPlanSummary,
    createdAt: toDate(record.createdAt),
    updatedAt: toDate(record.updatedAt),
    comments: record.comments?.map((comment: any) => ({
      ...comment,
      timestamp: toDate(comment.timestamp)
    })) ?? []
  };
}

// Helper function to normalize MeetingUpdate from Firestore
export function normalizeMeetingUpdate(meetingUpdate: any): MeetingUpdate {
  return {
    ...meetingUpdate,
    createdAt: toDate(meetingUpdate.createdAt),
    updatedAt: toDate(meetingUpdate.updatedAt)
  };
}

// Helper function to normalize MeetingUpdateComment from Firestore
export function normalizeMeetingUpdateComment(comment: any): MeetingUpdateComment {
  return {
    ...comment,
    createdAt: toDate(comment.createdAt)
  };
}

// Helper function to normalize Notification from Firestore
export function normalizeNotification(notification: any): Notification {
  return {
    ...notification,
    createdAt: toDate(notification.createdAt)
  };
}
