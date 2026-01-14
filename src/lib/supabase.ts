import { createClient } from '@supabase/supabase-js';
import type { NetworkProfile, ProfileFormData } from '@/types/network-profile';
import type {
  Company,
  CompanyCreateData,
  CompanyUpdateData,
  JobSubmission,
  JobSubmissionCreateData,
  JobStatus,
  JobMatch,
  JobMatchCreateData,
  MemberResponse,
} from '@/types/job-matching';
import { getWebhookUrl } from '@/utils/webhookUtils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Profile storage will not work.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Send profile approval notification to admin
async function sendProfileApprovalNotification(profile: NetworkProfile): Promise<void> {
  try {
    const webhookUrl = getWebhookUrl('profile-approval');
    const username = import.meta.env.VITE_N8N_BASIC_AUTH_USERNAME;
    const password = import.meta.env.VITE_N8N_BASIC_AUTH_PASSWORD;
    
    if (!username || !password) {
      console.warn('Webhook credentials not configured. Approval notification not sent.');
      return;
    }

    const basicAuth = btoa(`${username}:${password}`);

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: JSON.stringify({
        to: 'dwayne@creativetechnologists.nl',
        subject: 'New CTC Network Profile Awaiting Approval',
        profileName: profile.fullName,
        profileEmail: profile.email,
        profileSlug: profile.slug,
        profileUrl: `${window.location.origin}/directory/profile/${profile.slug}`,
        dashboardUrl: `${supabaseUrl}/project/${supabaseUrl.split('//')[1].split('.')[0]}/editor`,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10000)
    });
  } catch (error) {
    console.error('Failed to send approval notification:', error);
    // Don't throw - profile creation should succeed even if notification fails
  }
}

export async function resendConfirmationEmail(email: string): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase not configured');
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apiKey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      email,
      type: 'signup',
      redirect_to: `${window.location.origin}/directory/auth?mode=login`,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.msg || errorData?.error_description || 'Failed to resend confirmation email';
    throw new Error(message);
  }
}

// Image upload functions
export async function uploadImage(
  file: File,
  userId: string,
  type: 'profile' | 'project'
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: 'Supabase not configured' };

  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  
  if (!fileExt || !allowedExts.includes(fileExt)) {
    return { url: null, error: 'Invalid file type. Please use JPG, PNG, GIF, or WebP.' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { url: null, error: 'File too large. Maximum size is 5MB.' };
  }

  const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return { url: null, error: uploadError.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('profile-images')
    .getPublicUrl(fileName);

  return { url: publicUrl, error: null };
}

export async function deleteImage(imageUrl: string): Promise<{ success: boolean; error: string | null }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  // Extract file path from URL
  const urlParts = imageUrl.split('/profile-images/');
  if (urlParts.length < 2) return { success: false, error: 'Invalid image URL' };
  
  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('profile-images')
    .remove([filePath]);

  if (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

function generateSlug(fullName: string): string {
  return fullName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function getUniqueSlug(baseSlug: string): Promise<string> {
  if (!supabase) return `${baseSlug}-${Date.now()}`;
  
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data } = await supabase
      .from('network_profiles')
      .select('slug')
      .eq('slug', slug)
      .single();
    
    if (!data) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

export async function createProfile(formData: ProfileFormData, userId: string): Promise<{ success: boolean; profile?: NetworkProfile; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const baseSlug = generateSlug(formData.fullName);
    const slug = await getUniqueSlug(baseSlug);
    
    const otherSocialLinks = formData.otherSocialLinks
      .split('\n')
      .map(link => link.trim())
      .filter(link => link.length > 0);

    const profileData = {
      user_id: userId,
      full_name: formData.fullName,
      location: formData.location,
      email: formData.email,
      portfolio_url: formData.portfolioUrl || null,
      linkedin_url: formData.linkedinUrl || null,
      other_social_links: otherSocialLinks.length > 0 ? otherSocialLinks : null,
      bio: formData.bio,
      focus_areas: formData.focusAreas,
      skills: formData.skills,
      projects: formData.projects,
      availability: formData.availability,
      is_ctc_member: formData.isCtcMember,
      profile_picture_url: formData.profilePictureUrl || null,
      slug,
    };

    const { data, error } = await supabase
      .from('network_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) throw error;

    const profile: NetworkProfile = {
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      location: data.location,
      email: data.email,
      portfolioUrl: data.portfolio_url,
      linkedinUrl: data.linkedin_url,
      otherSocialLinks: data.other_social_links,
      bio: data.bio,
      focusAreas: data.focus_areas,
      skills: data.skills,
      projects: data.projects,
      availability: data.availability,
      isCtcMember: data.is_ctc_member,
      profilePictureUrl: data.profile_picture_url,
      approved: data.approved || false,
      approvedAt: data.approved_at,
      approvedBy: data.approved_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      slug: data.slug,
    };

    // Send notification email to admin
    await sendProfileApprovalNotification(profile);

    return { success: true, profile };
  } catch (error: any) {
    console.error('Error creating profile:', error);
    return { success: false, error: error.message || 'Failed to create profile' };
  }
}

export async function updateProfile(profileId: string, formData: ProfileFormData): Promise<{ success: boolean; profile?: NetworkProfile; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const otherSocialLinks = formData.otherSocialLinks
      .split('\n')
      .map(link => link.trim())
      .filter(link => link.length > 0);

    const profileData = {
      full_name: formData.fullName,
      location: formData.location,
      email: formData.email,
      portfolio_url: formData.portfolioUrl || null,
      linkedin_url: formData.linkedinUrl || null,
      other_social_links: otherSocialLinks.length > 0 ? otherSocialLinks : null,
      bio: formData.bio,
      focus_areas: formData.focusAreas,
      skills: formData.skills,
      projects: formData.projects,
      availability: formData.availability,
      is_ctc_member: formData.isCtcMember,
      profile_picture_url: formData.profilePictureUrl || null,
    };

    const { data, error } = await supabase
      .from('network_profiles')
      .update(profileData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;

    const profile: NetworkProfile = {
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      location: data.location,
      email: data.email,
      portfolioUrl: data.portfolio_url,
      linkedinUrl: data.linkedin_url,
      otherSocialLinks: data.other_social_links,
      bio: data.bio,
      focusAreas: data.focus_areas,
      skills: data.skills,
      projects: data.projects,
      availability: data.availability,
      isCtcMember: data.is_ctc_member,
      profilePictureUrl: data.profile_picture_url,
      approved: data.approved || false,
      approvedAt: data.approved_at,
      approvedBy: data.approved_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      slug: data.slug,
    };

    return { success: true, profile };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message || 'Failed to update profile' };
  }
}

export async function deleteProfile(profileId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { error } = await supabase
      .from('network_profiles')
      .delete()
      .eq('id', profileId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting profile:', error);
    return { success: false, error: error.message || 'Failed to delete profile' };
  }
}

export async function getProfileByUserId(userId: string): Promise<NetworkProfile | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('network_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      location: data.location,
      email: data.email,
      portfolioUrl: data.portfolio_url,
      linkedinUrl: data.linkedin_url,
      otherSocialLinks: data.other_social_links,
      bio: data.bio,
      focusAreas: data.focus_areas,
      skills: data.skills,
      projects: data.projects,
      availability: data.availability,
      isCtcMember: data.is_ctc_member,
      profilePictureUrl: data.profile_picture_url,
      approved: data.approved || false,
      approvedAt: data.approved_at,
      approvedBy: data.approved_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      slug: data.slug,
    };
  } catch (error) {
    console.error('Error fetching profile by user ID:', error);
    return null;
  }
}

export async function getProfileBySlug(slug: string): Promise<NetworkProfile | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('network_profiles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      fullName: data.full_name,
      location: data.location,
      email: data.email,
      portfolioUrl: data.portfolio_url,
      linkedinUrl: data.linkedin_url,
      otherSocialLinks: data.other_social_links,
      bio: data.bio,
      focusAreas: data.focus_areas,
      skills: data.skills,
      projects: data.projects,
      availability: data.availability,
      isCtcMember: data.is_ctc_member,
      profilePictureUrl: data.profile_picture_url,
      approved: data.approved || false,
      approvedAt: data.approved_at,
      approvedBy: data.approved_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      slug: data.slug,
    };
  } catch (error) {
    console.error('Error fetching profile by slug:', error);
    return null;
  }
}

export async function notifyAdminProfileCreated(profile: NetworkProfile) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('network_profiles')
      .select('id')
      .eq('slug', profile.slug)
      .single();

    if (error) throw error;

    const adminEmails = await getAdminEmails();

    await sendProfileCreatedNotification(adminEmails, profile);

    return { success: true };
  } catch (error: any) {
    console.error('Error notifying admin of profile creation:', error);
    return { success: false, error: error.message || 'Failed to notify admin' };
  }
}

export async function getAdminEmails(): Promise<string[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('admins')
      .select('email');

    if (error) throw error;

    return data.map((admin: any) => admin.email);
  } catch (error: any) {
    console.error('Error fetching admin emails:', error);
    return [];
  }
}

export async function sendProfileCreatedNotification(adminEmails: string[], profile: NetworkProfile) {
  if (!supabase) return;

  try {
    const emailTemplate = await getEmailTemplate('profile-created');

    const emailData = {
      profileName: profile.fullName,
      profileSlug: profile.slug,
    };

    await sendEmail(adminEmails, emailTemplate, emailData);
  } catch (error: any) {
    console.error('Error sending profile created notification:', error);
  }
}

export async function getEmailTemplate(templateName: string): Promise<string> {
  if (!supabase) return '';

  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('template')
      .eq('name', templateName)
      .single();

    if (error) throw error;

    return data.template;
  } catch (error: any) {
    console.error('Error fetching email template:', error);
    return '';
  }
}

export async function sendEmail(to: string[], template: string, data: any) {
  if (!supabase) return;

  try {
    const emailService = await getEmailService();

    await emailService.send({
      to,
      subject: 'New Profile Created',
      html: template,
      data,
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
  }
}

export async function getEmailService(): Promise<any> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('email_services')
      .select('service')
      .single();

    if (error) throw error;

    return data.service;
  } catch (error: any) {
    console.error('Error fetching email service:', error);
    return null;
  }
}

export async function getAllProfiles(): Promise<NetworkProfile[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('network_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((item: any) => ({
      id: item.id,
      fullName: item.full_name,
      location: item.location,
      email: item.email,
      portfolioUrl: item.portfolio_url,
      linkedinUrl: item.linkedin_url,
      otherSocialLinks: item.other_social_links,
      bio: item.bio,
      focusAreas: item.focus_areas,
      skills: item.skills,
      projects: item.projects,
      availability: item.availability,
      isCtcMember: item.is_ctc_member,
      profilePictureUrl: item.profile_picture_url,
      approved: item.approved || false,
      approvedAt: item.approved_at,
      approvedBy: item.approved_by,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      slug: item.slug,
    }));
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
}

// =============================================================================
// COMPANY FUNCTIONS
// =============================================================================

/**
 * Helper function to convert database row to Company interface
 */
function rowToCompany(row: any): Company {
  return {
    id: row.id,
    userId: row.user_id,
    companyName: row.company_name,
    companyWebsite: row.company_website,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    companySize: row.company_size,
    industry: row.industry,
    verified: row.verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a new company linked to the authenticated user
 */
export async function createCompany(
  data: CompanyCreateData,
  userId: string
): Promise<{ success: boolean; company?: Company; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const companyData = {
      user_id: userId,
      company_name: data.companyName,
      company_website: data.companyWebsite || null,
      contact_name: data.contactName,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone || null,
      company_size: data.companySize || null,
      industry: data.industry || null,
    };

    const { data: row, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (error) throw error;

    return { success: true, company: rowToCompany(row) };
  } catch (error: any) {
    console.error('Error creating company:', error);
    return { success: false, error: error.message || 'Failed to create company' };
  }
}

/**
 * Get a company by the authenticated user's ID
 */
export async function getCompanyByUserId(userId: string): Promise<Company | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return rowToCompany(data);
  } catch (error) {
    console.error('Error fetching company by user ID:', error);
    return null;
  }
}

/**
 * Get a company by its ID
 */
export async function getCompanyById(companyId: string): Promise<Company | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error || !data) return null;

    return rowToCompany(data);
  } catch (error) {
    console.error('Error fetching company by ID:', error);
    return null;
  }
}

/**
 * Update a company's details
 */
export async function updateCompany(
  companyId: string,
  data: CompanyUpdateData
): Promise<{ success: boolean; company?: Company; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    // Build update object with only provided fields
    const updateData: Record<string, any> = {};

    if (data.companyName !== undefined) updateData.company_name = data.companyName;
    if (data.companyWebsite !== undefined) updateData.company_website = data.companyWebsite;
    if (data.contactName !== undefined) updateData.contact_name = data.contactName;
    if (data.contactEmail !== undefined) updateData.contact_email = data.contactEmail;
    if (data.contactPhone !== undefined) updateData.contact_phone = data.contactPhone;
    if (data.companySize !== undefined) updateData.company_size = data.companySize;
    if (data.industry !== undefined) updateData.industry = data.industry;

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: 'No fields to update' };
    }

    const { data: row, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', companyId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, company: rowToCompany(row) };
  } catch (error: any) {
    console.error('Error updating company:', error);
    return { success: false, error: error.message || 'Failed to update company' };
  }
}

// =============================================================================
// JOB SUBMISSION FUNCTIONS
// =============================================================================

/**
 * Helper function to convert database row to JobSubmission interface
 */
function rowToJobSubmission(row: any): JobSubmission {
  return {
    id: row.id,
    companyId: row.company_id,
    title: row.title,
    description: row.description,
    requirements: row.requirements,
    preferredSkills: row.preferred_skills,
    focusAreas: row.focus_areas,
    budgetRange: row.budget_range,
    projectType: row.project_type,
    remotePreference: row.remote_preference,
    location: row.location,
    timeline: row.timeline,
    status: row.status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a new job submission for a company
 */
export async function createJobSubmission(
  companyId: string,
  data: JobSubmissionCreateData
): Promise<{ success: boolean; jobSubmission?: JobSubmission; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const jobData = {
      company_id: companyId,
      title: data.title,
      description: data.description,
      requirements: data.requirements || null,
      preferred_skills: data.preferredSkills || null,
      focus_areas: data.focusAreas || null,
      budget_range: data.budgetRange || null,
      project_type: data.projectType,
      remote_preference: data.remotePreference,
      location: data.location || null,
      timeline: data.timeline || null,
    };

    const { data: row, error } = await supabase
      .from('job_submissions')
      .insert(jobData)
      .select()
      .single();

    if (error) throw error;

    return { success: true, jobSubmission: rowToJobSubmission(row) };
  } catch (error: any) {
    console.error('Error creating job submission:', error);
    return { success: false, error: error.message || 'Failed to create job submission' };
  }
}

/**
 * Get all job submissions for a company
 */
export async function getJobSubmissionsByCompany(
  companyId: string
): Promise<JobSubmission[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('job_submissions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(rowToJobSubmission);
  } catch (error) {
    console.error('Error fetching job submissions by company:', error);
    return [];
  }
}

/**
 * Get a single job submission by ID
 */
export async function getJobSubmissionById(id: string): Promise<JobSubmission | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('job_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return rowToJobSubmission(data);
  } catch (error) {
    console.error('Error fetching job submission by ID:', error);
    return null;
  }
}

/**
 * Update job submission status and optional admin notes
 */
export async function updateJobSubmissionStatus(
  id: string,
  status: JobStatus,
  adminNotes?: string
): Promise<{ success: boolean; jobSubmission?: JobSubmission; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const updateData: Record<string, any> = {
      status,
    };

    if (adminNotes !== undefined) {
      updateData.admin_notes = adminNotes;
    }

    const { data: row, error } = await supabase
      .from('job_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, jobSubmission: rowToJobSubmission(row) };
  } catch (error: any) {
    console.error('Error updating job submission status:', error);
    return { success: false, error: error.message || 'Failed to update job submission status' };
  }
}

/**
 * Get all pending job submissions for admin review
 */
export async function getAllPendingJobSubmissions(): Promise<JobSubmission[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('job_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map(rowToJobSubmission);
  } catch (error) {
    console.error('Error fetching pending job submissions:', error);
    return [];
  }
}

// =============================================================================
// JOB MATCH FUNCTIONS
// =============================================================================

/**
 * Helper function to convert database row to JobMatch interface
 */
function rowToJobMatch(row: any): JobMatch {
  return {
    id: row.id,
    jobId: row.job_id,
    profileId: row.profile_id,
    matchScore: row.match_score,
    matchReasoning: row.match_reasoning,
    skillMatches: row.skill_matches,
    vectorSimilarity: row.vector_similarity,
    adminApproved: row.admin_approved,
    memberNotified: row.member_notified,
    memberResponse: row.member_response,
    createdAt: row.created_at,
  };
}

/**
 * Bulk insert job matches for a job submission
 */
export async function createJobMatches(
  jobId: string,
  matches: JobMatchCreateData[]
): Promise<{ success: boolean; jobMatches?: JobMatch[]; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  if (matches.length === 0) {
    return { success: true, jobMatches: [] };
  }

  try {
    const matchData = matches.map((match) => ({
      job_id: jobId,
      profile_id: match.profileId,
      match_score: match.matchScore,
      match_reasoning: match.matchReasoning,
      skill_matches: match.skillMatches || null,
      vector_similarity: match.vectorSimilarity || null,
    }));

    const { data: rows, error } = await supabase
      .from('job_matches')
      .insert(matchData)
      .select();

    if (error) throw error;

    return { success: true, jobMatches: rows.map(rowToJobMatch) };
  } catch (error: any) {
    console.error('Error creating job matches:', error);
    return { success: false, error: error.message || 'Failed to create job matches' };
  }
}

/**
 * Get all matches for a specific job submission
 */
export async function getMatchesByJobId(jobId: string): Promise<JobMatch[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('job_matches')
      .select('*')
      .eq('job_id', jobId)
      .order('match_score', { ascending: false });

    if (error || !data) return [];

    return data.map(rowToJobMatch);
  } catch (error) {
    console.error('Error fetching matches by job ID:', error);
    return [];
  }
}

/**
 * Update match approval status (admin use)
 */
export async function updateMatchApproval(
  matchId: string,
  approved: boolean,
  adminNotes?: string
): Promise<{ success: boolean; jobMatch?: JobMatch; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    // First update the job_matches table
    const { data: row, error } = await supabase
      .from('job_matches')
      .update({ admin_approved: approved })
      .eq('id', matchId)
      .select()
      .single();

    if (error) throw error;

    // If adminNotes provided, update the related job submission
    if (adminNotes !== undefined && row) {
      await supabase
        .from('job_submissions')
        .update({ admin_notes: adminNotes })
        .eq('id', row.job_id);
    }

    return { success: true, jobMatch: rowToJobMatch(row) };
  } catch (error: any) {
    console.error('Error updating match approval:', error);
    return { success: false, error: error.message || 'Failed to update match approval' };
  }
}

/**
 * Update member response for a match
 */
export async function updateMemberResponse(
  matchId: string,
  response: MemberResponse
): Promise<{ success: boolean; jobMatch?: JobMatch; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { data: row, error } = await supabase
      .from('job_matches')
      .update({ member_response: response })
      .eq('id', matchId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, jobMatch: rowToJobMatch(row) };
  } catch (error: any) {
    console.error('Error updating member response:', error);
    return { success: false, error: error.message || 'Failed to update member response' };
  }
}

/**
 * Get all approved matches for a company's job submissions
 */
export async function getApprovedMatchesForCompany(
  companyId: string
): Promise<JobMatch[]> {
  if (!supabase) return [];

  try {
    // First get all job IDs for the company
    const { data: jobs, error: jobsError } = await supabase
      .from('job_submissions')
      .select('id')
      .eq('company_id', companyId);

    if (jobsError || !jobs || jobs.length === 0) return [];

    const jobIds = jobs.map((job) => job.id);

    // Then get all approved matches for those jobs
    const { data: matches, error: matchesError } = await supabase
      .from('job_matches')
      .select('*')
      .in('job_id', jobIds)
      .eq('admin_approved', true)
      .order('match_score', { ascending: false });

    if (matchesError || !matches) return [];

    return matches.map(rowToJobMatch);
  } catch (error) {
    console.error('Error fetching approved matches for company:', error);
    return [];
  }
}

// =============================================================================
// VECTOR SIMILARITY SEARCH FUNCTIONS
// =============================================================================

/**
 * Profile with similarity score returned from vector search
 */
export interface ProfileWithSimilarity extends NetworkProfile {
  similarityScore: number;
}

/**
 * Find similar profiles using vector similarity search (pgvector cosine similarity)
 * Only returns approved profiles that are available for work or collaborations
 *
 * @param embedding - The query embedding vector (1536 dimensions)
 * @param limit - Maximum number of results to return (default: 10)
 * @param threshold - Minimum similarity score (0-1, default: 0 = no threshold)
 * @returns Array of profiles with similarity scores, ordered by similarity descending
 */
export async function findSimilarProfiles(
  embedding: number[],
  limit: number = 10,
  threshold: number = 0
): Promise<ProfileWithSimilarity[]> {
  if (!supabase) return [];

  try {
    // Call the database function for vector similarity search
    const { data, error } = await supabase.rpc('find_similar_profiles', {
      query_embedding: `[${embedding.join(',')}]`,
      match_limit: limit,
      similarity_threshold: threshold,
    });

    if (error) {
      console.error('Error in vector similarity search:', error);
      return [];
    }

    if (!data) return [];

    // Map database rows to ProfileWithSimilarity interface
    return data.map((row: any): ProfileWithSimilarity => ({
      id: row.id,
      userId: row.user_id,
      fullName: row.full_name,
      location: row.location,
      email: row.email,
      portfolioUrl: row.portfolio_url,
      linkedinUrl: row.linkedin_url,
      otherSocialLinks: row.other_social_links,
      bio: row.bio,
      focusAreas: row.focus_areas,
      skills: row.skills,
      projects: row.projects,
      availability: row.availability,
      isCtcMember: row.is_ctc_member,
      profilePictureUrl: row.profile_picture_url,
      approved: row.approved,
      approvedAt: row.approved_at,
      approvedBy: row.approved_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      slug: row.slug,
      embedding: row.embedding,
      embeddingUpdatedAt: row.embedding_updated_at,
      enrichedContent: row.enriched_content,
      similarityScore: row.similarity_score,
    }));
  } catch (error) {
    console.error('Error finding similar profiles:', error);
    return [];
  }
}
