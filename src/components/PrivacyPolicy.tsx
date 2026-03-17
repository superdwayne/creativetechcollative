import React from 'react';
import ImageCube from './ImageCube';
import EmailSignup from './EmailSignup';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row min-h-[70vh]">
        {/* Left Side - Text Content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-20 lg:py-0">
          <div className="mb-8">
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-400 uppercase">
              Legal
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-primary font-medium leading-[0.9] tracking-tight mb-8">
            <span className="block">Privacy</span>
            <span className="block text-zinc-500">Policy</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-md font-secondary leading-relaxed mb-12">
            Your privacy matters to us. Learn how we collect, use, and protect your personal information.
          </p>

          <div className="flex gap-12 pt-8 border-t border-zinc-800">
            <div>
              <span className="block text-3xl font-primary font-medium">20</span>
              <span className="text-xs font-secondary text-zinc-400 tracking-wide uppercase">Sections</span>
            </div>
            <div>
              <span className="block text-3xl font-primary font-medium">2026</span>
              <span className="text-xs font-secondary text-zinc-400 tracking-wide uppercase">Updated</span>
            </div>
          </div>
        </div>

        {/* Right Side - Cube */}
        <div className="flex-1 relative flex items-center justify-center min-h-[50vh] lg:min-h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-black to-black" />
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <ImageCube
              size={5.5}
              rotationSpeed={0.008}
              position={{ x: 0, y: 0, z: 0 }}
              forceVisible={true}
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <section className="py-32 bg-black px-8 md:px-16 lg:px-24 relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8">

              {/* 1. Introduction */}
              <section>
                <h2 className="text-3xl font-primary text-white mb-6">1. Introduction</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    Creative Technology Collective ("CTC", "we", "us", or "our") is committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, store, and protect your information when you interact with our services, website, and community at creativetechnologists.nl and creativetechcollective.com.
                  </p>
                  <p>
                    This policy applies to all users of our platform, including individual members, company account holders, and website visitors. By using our services or providing us with your information, you consent to the practices described in this Privacy Policy.
                  </p>
                </div>
              </section>

              {/* 2. Information We Collect */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">2. Information We Collect</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">2.1 Personal Information</h3>
                  <p className="ml-6">
                    We collect personal information that you voluntarily provide to us, including:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>Name, email address, and contact information</li>
                    <li>Professional background, skills, expertise, and portfolio links</li>
                    <li>Profile biography, social media links, and professional website URLs</li>
                    <li>Creative spectrum self-assessment data (your position on the design-to-development spectrum)</li>
                    <li>Profile images and photographs you upload</li>
                    <li>Messages, feedback, and other communications sent through our platform</li>
                    <li>Beta program applications and feedback submissions</li>
                  </ul>

                  <h3 className="text-xl font-primary text-white ml-6">2.2 Company Information</h3>
                  <p className="ml-6">
                    If you register a company account, we collect:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>Company name, website, and industry</li>
                    <li>Contact person name and email address</li>
                    <li>Team size and hiring needs</li>
                    <li>Job requirements and role descriptions submitted for talent matching</li>
                  </ul>

                  <h3 className="text-xl font-primary text-white ml-6">2.3 Technical Information</h3>
                  <p className="ml-6">
                    We automatically collect certain technical information when you visit our website:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>IP address, browser type, and device information</li>
                    <li>Pages visited, time spent on pages, and navigation patterns (via Google Analytics 4)</li>
                    <li>Referring websites and search terms</li>
                    <li>Online/offline presence status and last-seen timestamps (visible to other members)</li>
                  </ul>

                  <h3 className="text-xl font-primary text-white ml-6">2.4 Enriched Profile Data</h3>
                  <p className="ml-6">
                    To improve the accuracy of our talent matching and member directory, we may supplement your profile information with publicly available data gathered from URLs you provide (such as portfolio sites, LinkedIn profiles, or personal websites). This enrichment is performed using automated web search tools provided by Jina AI to discover additional projects, work experience, and portfolio content related to your professional profile. The enriched data is stored alongside your profile and used to generate AI embeddings (see Section 4).
                  </p>
                </div>
              </section>

              {/* 3. How We Use Your Information */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">3. How We Use Your Information</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>We use your personal information for the following purposes:</p>
                  <ul className="list-disc list-inside ml-6 space-y-2">
                    <li>Managing your membership profile and displaying it in our member directory</li>
                    <li>Facilitating direct messaging between members and companies</li>
                    <li>AI-powered talent matching and job opportunity recommendations (see Section 4)</li>
                    <li>Sending newsletters, event notifications, and community updates</li>
                    <li>Processing company account applications and credit purchases</li>
                    <li>Sending automated email notifications (e.g., new messages, job matches, account approvals)</li>
                    <li>Providing real-time features such as online presence indicators and typing status</li>
                    <li>Improving our services through analytics, feedback collection, and beta testing</li>
                    <li>Responding to inquiries and providing support</li>
                    <li>Administering the platform (profile approvals, content moderation, user management)</li>
                  </ul>
                </div>
              </section>

              {/* 4. AI Processing & Automated Decision-Making */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">4. AI Processing &amp; Automated Decision-Making</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    CTC uses artificial intelligence and machine learning technologies to power core features of our platform. We believe in full transparency about how these systems work.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">4.1 Profile Embeddings (OpenAI)</h3>
                  <p className="ml-6">
                    Your profile data — including skills, biography, portfolio content, and enriched profile information — is sent to OpenAI's API to generate mathematical representations called "vector embeddings" using the <code className="text-pink-400">text-embedding-3-small</code> model. These embeddings are stored in our database and used for similarity search across member profiles. This allows us to identify members whose skills and experience are relevant to specific job opportunities.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">4.2 AI Talent Matching (Anthropic)</h3>
                  <p className="ml-6">
                    When companies search for talent, your profile data may be sent to Anthropic's Claude AI API (<code className="text-pink-400">claude-sonnet-4-20250514</code>) for intelligent candidate matching. The AI analyzes your skills, experience, and portfolio against job requirements to generate relevance scores (0–100), match reasoning, and skill gap analysis. These AI-generated assessments are stored in our database and may be reviewed by CTC administrators before being shared with companies.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">4.3 Your Rights Regarding AI Processing</h3>
                  <p className="ml-6">
                    In accordance with GDPR Article 22 and applicable AI transparency laws, you have the right to:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>Request human review of any AI-generated match or assessment</li>
                    <li>Object to automated profiling and request that your profile be excluded from AI matching</li>
                    <li>Request an explanation of how AI-generated scores and recommendations were determined</li>
                    <li>Request deletion of your AI-generated embeddings and match data</li>
                  </ul>
                  <p className="ml-6">
                    To exercise these rights, contact us at <a href="mailto:dwayne@creativetechnologists.nl" className="text-pink-400 hover:text-pink-300">dwayne@creativetechnologists.nl</a>.
                  </p>
                </div>
              </section>

              {/* 5. Data Storage and Security */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">5. Data Storage and Security</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">5.1 Storage Platform</h3>
                  <p className="ml-6">
                    All user data is stored in Supabase, a hosted PostgreSQL database platform. Supabase provides our database, authentication, real-time messaging infrastructure, and file storage. Your data is stored on Supabase's cloud infrastructure with encryption at rest and in transit.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">5.2 Security Measures</h3>
                  <p className="ml-6">
                    We implement the following security measures to protect your personal information:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>Row-Level Security (RLS) policies to ensure users can only access authorized data</li>
                    <li>Encrypted authentication tokens and secure session management</li>
                    <li>HTTPS encryption for all data in transit</li>
                    <li>Limited access to personal data on a need-to-know basis</li>
                    <li>Service role keys restricted to server-side API operations only</li>
                  </ul>

                  <h3 className="text-xl font-primary text-white ml-6">5.3 File Storage</h3>
                  <p className="ml-6">
                    Profile images and message attachments are stored in Supabase Storage buckets with access controls. Uploaded images are associated with your user account and may be publicly visible as part of your member profile.
                  </p>
                </div>
              </section>

              {/* 6. Direct Messaging */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">6. Direct Messaging</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    Our platform provides a direct messaging system that enables communication between members and companies. When you use messaging, we collect and store:
                  </p>
                  <ul className="list-disc list-inside ml-6 space-y-2">
                    <li>Message content, timestamps, and sender/recipient information</li>
                    <li>Read receipts (when a message has been read by the recipient)</li>
                    <li>Typing indicators (temporarily stored to show when someone is typing)</li>
                    <li>File attachments uploaded within conversations</li>
                    <li>Message reactions (emoji responses linked to your user account)</li>
                  </ul>
                  <p>
                    Messages are delivered in real-time via Supabase Realtime channels. If a recipient is offline, we may send an email notification to alert them of the new message.
                  </p>
                </div>
              </section>

              {/* 7. Company & Employer Data Processing */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">7. Company &amp; Employer Data Processing</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    CTC operates a two-sided platform connecting creative technology professionals with companies seeking talent. Company accounts enable employers to:
                  </p>
                  <ul className="list-disc list-inside ml-6 space-y-2">
                    <li>Submit job requirements and search for matching talent using AI-powered tools</li>
                    <li>View member profiles that match their requirements (subject to admin approval)</li>
                    <li>Send contact requests to connect with specific members</li>
                    <li>Communicate with members through the direct messaging system</li>
                  </ul>
                  <p>
                    Company accounts require approval by CTC administrators before gaining access. Companies purchase message credits and analysis credits to use platform features. Member profiles may be shared with approved companies as part of the talent matching process.
                  </p>
                </div>
              </section>

              {/* 8. Payment Processing */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">8. Payment Processing</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    Payment processing for credit purchases is handled by Stripe, Inc., a PCI-DSS compliant payment processor. When you make a purchase:
                  </p>
                  <ul className="list-disc list-inside ml-6 space-y-2">
                    <li>Payment card details are collected and processed directly by Stripe — we never store your full card number</li>
                    <li>We store: Stripe payment IDs, transaction amounts, purchase timestamps, and credit bundle details</li>
                    <li>Payment data is linked to your company account for credit tracking and billing purposes</li>
                  </ul>
                  <p>
                    For details on how Stripe processes your payment data, please refer to <a href="https://stripe.com/privacy" className="text-pink-400 hover:text-pink-300" target="_blank" rel="noopener noreferrer">Stripe's Privacy Policy</a>.
                  </p>
                </div>
              </section>

              {/* 9. Analytics & Tracking */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">9. Analytics &amp; Tracking</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">9.1 Google Analytics 4</h3>
                  <p className="ml-6">
                    We use Google Analytics 4 (measurement ID: <code className="text-pink-400">G-Z517VSCQWM</code>) to understand how visitors use our website. Google Analytics collects:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>Pages visited, session duration, and navigation paths</li>
                    <li>Approximate geographic location (derived from IP address)</li>
                    <li>Device type, browser, operating system, and screen resolution</li>
                    <li>Traffic source and referral information</li>
                    <li>Demographic and interest data (aggregated)</li>
                  </ul>
                  <p className="ml-6">
                    Google Analytics data is processed by Google LLC. For more information, see <a href="https://policies.google.com/privacy" className="text-pink-400 hover:text-pink-300" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">9.2 User Presence Tracking</h3>
                  <p className="ml-6">
                    When you are logged in, we track your online/offline status and last-seen timestamp. This information is visible to other members and companies on the platform. Your presence status is updated in real-time via periodic heartbeat signals and cleared when you close the browser or go offline.
                  </p>
                </div>
              </section>

              {/* 10. Cookies, localStorage & Tracking Technologies */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">10. Cookies, localStorage &amp; Tracking Technologies</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">10.1 Cookies</h3>
                  <p className="ml-6">
                    We use cookies and similar technologies to enhance your browsing experience, analyze website traffic, and maintain your authenticated session. Google Analytics sets its own cookies to track website usage.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">10.2 localStorage</h3>
                  <p className="ml-6">
                    We use your browser's localStorage (a client-side storage mechanism distinct from cookies) to store:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>Your cookie consent preference</li>
                    <li>Authentication session tokens (managed by Supabase)</li>
                    <li>Feature flag overrides (for beta testing)</li>
                    <li>UI state preferences (e.g., feedback widget dismissal)</li>
                  </ul>

                  <h3 className="text-xl font-primary text-white ml-6">10.3 Cookie Control</h3>
                  <p className="ml-6">
                    You can control cookie settings through your browser preferences. Clearing localStorage will sign you out and reset your preferences. Disabling cookies or localStorage may limit functionality.
                  </p>
                </div>
              </section>

              {/* 11. Third-Party Service Providers */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">11. Third-Party Service Providers (Sub-Processors)</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    We share your data with the following third-party service providers who process data on our behalf:
                  </p>
                  <div className="overflow-x-auto ml-6">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-700">
                          <th className="text-left py-3 pr-4 text-white font-primary">Service</th>
                          <th className="text-left py-3 pr-4 text-white font-primary">Purpose</th>
                          <th className="text-left py-3 text-white font-primary">Data Shared</th>
                        </tr>
                      </thead>
                      <tbody className="text-zinc-300">
                        <tr className="border-b border-zinc-800">
                          <td className="py-3 pr-4 font-medium">Supabase</td>
                          <td className="py-3 pr-4">Database, authentication, real-time messaging, file storage</td>
                          <td className="py-3">All user data, profile images, messages</td>
                        </tr>
                        <tr className="border-b border-zinc-800">
                          <td className="py-3 pr-4 font-medium">OpenAI</td>
                          <td className="py-3 pr-4">Profile vector embeddings for similarity search</td>
                          <td className="py-3">Profile text, skills, portfolio content</td>
                        </tr>
                        <tr className="border-b border-zinc-800">
                          <td className="py-3 pr-4 font-medium">Anthropic</td>
                          <td className="py-3 pr-4">AI-powered talent matching and analysis</td>
                          <td className="py-3">Member profiles, job requirements</td>
                        </tr>
                        <tr className="border-b border-zinc-800">
                          <td className="py-3 pr-4 font-medium">Stripe</td>
                          <td className="py-3 pr-4">Payment processing for credit purchases</td>
                          <td className="py-3">Payment details, company IDs, transaction data</td>
                        </tr>
                        <tr className="border-b border-zinc-800">
                          <td className="py-3 pr-4 font-medium">Google Analytics (GA4)</td>
                          <td className="py-3 pr-4">Website analytics and traffic measurement</td>
                          <td className="py-3">IP address, device info, browsing behavior</td>
                        </tr>
                        <tr className="border-b border-zinc-800">
                          <td className="py-3 pr-4 font-medium">Jina AI</td>
                          <td className="py-3 pr-4">Web search for profile enrichment</td>
                          <td className="py-3">Member names, profile URLs, portfolio links</td>
                        </tr>
                        <tr className="border-b border-zinc-800">
                          <td className="py-3 pr-4 font-medium">n8n (self-hosted)</td>
                          <td className="py-3 pr-4">Workflow automation, email processing, notifications</td>
                          <td className="py-3">Email addresses, member data, event triggers</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p>
                    We do not sell, rent, or trade your personal information to third parties for marketing purposes. Data is shared with sub-processors solely for the purposes described above and subject to appropriate data processing agreements.
                  </p>
                </div>
              </section>

              {/* 12. Job Matching & Talent Pipeline */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">12. Job Matching &amp; Talent Pipeline</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    When companies submit job requirements through our platform, we use automated systems to match member profiles against those requirements. This process involves:
                  </p>
                  <ul className="list-disc list-inside ml-6 space-y-2">
                    <li>Vector similarity search across all member profile embeddings</li>
                    <li>AI-generated relevance scoring and skill gap analysis</li>
                    <li>Admin review and approval before matches are shared with companies</li>
                    <li>Member notification of potential job matches with the option to express interest or decline</li>
                  </ul>
                  <p>
                    Analysis credits are consumed for each matching operation. You may opt out of the job matching pipeline entirely by contacting us.
                  </p>
                </div>
              </section>

              {/* 13. Email Notifications */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">13. Email Notifications</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    We send automated email notifications triggered by platform activity, including:
                  </p>
                  <ul className="list-disc list-inside ml-6 space-y-2">
                    <li>New direct messages when you are offline</li>
                    <li>Job match notifications and opportunity alerts</li>
                    <li>Company account approval or rejection notices</li>
                    <li>Beta program broadcasts and announcements</li>
                    <li>Authentication emails (signup confirmation, password reset)</li>
                  </ul>
                  <p>
                    Emails are sent via Supabase Auth (for authentication) and our self-hosted n8n automation platform (for notifications). You can manage your notification preferences in your account settings or unsubscribe using the links provided in each email.
                  </p>
                </div>
              </section>

              {/* 14. Beta Program */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">14. Beta Program</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    If you participate in our beta program, we additionally collect:
                  </p>
                  <ul className="list-disc list-inside ml-6 space-y-2">
                    <li>Beta application details (submitted during signup)</li>
                    <li>Feedback submissions including ratings, categories, and free-text comments</li>
                    <li>Feature usage patterns specific to beta features</li>
                  </ul>
                  <p>
                    Beta participants may receive broadcast emails about new features, updates, and requests for feedback. Feedback data is used to improve the platform and may be reviewed by CTC administrators.
                  </p>
                </div>
              </section>

              {/* 15. Information Sharing and Disclosure */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">15. Information Sharing and Disclosure</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    Beyond the sub-processors listed in Section 11, we may disclose personal information in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside ml-6 space-y-2">
                    <li>When required by law, legal process, or government request</li>
                    <li>To protect the rights, property, or safety of CTC or our community</li>
                    <li>With your explicit consent for specific purposes</li>
                    <li>In connection with a business transfer (with continued privacy protection)</li>
                    <li>To approved company accounts as part of the talent matching process (see Sections 7 and 12)</li>
                  </ul>
                </div>
              </section>

              {/* 16. Admin Access */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">16. Administrative Access</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    CTC administrators have access to platform data necessary for operating and moderating the community. This includes the ability to:
                  </p>
                  <ul className="list-disc list-inside ml-6 space-y-2">
                    <li>View and approve/reject member profiles and company applications</li>
                    <li>Manage job submissions, matches, and credits</li>
                    <li>View user activity and conversation metadata for moderation purposes</li>
                    <li>Send broadcast communications to beta participants</li>
                    <li>Reset user passwords upon request</li>
                  </ul>
                  <p>
                    Administrative access is restricted to authorized CTC team members and uses a service role with elevated database permissions that bypasses standard Row-Level Security policies.
                  </p>
                </div>
              </section>

              {/* 17. Your Rights and Choices */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">17. Your Rights and Choices</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">17.1 Access and Portability</h3>
                  <p className="ml-6">
                    You may request a copy of your personal information held by CTC, including your profile data, messages, and AI-generated match data.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">17.2 Correction</h3>
                  <p className="ml-6">
                    You may update your profile information directly through the platform or request corrections by contacting us.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">17.3 Deletion</h3>
                  <p className="ml-6">
                    You may request deletion of your account and associated data, including profile information, messages, AI embeddings, match history, and uploaded files. Contact us at <a href="mailto:dwayne@creativetechnologists.nl" className="text-pink-400 hover:text-pink-300">dwayne@creativetechnologists.nl</a> to request deletion.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">17.4 Objection to AI Processing</h3>
                  <p className="ml-6">
                    You have the right to object to automated profiling and AI-based processing of your data. See Section 4.3 for details.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">17.5 Communication Preferences</h3>
                  <p className="ml-6">
                    You can unsubscribe from newsletters and non-essential communications at any time using the unsubscribe link in our emails or by contacting us directly.
                  </p>
                </div>
              </section>

              {/* 18. Data Retention */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">18. Data Retention</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    We retain personal information as follows:
                  </p>
                  <ul className="list-disc list-inside ml-6 space-y-2">
                    <li><strong>Account data:</strong> Retained for the duration of your membership and deleted upon account deletion request</li>
                    <li><strong>Messages:</strong> Retained for the duration of the conversation unless deleted by the user</li>
                    <li><strong>AI embeddings and match data:</strong> Retained while your profile is active; deleted upon request or account deletion</li>
                    <li><strong>Payment records:</strong> Retained as required by applicable tax and accounting regulations</li>
                    <li><strong>Analytics data:</strong> Retained per Google Analytics' standard retention policies</li>
                    <li><strong>Email addresses (newsletter):</strong> Retained until you unsubscribe or request removal</li>
                  </ul>
                </div>
              </section>

              {/* 19. International Data Transfers */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">19. International Data Transfers</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    As a global community, your information may be transferred to and processed in countries other than your country of residence. Our sub-processors (including Supabase, OpenAI, Anthropic, Stripe, and Google) operate infrastructure in the United States and other jurisdictions. We ensure that such transfers comply with applicable data protection laws, including GDPR, and maintain appropriate safeguards such as Standard Contractual Clauses where required.
                  </p>
                </div>
              </section>

              {/* 20. Children's Privacy */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">20. Children's Privacy</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    Our services are directed to professionals and are not intended for children under the age of 16. We do not knowingly collect personal information from children under 16. If we become aware that we have collected personal information from a child under 16, we will take steps to delete such information promptly.
                  </p>
                </div>
              </section>

              {/* Changes */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">21. Changes to This Privacy Policy</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    We may update this Privacy Policy to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by email or through our website. Your continued use of our services after such notification constitutes acceptance of the updated Privacy Policy.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">22. Contact Us</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    If you have questions, concerns, or requests regarding this Privacy Policy, your data, or our processing activities, please contact us:
                  </p>
                  <div className="ml-6 space-y-2">
                    <p><strong>Email:</strong> <a href="mailto:dwayne@creativetechnologists.nl" className="text-pink-400 hover:text-pink-300">dwayne@creativetechnologists.nl</a></p>
                    <p><strong>Website:</strong> <a href="https://creativetechcollective.com" className="text-pink-400 hover:text-pink-300">creativetechcollective.com</a></p>
                  </div>
                  <p>
                    We are committed to addressing your privacy concerns and will respond to your inquiries within 30 days.
                  </p>
                </div>
              </section>

              {/* Effective Date */}
              <div className="text-center pt-8 border-t border-zinc-800">
                <p className="text-zinc-400 text-sm font-secondary">
                  This Privacy Policy is effective as of March 16, 2026. It replaces all previous versions.
                </p>
                <p className="text-zinc-400 text-sm font-secondary mt-2">
                  By using our services, you acknowledge that you have read, understood, and agree to this Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Community CTA Section */}
      <section className="py-24 bg-zinc-900/30 px-8 md:px-16 lg:px-24 relative z-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-primary font-medium text-white mb-4">
            Want to join our community of creative technologists?
          </h2>
          <p className="text-zinc-400 font-secondary mb-8">
            Subscribe to stay updated with the latest news, events, and opportunities.
          </p>
          <EmailSignup minimal={true} />
        </div>
      </section>

      {/* Vertical Text on Left Edge */}
      <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 -rotate-90 origin-center z-10">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Privacy • Policy • 2026
        </span>
      </div>

      {/* Vertical Text on Right Edge */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 rotate-90 origin-center z-10">
        <span className="text-xs font-secondary tracking-[0.3em] text-zinc-600 uppercase whitespace-nowrap">
          Creative • Technology • Collective
        </span>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
