import { Requirement, RequirementAssignment, RequirementStatus, UploadedDocument } from '../types';
import { isExpiryValid } from './dateUtils';

export const determineRequirementStatus = (
  requirement: Requirement,
  assignment: RequirementAssignment,
  submissionDeadline: string,
  matchedDocument?: UploadedDocument
): RequirementStatus => {
  if (!assignment.documentId || !matchedDocument) {
    if (requirement.mandatory) {
      return 'missing';
    } else {
      return 'not-provided';
    }
  }

  if (requirement.has_expiry) {
    if (!assignment.expiryDate) {
      return 'expiry-date-needed';
    }
    
    if (!isExpiryValid(assignment.expiryDate, submissionDeadline)) {
      return 'expired';
    }
  }

  return 'ok';
};
