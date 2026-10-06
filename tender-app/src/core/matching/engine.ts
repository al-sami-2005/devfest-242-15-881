import { RequirementAssignment, UploadedDocument } from '../types';

export interface MatchingState {
  assignments: Record<string, RequirementAssignment>;
}

export type AssignmentConflict = 
  | { type: 'FILE_ALREADY_ASSIGNED'; requirementId: string }
  | { type: 'DUPLICATE_CONTENT_ASSIGNED'; requirementId: string }
  | { type: 'DOCUMENT_NOT_FOUND' }
  | { type: 'REQUIREMENT_NOT_FOUND' };

export interface AssignResult {
  state: MatchingState;
  conflict: AssignmentConflict | null;
}

const createEmptyAssignment = (requirementId: string): RequirementAssignment => ({
  requirementId,
  documentId: null,
  expiryDate: null
});

export const assignFile = (
  state: MatchingState,
  requirementId: string,
  documentId: string,
  allDocuments: UploadedDocument[],
  validRequirementIds: string[]
): AssignResult => {
  if (!validRequirementIds.includes(requirementId)) {
    return { state, conflict: { type: 'REQUIREMENT_NOT_FOUND' } };
  }

  const docToAssign = allDocuments.find(d => d.id === documentId);
  if (!docToAssign) {
    return { state, conflict: { type: 'DOCUMENT_NOT_FOUND' } };
  }

  // Check for conflicts
  for (const [reqId, assignment] of Object.entries(state.assignments)) {
    if (reqId === requirementId) continue; // It's okay if we are replacing our own assignment
    
    if (assignment.documentId === documentId) {
      return { state, conflict: { type: 'FILE_ALREADY_ASSIGNED', requirementId: reqId } };
    }

    if (assignment.documentId) {
      const assignedDoc = allDocuments.find(d => d.id === assignment.documentId);
      if (assignedDoc && assignedDoc.contentHash === docToAssign.contentHash) {
        return { state, conflict: { type: 'DUPLICATE_CONTENT_ASSIGNED', requirementId: reqId } };
      }
    }
  }

  // Clear stale expiry data if we are switching to a new document
  // This avoids accidental retention of an old expiry date that doesn't belong to the new document.
  const oldAssignment = state.assignments[requirementId];
  const keepExpiry = oldAssignment?.documentId === documentId;
  const newExpiry = keepExpiry ? oldAssignment.expiryDate : null;

  const newAssignment: RequirementAssignment = {
    requirementId,
    documentId,
    expiryDate: newExpiry
  };

  // If this document was assigned to another requirement previously, unassign it from there?
  // Wait, the specification says "One uploaded file -> at most one requirement". 
  // Should we auto-unassign or reject? "Return a structured conflict reason." implies rejecting.
  // We implemented rejection above with FILE_ALREADY_ASSIGNED.

  return {
    state: {
      ...state,
      assignments: {
        ...state.assignments,
        [requirementId]: newAssignment
      }
    },
    conflict: null
  };
};

export const unassignFile = (state: MatchingState, requirementId: string): MatchingState => {
  // Clears the document and the expiry date
  return {
    ...state,
    assignments: {
      ...state.assignments,
      [requirementId]: createEmptyAssignment(requirementId)
    }
  };
};

export const setExpiryDate = (state: MatchingState, requirementId: string, expiryDate: string | null): MatchingState => {
  const current = state.assignments[requirementId] || createEmptyAssignment(requirementId);
  return {
    ...state,
    assignments: {
      ...state.assignments,
      [requirementId]: {
        ...current,
        expiryDate
      }
    }
  };
};
