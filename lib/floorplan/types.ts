/** Shared domain contracts for the API and dashboards. Monetary values use minor units. */
export type Role = "admin" | "manager" | "salesman" | "exhibitor";
export type Currency = "BDT" | "USD";
export interface Account {
  otpVerifiedAt?: string;
  email?: string;
  phone?: string;
  preferredLanguage?: string;
  joinedAt?: string;
  id: string;
  name: string;
  role: Role;
  companyId?: string;
  managerId?: string;
  editions: string[];
  status: string;
  commission: number;
  targets?: Record<string, number>;
  monthlyTargets?: Record<string,Record<string,number>>;
  avatar?: string;
  /** Agreed monthly base salary, independent of sales commission; integer minor units. */
  /** Simulated availability and historical closed opportunities, never device telemetry. */
  presence?: "online" | "offline";
  salesHistory?: { won: number; closed: number };
  salary?: { amount: number; currency: Currency; effectiveFrom: string };
}
export interface Edition {
  editionNumber?: number;
  scheduleBasis?: string;
  id: string;
  series: string;
  name: string;
  year: number;
  date: string;
  status: "sales-open" | "preparation" | "live" | "completed" | "draft";
  currency: Currency;
  target: number;
}
export interface Hall {
  draft?: boolean;
  physicalHallId?: string;
  /** Server read projection: total reserved capacity without other clients' identities. */
  usage?: Record<"power"|"air"|"water"|"backup",number>;
  id: string;
  editionId: string;
  name: string;
  width: number;
  height: number;
  preset: string;
  power: number;
  air: number;
  water: number;
  backup: number;
  voltage: number;
  phase: number;
  pressure: number;
}
export interface UtilitySource {
  id: string;
  editionId: string;
  name: string;
  kind: "power" | "air" | "water" | "backup";
  capacity: number;
  hallIds: string[];
  upstreamId?: string;
  status: "Available" | "Unavailable";
}
export interface Zone {
  id: string;
  hallId: string;
  name: string;
  power: number;
  air: number;
  water: number;
  backup: number;
}
export interface Stall {
  /** Local metric polygon for composite BITMA allocations; rectangles omit it. */
  footprintPoints?: { x: number; y: number }[];
  sourceLabel?: string;
  categoryZoneId?: string;
  /** Printed reference annotation, independent of booking ownership. */
  displayLabel?: string;
  dimensionLabel?: string;
  /** Presentation only; booking state always overrides this color. */
  color?: string;
  locked?: boolean;
  groupId?: string;
  physicalSpaceId?: string;
  /** Server read projection: anonymous occupancy, independent from private company scope. */
  occupancy?: "available"|"held"|"confirmed";
  id: string;
  editionId: string;
  hallId: string;
  zone: string;
  code: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  price: number;
  type: "stall" | "service" | "decoration";
  placed: boolean;
  power: number;
  air: boolean;
  water: boolean;
  loading: number;
  clearance: number;
}
export interface Company {
  legalName?: string;
  registrationNumber?: string;
  taxNumber?: string;
  billingAddress?: string;
  billingEmail?: string;
  logoImageId?: string;
  contactName?: string;
  phone?: string;
  preferredLanguage?: string;
  preferredContactMethod?: string;
  products?: string;
  serviceNeeds?: string;
  id: string;
  name: string;
  country: string;
  email: string;
  website: string;
  address: string;
  category: string;
}
export interface Participation {
  /** First recorded enquiry date; absent legacy dates are not inferred. */
  createdAt?: string;
  id: string;
  companyId: string;
  editionId: string;
  sellerId: string;
  stage: string;
  stallIds: string[];
  booking: "interested" | "held" | "confirmed" | "cancelled" | "expired";
  expiresAt?: string;
  pausedAt?: string;
  pauseReason?: string;
  reviewDeadline?: string;
  technicalRevision: number;
  approvedRevision?: number;
}
export interface RequirementField {
  key: string;
  label: string;
  section: string;
  help: string;
  units?: string[];
  required?: boolean;
  machinery?: boolean;
  numeric?: boolean;
}
export interface TechnicalSubmission {
  imageIds?: string[];
  id: string;
  participationId: string;
  revision: number;
  status:
    | "draft"
    | "submitted"
    | "under-review"
    | "changes-requested"
    | "approved"
    | "declined";
  values: Record<string, string>;
  units: Record<string, string>;
  notes: string;
  reviewer?: string;
  confirmed: boolean;
  at: string;
}
export interface Allocation {
  id: string;
  participationId: string;
  hallId: string;
  zone: string;
  power: number;
  air: number;
  water: number;
  backup: number;
  status:
    | "reserved"
    | "scheduled"
    | "installing"
    | "ready"
    | "blocked"
    | "removed";
  owner: string;
  notes: string;
}
export interface Quote {
  /** Quote creation timestamp, independent of payment dates. */
  at?: string;
  id: string;
  participationId: string;
  amount: number;
  discount: number;
  charges: number;
  currency: Currency;
  depositPercent: number;
  status: "draft" | "approval-requested" | "approved";
  sellerId: string;
  approvedBy?: string;
}
export interface PaymentRequest {
  id: string;
  quoteId: string;
  participationId: string;
  method: string;
  at: string;
  templateId?: string;
  requestedAmount?: number;
  instructions?: string;
}
export interface Payment {
  bankName?: string;
  accountNumber?: string;
  submissionNotes?: string;
  id: string;
  participationId: string;
  quoteId?: string;
  amount: number;
  currency: Currency;
  method: string;
  reference: string;
  payer: string;
  at: string;
  status: "pending" | "verified" | "rejected" | "reversed";
  sellerId: string;
  commissionRate?: number;
  notes: string;
  attachment?: string;
}
export interface Receipt {
  id: string;
  paymentId: string;
  companyName: string;
  editionName: string;
  amount: number;
  currency: Currency;
  reference: string;
  issuedAt: string;
  token: string;
  status: "valid" | "revoked";
  delivered: boolean;
  patternImageId?: string;
}
export interface Expense {
  id: string;
  description: string;
  category: string;
  vendor: string;
  currency: Currency;
  budget: number;
  actual: number;
  paid: number;
  at: string;
  allocations: Record<string, number>;
  notes: string;
  /** Optional supplier invoice and payment deadline, independent of cost recognition date. */
  invoiceReference?: string;
  dueDate?: string;
  attachment?: string;
  payrollEmployeeId?: string;
  payrollMonth?: string;
}
export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  source: string;
  editions: string[];
  owner: string;
  stage: string;
  notes: string;
  at: string;
  companyId?: string;
}
export interface Message {
  language?: string;
  translations?: {language:string;text:string;provider:string}[];
  id: string;
  participationId: string;
  senderId: string;
  text: string;
  at: string;
  deletedAt?: string;
  deletedBy?: string;
  revisions: { text: string; actor: string; at: string }[];
  imageId?: string;
  promo?: {
    imageId?: string;
    headline: string;
    edition: string;
    series: string;
    variant: number;
    tagline: string;
  };
  replyToId?: string;
  seenBy?: { accountId: string; at: string }[];
  /** Snapshot at deletion: unseen deletions disappear; seen deletions retain a tombstone. */
  deletedAfterSeen?: boolean;
  pinned?: boolean;
  reactions?: { accountId: string; emoji: string }[];
  attachment?: string;
  quoteId?: string;
  /** Immutable payment instructions captured when a card is sent. */
  /** Direct-contact thread recipient; absent for the assigned sales conversation. */
  recipientId?: string;
  paymentCard?: {
    title: string;
    orderedItem?: string;
    accountDetails?: Record<string,string>;
    instructionText?: string;
    accentColor?: string;
    footer?: string;
    method: string;
    instructions: string;
    requestedAmount?: number;
    quoteTotal: number;
    currency: Currency;
    depositPercent: number;
    amount?: number;
    discount?: number;
    charges?: number;
  };
}
export interface Notice {
  ownerId?: string;
  id: string;
  title: string;
  body: string;
  roles: Role[];
  editionIds: string[];
  accountIds?: string[];
  companyId?: string;
  at: string;
  readBy: string[];
  status: "draft" | "published";
}
/** Secondary service records retain typed ownership and lifecycle, with module-specific fields. */
export interface ServiceRecord {
  id: string;
  module: string;
  companyId?: string;
  participationId?: string;
  editionId?: string;
  ownerId?: string;
  title: string;
  status: string;
  fields: Record<string, string>;
  at: string;
}
export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  entity: string;
  at: string;
  detail: string;
}
export interface DemoState {
  version: 4;
  fixtureRevision?: number;
  presentationRevision?: number;
  companyDocumentRevision?: number;
  paymentReviewRevision?: number;
  paymentMethodRevision?: number;
  revision: number;
  accounts: Account[];
  editions: Edition[];
  halls: Hall[];
  sources: UtilitySource[];
  zones: Zone[];
  stalls: Stall[];
  companies: Company[];
  participations: Participation[];
  technical: TechnicalSubmission[];
  allocations: Allocation[];
  quotes: Quote[];
  requests: PaymentRequest[];
  payments: Payment[];
  receipts: Receipt[];
  expenses: Expense[];
  leads: Lead[];
  messages: Message[];
  notices: Notice[];
  records: ServiceRecord[];
  audit: AuditEvent[];
  policy: { discountLimit: number; depositPercent: number; holdHours: number };
}
export interface WorkspaceContext {
  actorId: string;
  accountId: string;
  mode: "normal" | "preview" | "audit";
  editionId?: string;
  editionIds?: string[];
}
export type Command =
  | {type:"create-floorplan"; editionId:string; name:string; sourceHallId?:string; shared:boolean; template?:"reference"|"published"|"blank"|"draft"}
  | { type: "save-layout"; hallId: string; layout: import("./floorplan").FloorLayout; stalls: Stall[]; expectedRevision: number; publish: boolean }
  | { type: "approve-map-location"; participationId: string; hallId: string; stallIds: string[]; reason: string }
  | { type: "hold"; participationId: string; stallIds: string[] }
  | {
      type: "booking";
      participationId: string;
      action: "confirm" | "release" | "extend";
      reason: string;
    }
  | {
      type: "technical";
      imageIds?: string[];
      participationId: string;
      values: Record<string, string>;
      units: Record<string, string>;
      confirmed: boolean;
      submit: boolean;
    }
  | {
      type: "review";
      submissionId: string;
      status: TechnicalSubmission["status"];
      notes: string;
    }
  | {
      type: "allocate";
      participationId: string;
      hallId: string;
      zone: string;
      power: number;
      air: number;
      water: number;
      backup: number;
    }
  | {
      type: "installation";
      id: string;
      status: Allocation["status"];
      notes: string;
    }
  | {
      type: "quote";
      participationId: string;
      amount: number;
      discount: number;
      charges: number;
    }
  | { type: "approve-quote"; id: string }
  | {
      type: "request-payment";
      quoteId: string;
      method: string;
      templateId?: string;
      requestedAmount: number;
    }
  | { type: "prepare-payroll"; month: string }
  | {
      type: "payment";
      bankName?: string;
      accountNumber?: string;
      participationId: string;
      quoteId?: string;
      amount: number;
      currency: Currency;
      method: string;
      reference: string;
      payer: string;
      notes: string;
      manual: boolean;
      attachment?: string;
      receivedAt?: string;
    }
  | { type: "verify"; id: string; status: Payment["status"]; notes: string }
  | { type: "receipt"; paymentId: string }
  | { type: "revoke-receipt"; id: string }
  | {
      type: "message";
      participationId: string;
      text: string;
      imageId?: string;
      promoId?: string;
      replyToId?: string;
      attachment?: string;
      quoteId?: string;
      recipientId?: string;
    }
  | {
      type: "seen-messages";
      participationId: string;
      recipientId?: string;
      ids: string[];
    }
  | {
      type: "message-action";
      id: string;
      action: "pin" | "react";
      emoji?: string;
    }
  | { type: "edit-message"; id: string; text: string; remove: boolean }
  | {
      type: "assign";
      participationId: string;
      sellerId: string;
      stage?: string;
    }
  | {
      type: "capability";
      accountId: string;
      editions: string[];
      handoverTo?: string;
      profile?: Account;
    }
  | { type: "save-company"; company: Company }
  | { type: "save-account"; account: Account }
  | { type: "expense"; expense: Expense }
  | { type: "lead"; lead: Lead; convert?: boolean; linkCompanyId?: string }
  | { type: "record"; record: ServiceRecord }
  | { type: "notice"; notice: Notice }
  | { type: "read-notice"; id: string }
  | { type: "save-hall"; hall: Hall }
  | { type: "save-source"; source: UtilitySource }
  | { type: "save-zone"; zone: Zone }
  | { type: "save-edition"; edition: Edition }
  | { type: "save-map"; hallId: string; stalls: Stall[]; publish: boolean }
  | { type: "policy"; policy: DemoState["policy"] }
  | { type: "audit-view"; accountId: string; action: string };
