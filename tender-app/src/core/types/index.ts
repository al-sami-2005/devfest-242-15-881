export interface Tender {
  tender_id: string;
  title: string;
  procuring_entity: string;
  bidder: string;
  submission_deadline: string; // YYYY-MM-DD
}

export interface Requirement {
  id: string;
  order: number;
  title_en: string;
  title_bn: string;
  mandatory: boolean;
  has_expiry: boolean;
}

export interface TenderData {
  tender: Tender;
  requirements: Requirement[];
}

export interface UploadedDocument {
  id: string;
  file: File;
  filename: string;
  size: number;
  type: string;
  pageCount: number;
  contentHash: string; // for duplicate detection
  isDuplicate: boolean;
  duplicateGroup?: string;
  parsingError?: string;
}

export type RequirementStatus = 'missing' | 'expiry-date-needed' | 'expired' | 'not-provided' | 'ok';

export interface RequirementAssignment {
  requirementId: string;
  documentId: string | null;
  expiryDate: string | null; // YYYY-MM-DD
}

export interface RequirementState extends RequirementAssignment {
  status: RequirementStatus;
}
