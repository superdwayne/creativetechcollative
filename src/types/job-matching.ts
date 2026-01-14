// TypeScript types for the AI-Powered Job Matching Engine tables

// =============================================================================
// ENUM TYPES (Union types for database CHECK constraints)
// =============================================================================

export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

export type ProjectType = 'freelance' | 'contract' | 'full-time' | 'project-based';

export type RemotePreference = 'remote' | 'hybrid' | 'onsite' | 'flexible';

export type JobStatus = 'pending' | 'reviewed' | 'matched' | 'closed' | 'rejected';

export type MemberResponse = 'interested' | 'not-interested' | 'no-response';

// =============================================================================
// COMPANY TYPES
// =============================================================================

/**
 * Company record - registered company accounts that can submit job specifications
 */
export interface Company {
  id: string;
  userId: string;
  companyName: string;
  companyWebsite?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  companySize?: CompanySize | null;
  industry?: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data required to create a new company
 */
export interface CompanyCreateData {
  companyName: string;
  companyWebsite?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  companySize?: CompanySize;
  industry?: string;
}

/**
 * Data for updating an existing company
 */
export interface CompanyUpdateData {
  companyName?: string;
  companyWebsite?: string | null;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string | null;
  companySize?: CompanySize | null;
  industry?: string | null;
}

// =============================================================================
// JOB SUBMISSION TYPES
// =============================================================================

/**
 * Job submission record - job specifications submitted by companies
 */
export interface JobSubmission {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirements?: string | null;
  preferredSkills?: string[] | null;
  focusAreas?: string[] | null;
  budgetRange?: string | null;
  projectType: ProjectType;
  remotePreference: RemotePreference;
  location?: string | null;
  timeline?: string | null;
  status: JobStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data required to create a new job submission
 */
export interface JobSubmissionCreateData {
  title: string;
  description: string;
  requirements?: string;
  preferredSkills?: string[];
  focusAreas?: string[];
  budgetRange?: string;
  projectType: ProjectType;
  remotePreference: RemotePreference;
  location?: string;
  timeline?: string;
}

/**
 * Data for updating a job submission status (admin use)
 */
export interface JobSubmissionStatusUpdate {
  status: JobStatus;
  adminNotes?: string;
}

// =============================================================================
// JOB MATCH TYPES
// =============================================================================

/**
 * Skill match information stored in JSONB
 */
export interface SkillMatchInfo {
  skill: string;
  relevance: string;
  fromProfile?: boolean;
  fromPortfolio?: boolean;
}

/**
 * Job match record - AI-generated matches between jobs and member profiles
 */
export interface JobMatch {
  id: string;
  jobId: string;
  profileId: string;
  matchScore: number;
  matchReasoning: string;
  skillMatches?: SkillMatchInfo[] | null;
  vectorSimilarity?: number | null;
  adminApproved?: boolean | null;
  memberNotified: boolean;
  memberResponse?: MemberResponse | null;
  createdAt: string;
}

/**
 * Data for creating a new job match (batch insert)
 */
export interface JobMatchCreateData {
  jobId: string;
  profileId: string;
  matchScore: number;
  matchReasoning: string;
  skillMatches?: SkillMatchInfo[];
  vectorSimilarity?: number;
}

/**
 * Data for updating match approval status (admin use)
 */
export interface MatchApprovalUpdate {
  adminApproved: boolean;
}

/**
 * Data for updating member response
 */
export interface MemberResponseUpdate {
  memberResponse: MemberResponse;
}

// =============================================================================
// NETWORK PROFILE EMBEDDING FIELDS
// =============================================================================

/**
 * Embedding-related fields added to network_profiles
 * These extend the existing NetworkProfile interface
 */
export interface ProfileEmbeddingFields {
  /** Vector embedding (1536 dimensions for OpenAI text-embedding-3-small) */
  embedding?: number[] | null;
  /** Timestamp when embedding was last generated/updated */
  embeddingUpdatedAt?: string | null;
  /** Scraped and processed content from portfolio URLs */
  enrichedContent?: string | null;
}

// =============================================================================
// CONSTANT ARRAYS FOR UI
// =============================================================================

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
  { value: 'startup', label: 'Startup (1-10 employees)' },
  { value: 'small', label: 'Small (11-50 employees)' },
  { value: 'medium', label: 'Medium (51-200 employees)' },
  { value: 'large', label: 'Large (201-1000 employees)' },
  { value: 'enterprise', label: 'Enterprise (1000+ employees)' },
];

export const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: 'freelance', label: 'Freelance' },
  { value: 'contract', label: 'Contract' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'project-based', label: 'Project-based' },
];

export const REMOTE_PREFERENCES: { value: RemotePreference; label: string }[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
  { value: 'flexible', label: 'Flexible' },
];

export const JOB_STATUSES: { value: JobStatus; label: string; description: string }[] = [
  { value: 'pending', label: 'Pending', description: 'Awaiting review' },
  { value: 'reviewed', label: 'Reviewed', description: 'Reviewed by admin' },
  { value: 'matched', label: 'Matched', description: 'Matches generated' },
  { value: 'closed', label: 'Closed', description: 'Job closed' },
  { value: 'rejected', label: 'Rejected', description: 'Job rejected' },
];

export const MEMBER_RESPONSES: { value: MemberResponse; label: string }[] = [
  { value: 'interested', label: 'Interested' },
  { value: 'not-interested', label: 'Not Interested' },
  { value: 'no-response', label: 'No Response' },
];
