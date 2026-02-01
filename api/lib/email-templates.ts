/**
 * CTC Email Templates
 * 
 * Unified email template system with dark header, white content card,
 * and professional branding matching the CTC newsletter style.
 */

const EMAIL_FROM_DOMAIN = process.env.EMAIL_FROM_DOMAIN || 'creativetechnologists.nl';
const PUBLIC_URL = process.env.PUBLIC_URL || `https://${EMAIL_FROM_DOMAIN}`;
const LOGO_URL = 'https://di867tnz6fwga.cloudfront.net/brand-kits/0677c988-4f0e-4481-a2fe-0f7e63b0496c/icon/90cd52c8-b3c8-44e7-a014-a7407c720fdd.png';

interface EmailContext {
  recipientName?: string;
  previewText?: string;
}

/**
 * Generates the dark header section with CTC logo and branding
 */
function generateHeader(subtitle?: string): string {
  return `
    <!-- HEADER -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" class="dark-mode-bg" style="background-color:#000 !important;">
      <tr>
        <td align="center" class="dark-mode-bg" style="padding:48px 20px 40px 20px; background-color:#000 !important;">
          <!-- LOGO -->
          <img
            src="${LOGO_URL}"
            width="56"
            height="56"
            alt="CTC Logo"
            style="display:block; margin-bottom:20px;"
          />
          <!-- TITLE -->
          <h1 style="margin:0; font-size:26px; line-height:1.2; color:#ffffff; font-weight:700;">
            Creative Technology Collective
          </h1>
          ${subtitle ? `
          <!-- SUBTITLE -->
          <p style="margin:10px 0 0 0; font-size:14px; color:#bdbdbd;">
            ${subtitle}
          </p>
          ` : ''}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Generates the footer with social links
 */
function generateFooter(includeUnsubscribe: boolean = false, email?: string): string {
  const unsubscribeHtml = includeUnsubscribe && email ? `
    <p style="margin:16px 0 0 0; font-size:11px; color:#666;">
      <a href="https://n8n.creativetechnologists.nl/webhook/unsubscribe?email=${encodeURIComponent(email)}" target="_blank" style="color:#999; text-decoration:underline;">
        Unsubscribe
      </a>
    </p>
  ` : '';

  return `
    <!-- FOOTER -->
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 20px 40px 20px;">
      <tr>
        <td align="center" style="padding:24px 20px;">
          <!-- Social Links -->
          <p style="margin:0 0 12px 0; font-size:12px; color:#999;">
            <a href="https://creativetechnologists.nl/" target="_blank" style="color:#bdbdbd; text-decoration:none; margin:0 8px;">Website</a>
            <span style="color:#555;">|</span>
            <a href="https://www.instagram.com/creativetechnologist.nl/" target="_blank" style="color:#bdbdbd; text-decoration:none; margin:0 8px;">Instagram</a>
            <span style="color:#555;">|</span>
            <a href="https://www.linkedin.com/company/creativetechnologycollective/" target="_blank" style="color:#bdbdbd; text-decoration:none; margin:0 8px;">LinkedIn</a>
          </p>
          <p style="margin:8px 0 0 0; font-size:11px; color:#666;">
            © ${new Date().getFullYear()} Creative Technology Collective
          </p>
          ${unsubscribeHtml}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Wraps content in the full email structure
 */
function wrapInEmailStructure(
  headerSubtitle: string | undefined,
  contentHtml: string,
  includeUnsubscribe: boolean = false,
  recipientEmail?: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Creative Technology Collective</title>
  <style>
    /* Force Gmail dark mode overrides */
    u + .body .gmail-blend-screen { background:#000 !important; mix-blend-mode:normal !important; }
    u + .body .gmail-blend-difference { background:#000 !important; mix-blend-mode:normal !important; }
    
    /* Prevent Gmail from changing colors */
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg { background-color: #000 !important; }
      .dark-mode-text { color: #ffffff !important; }
      .light-mode-bg { background-color: #ffffff !important; }
      .light-mode-text { color: #111111 !important; }
      .grey-bg { background-color: #f8f8f8 !important; }
    }
  </style>
</head>
<body class="body" style="margin:0; padding:0; background-color:#000 !important; font-family:Arial, Helvetica, sans-serif;">
  <!-- OUTER WRAPPER -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        ${generateHeader(headerSubtitle)}
        ${contentHtml}
        ${generateFooter(includeUnsubscribe, recipientEmail)}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Creates a primary CTA button
 */
function ctaButton(text: string, href: string, dark: boolean = false): string {
  if (dark) {
    return `
      <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
        <tr>
          <td bgcolor="#ffffff" style="border-radius:8px;">
            <a href="${href}" target="_blank" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:700; color:#000000; text-decoration:none; letter-spacing:0.3px;">
              ${text}
            </a>
          </td>
        </tr>
      </table>
    `;
  }
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td bgcolor="#18181b" style="border-radius:8px;">
          <a href="${href}" target="_blank" style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; letter-spacing:0.3px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Creates a content card (white background)
 */
function contentCard(innerHtml: string): string {
  return `
    <!-- CONTENT CARD -->
    <table width="600" cellpadding="0" cellspacing="0" border="0" class="light-mode-bg"
           style="background-color:#ffffff !important; border-radius:12px; margin:0 20px 24px 20px;">
      <tr>
        <td class="light-mode-text" style="padding:32px 36px; color:#111111 !important; font-size:16px; line-height:1.6;">
          ${innerHtml}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Creates a highlight box (grey background)
 */
function highlightBox(innerHtml: string): string {
  return `
    <div class="grey-bg" style="background-color:#f8f8f8; border-radius:8px; padding:20px; margin:20px 0;">
      ${innerHtml}
    </div>
  `;
}

/**
 * Creates a quote/message preview box
 */
function quoteBox(quote: string): string {
  return `
    <div style="background-color:#f4f4f5; border-radius:8px; padding:20px; margin:20px 0; border-left:4px solid #18181b;">
      <p style="color:#3f3f46; font-size:15px; line-height:1.6; margin:0; font-style:italic;">
        "${quote}"
      </p>
    </div>
  `;
}

/**
 * Creates an info section with gradient background (for events, special notices)
 */
function gradientSection(innerHtml: string): string {
  return `
    <!-- GRADIENT SECTION -->
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 20px 24px 20px; background: linear-gradient(135deg, #1a1a1a 0%, #000 100%); border-radius:12px; border:2px solid #333;">
      <tr>
        <td align="center" style="padding:32px 28px;">
          ${innerHtml}
        </td>
      </tr>
    </table>
  `;
}

/**
 * Creates a test banner for test emails
 */
function testBanner(): string {
  return `
    <div style="background-color:#fef3c7; border:1px solid #f59e0b; border-radius:8px; padding:14px 18px; margin-bottom:24px;">
      <p style="color:#92400e; font-size:14px; margin:0; font-weight:500;">⚠️ This is a TEST email to verify the notification system is working.</p>
    </div>
  `;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * New message notification email
 */
export function messageNotificationEmail(params: {
  recipientName?: string;
  senderName: string;
  messagePreview: string;
  messagesUrl: string;
  jobTitle?: string;
}): string {
  const greeting = params.recipientName ? `Hi ${params.recipientName},` : 'Hi there,';
  const jobContext = params.jobTitle ? ` regarding <strong>${params.jobTitle}</strong>` : '';
  
  const truncatedPreview = params.messagePreview.length > 150 
    ? params.messagePreview.slice(0, 150) + '...' 
    : params.messagePreview;

  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      You have a new message
    </h2>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      ${greeting}
    </p>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      <strong>${params.senderName}</strong> sent you a message on the CTC Network${jobContext}.
    </p>

    ${quoteBox(truncatedPreview)}

    ${ctaButton('View Message', params.messagesUrl)}

    <p style="color:#71717a; font-size:14px; line-height:1.6; margin:24px 0 0 0;">
      Log in to read the full message and reply to ${params.senderName}.
    </p>
  `);

  return wrapInEmailStructure('Your Extended Innovation Team', content);
}

/**
 * Profile approved notification email
 */
export function profileApprovedEmail(params: {
  fullName: string;
  profileUrl: string;
}): string {
  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      You're Now Live in the CTC Directory!
    </h2>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Hi ${params.fullName},
    </p>

    <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Great news! Your profile has been approved and is now live. By joining the CTC Directory, you're actively helping shape the future of creative technology — your visibility strengthens our growing community and connects you with companies seeking talent like you.
    </p>

    ${ctaButton('View Your Profile', params.profileUrl)}

    ${highlightBox(`
      <p style="margin:0; font-size:14px; line-height:1.6; color:#3f3f46;">
        <strong>Quick tips:</strong><br/>
        • Keep your profile up to date with your latest work<br/>
        • Add portfolio links to showcase your projects<br/>
        • Enable notifications to get alerted about opportunities
      </p>
    `)}
  `);

  return wrapInEmailStructure('Directory Profile Approved', content);
}

/**
 * Company access request - Admin notification
 */
export function companyAccessRequestAdminEmail(params: {
  companyName: string;
  contactEmail: string;
  contactName?: string;
  companyWebsite?: string;
  industry?: string;
  companySize?: string;
  adminDashboardUrl: string;
}): string {
  const details = [
    `<p style="margin:8px 0; color:#3f3f46;"><strong>Company:</strong> ${params.companyName}</p>`,
    `<p style="margin:8px 0; color:#3f3f46;"><strong>Email:</strong> ${params.contactEmail}</p>`,
  ];

  if (params.contactName) {
    details.push(`<p style="margin:8px 0; color:#3f3f46;"><strong>Contact:</strong> ${params.contactName}</p>`);
  }
  if (params.companyWebsite) {
    details.push(`<p style="margin:8px 0; color:#3f3f46;"><strong>Website:</strong> <a href="${params.companyWebsite}" style="color:#18181b;">${params.companyWebsite}</a></p>`);
  }
  if (params.industry) {
    details.push(`<p style="margin:8px 0; color:#3f3f46;"><strong>Industry:</strong> ${params.industry}</p>`);
  }
  if (params.companySize) {
    details.push(`<p style="margin:8px 0; color:#3f3f46;"><strong>Size:</strong> ${params.companySize}</p>`);
  }

  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      New Company Access Request
    </h2>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      A new company has requested access to the CTC Talent Matching platform.
    </p>

    ${highlightBox(`
      <h3 style="color:#18181b; font-size:15px; margin:0 0 14px 0; font-weight:600;">Request Details</h3>
      ${details.join('')}
    `)}

    ${ctaButton('Review in Admin Dashboard', params.adminDashboardUrl)}
  `);

  return wrapInEmailStructure('Admin Notification', content);
}

/**
 * Company approved notification email
 */
export function companyApprovedEmail(params: {
  contactName: string;
  companyName: string;
  magicLink: string;
}): string {
  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      Welcome to CTC Talent Matching!
    </h2>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Hi ${params.contactName},
    </p>

    <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Great news! Your company <strong>${params.companyName}</strong> has been approved to access the CTC Talent Matching platform.
    </p>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Click the button below to set up your account and access your dashboard:
    </p>

    ${ctaButton('Set Up Your Account', params.magicLink)}

    <p style="color:#71717a; font-size:14px; line-height:1.6; margin:20px 0 0 0;">
      This link expires in 24 hours. If it expires, request a new one on the login page.
    </p>

    ${highlightBox(`
      <p style="margin:0 0 12px 0; font-size:14px; line-height:1.6; color:#3f3f46;">
        <strong>What you can do:</strong>
      </p>
      <ul style="color:#3f3f46; font-size:14px; line-height:1.8; padding-left:18px; margin:0;">
        <li>Submit job specifications for creative tech roles</li>
        <li>Get matched with top creative technologists</li>
        <li>Connect directly with matched candidates</li>
      </ul>
    `)}
  `);

  return wrapInEmailStructure('Account Approved', content);
}

/**
 * Company rejected notification email
 */
export function companyRejectedEmail(params: {
  contactName: string;
  companyName: string;
  supportEmail?: string;
}): string {
  const supportEmail = params.supportEmail || `hello@${EMAIL_FROM_DOMAIN}`;

  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      Thank you for your interest
    </h2>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Hi ${params.contactName},
    </p>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Thank you for your interest in the CTC Talent Matching platform. After reviewing your application for <strong>${params.companyName}</strong>, we're unable to approve access at this time.
    </p>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      This could be due to various reasons, including:
    </p>

    <ul style="color:#3f3f46; font-size:15px; line-height:1.8; padding-left:20px; margin:0 0 24px 0;">
      <li>The information provided was incomplete</li>
      <li>We couldn't verify your company details</li>
      <li>Your company doesn't align with our current focus areas</li>
    </ul>

    <p style="margin:0 0 0 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      If you believe this was a mistake or would like to provide additional information, please reach out to us at <a href="mailto:${supportEmail}" style="color:#18181b; font-weight:500;">${supportEmail}</a>.
    </p>
  `);

  return wrapInEmailStructure('Application Update', content);
}

/**
 * Test email - Message notification
 */
export function testMessageEmail(baseUrl: string): string {
  const content = contentCard(`
    ${testBanner()}

    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      You have a new message
    </h2>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Hi there,
    </p>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      <strong>Test Sender</strong> sent you a message on the CTC Network.
    </p>

    ${quoteBox('This is a test message to verify the email notification system is working correctly. If you received this email, the system is functioning properly!')}

    ${ctaButton('View Message', `${baseUrl}/messages`)}

    <p style="color:#71717a; font-size:14px; line-height:1.6; margin:24px 0 0 0;">
      Log in to read the full message and reply.
    </p>
  `);

  return wrapInEmailStructure('Your Extended Innovation Team', content);
}

/**
 * Test email - Profile approved
 */
export function testProfileApprovedEmail(baseUrl: string): string {
  const content = contentCard(`
    ${testBanner()}

    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      You're Now Live in the CTC Directory!
    </h2>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Hi there,
    </p>

    <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Great news! Your profile has been approved and is now live. By joining the CTC Directory, you're actively helping shape the future of creative technology.
    </p>

    ${ctaButton('View Your Profile', `${baseUrl}/directory`)}
  `);

  return wrapInEmailStructure('Directory Profile Approved', content);
}

/**
 * Profile rejection notification email
 */
export function profileRejectedEmail(params: {
  fullName: string;
  reason?: string;
  supportEmail?: string;
}): string {
  const supportEmail = params.supportEmail || `hello@${EMAIL_FROM_DOMAIN}`;

  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      Profile Review Update
    </h2>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Hi ${params.fullName},
    </p>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Thank you for your interest in joining the CTC Directory. After reviewing your profile, we're unable to approve it at this time.
    </p>

    ${params.reason ? `
      ${highlightBox(`
        <p style="margin:0; font-size:14px; line-height:1.6; color:#3f3f46;">
          <strong>Feedback:</strong><br/>
          ${params.reason}
        </p>
      `)}
    ` : ''}

    <p style="margin:20px 0 0 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      You're welcome to update your profile and reapply. If you have questions, reach out at <a href="mailto:${supportEmail}" style="color:#18181b; font-weight:500;">${supportEmail}</a>.
    </p>
  `);

  return wrapInEmailStructure('Profile Update', content);
}

/**
 * Platform update / announcement email for directory members
 */
export interface UpdateSection {
  title: string;
  description: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function platformUpdateEmail(params: {
  headline: string;
  introText: string;
  updates: UpdateSection[];
  closingText?: string;
}): string {
  // Generate update sections
  const updateSectionsHtml = params.updates.map((update, index) => {
    const hasCta = update.ctaText && update.ctaUrl;
    return `
      <div style="margin-bottom:${index < params.updates.length - 1 ? '28px' : '0'};">
        <h3 style="font-size:18px; line-height:1.3; margin:0 0 10px 0; color:#18181b; font-weight:600;">
          ${update.title}
        </h3>
        <p style="margin:0 0 ${hasCta ? '16px' : '0'}; font-size:15px; line-height:1.6; color:#3f3f46;">
          ${update.description}
        </p>
        ${hasCta ? `
          <a href="${update.ctaUrl}" target="_blank" style="display:inline-block; padding:10px 20px; font-size:14px; font-weight:600; color:#ffffff; background-color:#18181b; text-decoration:none; border-radius:6px;">
            ${update.ctaText}
          </a>
        ` : ''}
      </div>
    `;
  }).join('');

  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      ${params.headline}
    </h2>

    <p style="margin:0 0 28px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      ${params.introText}
    </p>

    <div style="border-left:3px solid #18181b; padding-left:20px; margin:0 0 24px 0;">
      ${updateSectionsHtml}
    </div>

    ${params.closingText ? `
      <p style="margin:24px 0 0 0; font-size:16px; line-height:1.6; color:#3f3f46;">
        ${params.closingText}
      </p>
    ` : ''}

    <p style="margin:24px 0 0 0; font-size:14px; line-height:1.6; color:#71717a;">
      As always, we're here to support you. Reply to this email or reach out at <a href="mailto:hello@${EMAIL_FROM_DOMAIN}" style="color:#18181b; font-weight:500;">hello@${EMAIL_FROM_DOMAIN}</a> if you have any questions.
    </p>
  `);

  return wrapInEmailStructure('Platform Updates', content, true);
}

/**
 * Profile completion reminder email for unverified users
 */
export function profileCompletionReminderEmail(params: {
  recipientEmail: string;
  loginLink: string;
}): string {
  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      Complete Your CTC Profile
    </h2>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Hi there,
    </p>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      We noticed you've created an account with the Creative Technology Collective, but haven't finished setting up your profile yet.
    </p>

    <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      By completing your profile, you'll be able to:
    </p>

    ${highlightBox(`
      <ul style="color:#3f3f46; font-size:14px; line-height:1.8; padding-left:18px; margin:0;">
        <li>Appear in our directory of creative technologists</li>
        <li>Get matched with exciting project opportunities</li>
        <li>Connect with companies looking for your unique skills</li>
        <li>Join a growing community shaping the future of creative technology</li>
      </ul>
    `)}

    ${ctaButton('Complete Your Profile', params.loginLink)}

    <p style="color:#71717a; font-size:14px; line-height:1.6; margin:24px 0 0 0;">
      This login link expires in 24 hours. If it expires, you can request a new one from the login page.
    </p>

    <p style="color:#71717a; font-size:14px; line-height:1.6; margin:16px 0 0 0;">
      If you have any questions or need help, just reply to this email — we're here to help!
    </p>
  `);

  return wrapInEmailStructure('Complete Your Profile', content);
}

/**
 * New profile pending approval - Admin notification
 */
export function newProfilePendingAdminEmail(params: {
  profileName: string;
  profileEmail: string;
  profileLocation?: string;
  profileBio?: string;
  focusAreas?: string[];
  profileUrl: string;
  adminDashboardUrl: string;
}): string {
  const details = [
    `<p style="margin:8px 0; color:#3f3f46;"><strong>Name:</strong> ${params.profileName}</p>`,
    `<p style="margin:8px 0; color:#3f3f46;"><strong>Email:</strong> ${params.profileEmail}</p>`,
  ];

  if (params.profileLocation) {
    details.push(`<p style="margin:8px 0; color:#3f3f46;"><strong>Location:</strong> ${params.profileLocation}</p>`);
  }
  if (params.focusAreas && params.focusAreas.length > 0) {
    details.push(`<p style="margin:8px 0; color:#3f3f46;"><strong>Focus Areas:</strong> ${params.focusAreas.join(', ')}</p>`);
  }

  const bioSection = params.profileBio ? `
    <div style="background-color:#f4f4f5; border-radius:8px; padding:16px; margin:16px 0; border-left:4px solid #18181b;">
      <p style="color:#3f3f46; font-size:14px; line-height:1.6; margin:0;">
        "${params.profileBio.length > 200 ? params.profileBio.slice(0, 200) + '...' : params.profileBio}"
      </p>
    </div>
  ` : '';

  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      New Profile Pending Approval
    </h2>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      A new creative technologist has submitted their profile and is awaiting your review.
    </p>

    ${highlightBox(`
      <h3 style="color:#18181b; font-size:15px; margin:0 0 14px 0; font-weight:600;">Profile Details</h3>
      ${details.join('')}
    `)}

    ${bioSection}

    <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" border="0" style="margin-right:12px; display:inline-block;">
            <tr>
              <td bgcolor="#18181b" style="border-radius:8px;">
                <a href="${params.profileUrl}" target="_blank" style="display:inline-block; padding:14px 24px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; letter-spacing:0.3px;">
                  View Profile
                </a>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" style="display:inline-block;">
            <tr>
              <td style="border-radius:8px; border:1px solid #e4e4e7;">
                <a href="${params.adminDashboardUrl}" target="_blank" style="display:inline-block; padding:14px 24px; font-size:15px; font-weight:600; color:#18181b; text-decoration:none; letter-spacing:0.3px;">
                  Open Admin Dashboard
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="color:#71717a; font-size:14px; line-height:1.6; margin:20px 0 0 0;">
      Review this profile and approve or reject it from the admin dashboard.
    </p>
  `);

  return wrapInEmailStructure('Admin Notification', content);
}

/**
 * Welcome email for new users who signed up (sent after email confirmation)
 */
export function welcomeNewUserEmail(params: {
  userName?: string;
  createProfileUrl: string;
}): string {
  const greeting = params.userName ? `Hi ${params.userName},` : 'Hi there,';

  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      Welcome to the Creative Technology Collective!
    </h2>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      ${greeting}
    </p>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Thank you for joining our community! You're now part of a growing network of creative technologists shaping the future of technology and creativity.
    </p>

    <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      To get started, create your profile to showcase your work and connect with companies looking for talent like you.
    </p>

    ${ctaButton('Create Your Profile', params.createProfileUrl)}

    ${highlightBox(`
      <p style="margin:0 0 12px 0; font-size:14px; line-height:1.6; color:#3f3f46;">
        <strong>What's next:</strong>
      </p>
      <ul style="color:#3f3f46; font-size:14px; line-height:1.8; padding-left:18px; margin:0;">
        <li>Create your profile with your skills and projects</li>
        <li>Get matched with exciting opportunities</li>
        <li>Connect with companies seeking creative technologists</li>
        <li>Join a community pushing creative boundaries</li>
      </ul>
    `)}
  `);

  return wrapInEmailStructure('Welcome to CTC', content);
}

/**
 * Beta application received - User confirmation
 */
export function betaApplicationReceivedEmail(params: {
  name: string;
}): string {
  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      Thanks for Applying!
    </h2>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Hi ${params.name},
    </p>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      We've received your application to join the Creative Technologists Collective beta program.
    </p>

    <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Our team will review your application and get back to you soon. Once approved, you'll receive an email with instructions on how to access beta features.
    </p>

    ${highlightBox(`
      <p style="margin:0; font-size:14px; line-height:1.6; color:#3f3f46;">
        <strong>What to expect:</strong><br/>
        We typically review applications within 24-48 hours. You'll receive an email when your application has been reviewed.
      </p>
    `)}

    <p style="color:#71717a; font-size:14px; line-height:1.6; margin:24px 0 0 0;">
      In the meantime, feel free to explore our website and learn more about our community.
    </p>
  `);

  return wrapInEmailStructure('Beta Program Application', content);
}

/**
 * Beta application - Admin notification
 */
export function betaApplicationAdminEmail(params: {
  name: string;
  email: string;
  interests: string[];
  adminDashboardUrl: string;
}): string {
  const interestsList = params.interests.length > 0 
    ? params.interests.join(', ') 
    : 'All features';

  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      New Beta Program Application
    </h2>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      A new user has applied to join the CTC beta program.
    </p>

    ${highlightBox(`
      <h3 style="color:#18181b; font-size:15px; margin:0 0 14px 0; font-weight:600;">Application Details</h3>
      <p style="margin:8px 0; color:#3f3f46;"><strong>Name:</strong> ${params.name}</p>
      <p style="margin:8px 0; color:#3f3f46;"><strong>Email:</strong> ${params.email}</p>
      <p style="margin:8px 0; color:#3f3f46;"><strong>Interested in:</strong> ${interestsList}</p>
      <p style="margin:8px 0; color:#3f3f46;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
    `)}

    ${ctaButton('Review in Admin Dashboard', params.adminDashboardUrl)}
  `);

  return wrapInEmailStructure('Admin Notification', content);
}

/**
 * Beta application approved notification
 */
export function betaApplicationApprovedEmail(params: {
  name: string;
  dashboardUrl?: string;
}): string {
  const dashboardUrl = params.dashboardUrl || `https://${EMAIL_FROM_DOMAIN}/beta/auth`;

  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      You're In! Welcome to the Beta Program
    </h2>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Hi ${params.name},
    </p>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Great news! Your application to join the Creative Technologists Collective beta program has been approved.
    </p>

    <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      You now have access to the Beta Hub where you can explore exclusive features including the CTC Directory, direct messaging, and more.
    </p>

    ${highlightBox(`
      <p style="margin:0 0 12px 0; font-size:14px; line-height:1.6; color:#3f3f46;">
        <strong>As a beta member, you get access to:</strong>
      </p>
      <ul style="color:#3f3f46; font-size:14px; line-height:1.8; padding-left:18px; margin:0;">
        <li>CTC Directory — Browse and connect with creative technologists</li>
        <li>Create your own profile to be discovered</li>
        <li>Direct messaging with other members</li>
        <li>Early access to upcoming features</li>
      </ul>
    `)}

    ${ctaButton('Sign In to Beta Hub', dashboardUrl)}

    <p style="color:#71717a; font-size:14px; line-height:1.6; margin:24px 0 0 0;">
      <strong>Important:</strong> Sign in using the same email address you used to apply (${params.name ? `the email linked to this message` : 'this email'}). This connects your account to your beta access.
    </p>

    <p style="color:#71717a; font-size:14px; line-height:1.6; margin:16px 0 0 0;">
      Thank you for being part of our beta community!
    </p>
  `);

  return wrapInEmailStructure('Beta Program Approved', content);
}

/**
 * Beta application rejected notification
 */
export function betaApplicationRejectedEmail(params: {
  name: string;
  reason?: string;
  supportEmail?: string;
}): string {
  const supportEmail = params.supportEmail || `dwayne@${EMAIL_FROM_DOMAIN}`;

  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      Beta Program Application Update
    </h2>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Hi ${params.name},
    </p>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Thank you for your interest in joining the Creative Technologists Collective beta program.
    </p>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      We're sorry, but we've reached our current capacity for beta testers and are unable to add new members at this time.
    </p>

    ${params.reason ? `
      ${highlightBox(`
        <p style="margin:0; font-size:14px; line-height:1.6; color:#3f3f46;">
          <strong>Note:</strong><br/>
          ${params.reason}
        </p>
      `)}
    ` : ''}

    ${highlightBox(`
      <p style="margin:0; font-size:14px; line-height:1.6; color:#3f3f46;">
        <strong>Please try again in a couple of weeks</strong><br/>
        We regularly open up new spots as we expand our beta program. We'd love to have you join us when capacity allows.
      </p>
    `)}

    <p style="margin:20px 0 0 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      We genuinely appreciate your enthusiasm for joining our community. This isn't a reflection on you — we simply have more interest than we can accommodate right now.
    </p>

    <p style="margin:16px 0 0 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      In the meantime, feel free to explore our public features and stay connected with our community. If you have questions, reach out at <a href="mailto:${supportEmail}" style="color:#18181b; font-weight:500;">${supportEmail}</a>.
    </p>
  `);

  return wrapInEmailStructure('Application Update', content);
}

/**
 * Beta account creation email - sent after approval with secure link
 */
export function betaAccountCreationEmail(params: {
  name: string;
  email: string;
  accountCreationUrl: string;
  expiresInDays?: number;
}): string {
  const expiresInDays = params.expiresInDays || 7;

  const content = contentCard(`
    <h2 style="font-size:24px; line-height:1.3; margin:0 0 20px 0; color:#18181b;">
      You're Approved! Create Your Account
    </h2>

    <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Hi ${params.name},
    </p>

    <p style="margin:0 0 20px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Great news! Your application to join the Creative Technologists Collective beta program has been approved.
    </p>

    <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6; color:#3f3f46;">
      Click the button below to create your account and set a password:
    </p>

    ${ctaButton('Create Your Account', params.accountCreationUrl)}

    ${highlightBox(`
      <p style="margin:0 0 12px 0; font-size:14px; line-height:1.6; color:#3f3f46;">
        <strong>As a beta member, you get access to:</strong>
      </p>
      <ul style="color:#3f3f46; font-size:14px; line-height:1.8; padding-left:18px; margin:0;">
        <li>CTC Directory — Browse and connect with creative technologists</li>
        <li>Create your own profile to be discovered</li>
        <li>Direct messaging with other members</li>
        <li>Early access to upcoming features</li>
      </ul>
    `)}

    <p style="color:#71717a; font-size:14px; line-height:1.6; margin:24px 0 0 0;">
      <strong>Important:</strong> This link expires in ${expiresInDays} days. Your account will be created with the email: <strong>${params.email}</strong>
    </p>

    <p style="color:#71717a; font-size:14px; line-height:1.6; margin:16px 0 0 0;">
      Thank you for being part of our beta community!
    </p>
  `);

  return wrapInEmailStructure('Beta Program Approved', content);
}

export { EMAIL_FROM_DOMAIN, PUBLIC_URL, LOGO_URL };
