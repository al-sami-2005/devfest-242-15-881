import { Requirement, RequirementAssignment, RequirementStatus, TenderData, UploadedDocument } from '../types';
import { isExpiryValid } from '../validation/dateUtils';
import { MatchingState } from './engine';
import { getRequirementTitle, Language } from '../i18n';

export interface ChecklistItem {
  requirement: Requirement;
  localizedTitle: string;
  assignment: RequirementAssignment;
  matchedDocument?: UploadedDocument;
  status: RequirementStatus;
  isBlocking: boolean;
}

export const getRequirementStatus = (
  requirement: Requirement,
  assignment: RequirementAssignment | undefined,
  submissionDeadline: string
): { status: RequirementStatus; isBlocking: boolean } => {
  const isAssigned = assignment && assignment.documentId !== null;

  if (!isAssigned) {
    if (requirement.mandatory) {
      return { status: 'missing', isBlocking: true };
    } else {
      return { status: 'not-provided', isBlocking: false };
    }
  }

  // File is matched
  if (requirement.has_expiry) {
    if (!assignment.expiryDate) {
      return { status: 'expiry-date-needed', isBlocking: true };
    }
    
    if (!isExpiryValid(assignment.expiryDate, submissionDeadline)) {
      return { status: 'expired', isBlocking: true };
    }
  }

  // File is matched and (doesn't need expiry OR expiry is valid)
  return { status: 'ok', isBlocking: false };
};

export const getDerivedChecklist = (
  tenderData: TenderData,
  state: MatchingState,
  allDocuments: UploadedDocument[],
  language: Language
): ChecklistItem[] => {
  return tenderData.requirements.map(req => {
    const assignment = state.assignments[req.id] || {
      requirementId: req.id,
      documentId: null,
      expiryDate: null
    };

    const matchedDocument = assignment.documentId 
      ? allDocuments.find(d => d.id === assignment.documentId) 
      : undefined;

    // A safely handled document might be successfully matched but if it somehow vanished, handle it gracefully.
    // If it vanished from allDocuments but remains in assignment, we treat it as unassigned for status purposes.
    const effectiveAssignment = matchedDocument ? assignment : { ...assignment, documentId: null };

    const { status, isBlocking } = getRequirementStatus(
      req, 
      effectiveAssignment, 
      tenderData.tender.submission_deadline
    );

    return {
      requirement: req,
      localizedTitle: getRequirementTitle(req, language),
      assignment: effectiveAssignment,
      matchedDocument,
      status,
      isBlocking
    };
  });
};

export interface PackageReadiness {
  canGenerate: boolean;
  blockingReasons: Array<{ requirementId: string; requirementTitle: string; status: RequirementStatus }>;
}

export const getPackageReadiness = (checklist: ChecklistItem[]): PackageReadiness => {
  const blockingItems = checklist.filter(item => item.isBlocking);

  return {
    canGenerate: blockingItems.length === 0,
    blockingReasons: blockingItems.map(item => ({
      requirementId: item.requirement.id,
      requirementTitle: item.localizedTitle,
      status: item.status
    }))
  };
};
