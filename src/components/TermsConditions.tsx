import React from 'react';
import ImageCube from './ImageCube';
import EmailSignup from './EmailSignup';

const TermsConditions: React.FC = () => {
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
            <span className="block">Terms &</span>
            <span className="block text-zinc-500">Conditions</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-md font-secondary leading-relaxed mb-12">
            Please read these terms carefully before using our services or becoming a member of the Creative Technology Collective.
          </p>

          <div className="flex gap-12 pt-8 border-t border-zinc-800">
            <div>
              <span className="block text-3xl font-primary font-medium">17</span>
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
                    These Terms and Conditions ("Terms") govern your membership in and use of services provided by Creative Technology Collective ("CTC", "the Organization", "we", "us", or "our"), a professional community for creative technologists operating at creativetechnologists.nl and creativetechcollective.com.
                  </p>
                  <p>
                    These Terms apply to all users of our platform, including individual members, company account holders, beta program participants, and website visitors. By creating an account, becoming a member, or using our services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use our services.
                  </p>
                </div>
              </section>

              {/* 2. Membership */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">2. Membership</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">2.1 Eligibility</h3>
                  <p className="ml-6">
                    Membership is open to professionals aged 16 or older working in creative technology fields, including but not limited to digital design, interactive media, creative coding, and emerging technology applications. Members must be approved by the organization.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">2.2 Member Obligations</h3>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>Maintain professional conduct in all interactions, including messaging</li>
                    <li>Respect confidentiality of member discussions and shared information</li>
                    <li>Provide accurate and truthful profile information</li>
                    <li>Comply with all applicable laws and regulations</li>
                    <li>Notify the organization of any changes to contact information</li>
                    <li>Not use the platform for spam, harassment, or unauthorized commercial solicitation</li>
                  </ul>

                  <h3 className="text-xl font-primary text-white ml-6">2.3 Profile Visibility</h3>
                  <p className="ml-6">
                    By creating a member profile, you understand that your profile information (name, skills, bio, portfolio links, and profile image) will be visible in the member directory to other approved members and, through the talent matching system, to approved company accounts.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">2.4 Termination of Membership</h3>
                  <p className="ml-6">
                    Membership may be terminated by the member at any time by contacting us. The organization reserves the right to suspend or terminate membership for violation of these Terms, unprofessional conduct, abuse of the messaging system, or failure to meet membership obligations. Upon termination, your profile will be removed from the directory, though some data may be retained as described in our Privacy Policy.
                  </p>
                </div>
              </section>

              {/* 3. Services and Resources */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">3. Services and Resources</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">3.1 Member Directory</h3>
                  <p className="ml-6">
                    CTC maintains a curated directory of creative technology professionals. Your approved profile is listed in this directory for networking and talent discovery purposes.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">3.2 Networking and Events</h3>
                  <p className="ml-6">
                    The organization may organize networking events, workshops, and professional development activities. Participation is voluntary and subject to separate terms as applicable.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">3.3 Communications</h3>
                  <p className="ml-6">
                    Members may receive newsletters, announcements, job match notifications, and other automated communications related to platform activity. Members may opt out of non-essential communications at any time.
                  </p>
                </div>
              </section>

              {/* 4. AI-Powered Features & Automated Processing */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">4. AI-Powered Features &amp; Automated Processing</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">4.1 Consent to AI Processing</h3>
                  <p className="ml-6">
                    By creating a profile on CTC, you acknowledge and agree that your profile data (including skills, biography, portfolio content, and enriched profile information) may be processed by artificial intelligence systems for the following purposes:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li><strong>Vector embeddings:</strong> Your profile text is sent to OpenAI to generate mathematical representations used for similarity search across the member directory</li>
                    <li><strong>Talent matching:</strong> Your profile may be analyzed by Anthropic's Claude AI to match you with relevant job opportunities submitted by companies</li>
                    <li><strong>Profile enrichment:</strong> Publicly available information from URLs you provide may be gathered using Jina AI's web search tools to supplement your profile</li>
                    <li><strong>Match scoring:</strong> AI-generated relevance scores, match reasoning, and skill gap analyses are produced and stored for each potential job match</li>
                  </ul>

                  <h3 className="text-xl font-primary text-white ml-6">4.2 No Solely Automated Decisions</h3>
                  <p className="ml-6">
                    AI-generated matches and scores are advisory only. All talent matches are reviewed by CTC administrators before being shared with companies. No binding decisions about your membership, access, or opportunities are made solely by automated systems without human oversight.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">4.3 Opting Out of AI Processing</h3>
                  <p className="ml-6">
                    You may request that your profile be excluded from AI-powered matching and embedding generation at any time by contacting us at <a href="mailto:dwayne@creativetechnologists.nl" className="text-pink-400 hover:text-pink-300">dwayne@creativetechnologists.nl</a>. Note that opting out will prevent you from appearing in talent search results.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">4.4 AI Accuracy Disclaimer</h3>
                  <p className="ml-6">
                    AI-generated match scores, reasoning, and assessments are probabilistic and may contain inaccuracies. CTC does not guarantee the accuracy, completeness, or suitability of AI-generated outputs. Companies and members should independently evaluate any AI-generated recommendations.
                  </p>
                </div>
              </section>

              {/* 5. Company Accounts & Employer Access */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">5. Company Accounts &amp; Employer Access</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">5.1 Account Registration</h3>
                  <p className="ml-6">
                    Companies may register for an account to access CTC's talent discovery platform. Company accounts require administrator approval and are subject to verification. By registering, the company representative warrants they have authority to bind the company to these Terms.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">5.2 Access to Member Data</h3>
                  <p className="ml-6">
                    Approved companies may access member profiles through the talent matching system. Companies agree to:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>Use member data solely for legitimate recruitment and hiring purposes</li>
                    <li>Not scrape, bulk-download, or redistribute member profile data</li>
                    <li>Respect member privacy and contact preferences</li>
                    <li>Not contact members outside of the CTC platform without their consent</li>
                    <li>Comply with all applicable employment and data protection laws</li>
                  </ul>

                  <h3 className="text-xl font-primary text-white ml-6">5.3 Contact Requests</h3>
                  <p className="ml-6">
                    Companies may submit contact requests to connect with specific members. Members have the right to accept or decline contact requests. CTC facilitates introductions but is not a party to any employment agreement between companies and members.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">5.4 Credit System</h3>
                  <p className="ml-6">
                    Company accounts operate on a credit-based system. Message credits are required to initiate conversations with members. Analysis credits are required for AI-powered talent searches. Credits are non-transferable between company accounts.
                  </p>
                </div>
              </section>

              {/* 6. Direct Messaging & Communications */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">6. Direct Messaging &amp; Communications</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">6.1 Acceptable Use</h3>
                  <p className="ml-6">
                    The messaging system is provided for professional communication between members and companies. You agree not to use messaging for:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>Spam, unsolicited commercial messages, or bulk messaging</li>
                    <li>Harassment, threats, hate speech, or abusive language</li>
                    <li>Sharing illegal, obscene, or harmful content</li>
                    <li>Impersonating another person or entity</li>
                    <li>Distributing malware or phishing links</li>
                  </ul>

                  <h3 className="text-xl font-primary text-white ml-6">6.2 Message Monitoring</h3>
                  <p className="ml-6">
                    CTC administrators may review message content for moderation purposes when investigating reported violations of these Terms. We do not routinely monitor private conversations but reserve the right to do so to enforce our acceptable use policy and respond to legal obligations.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">6.3 Message Retention</h3>
                  <p className="ml-6">
                    Messages are retained for the duration of the conversation. Users may not be able to permanently delete individual messages. Upon account deletion, your messages may be retained in anonymized form or deleted entirely at CTC's discretion.
                  </p>
                </div>
              </section>

              {/* 7. Payment, Credits & Billing */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">7. Payment, Credits &amp; Billing</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">7.1 Credit Purchases</h3>
                  <p className="ml-6">
                    Company accounts may purchase message credits and analysis credits through our platform. All purchases are processed by Stripe, Inc. By making a purchase, you agree to Stripe's <a href="https://stripe.com/legal" className="text-pink-400 hover:text-pink-300" target="_blank" rel="noopener noreferrer">Terms of Service</a>.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">7.2 Pricing</h3>
                  <p className="ml-6">
                    Credit prices are displayed at the time of purchase. CTC reserves the right to change pricing at any time. Price changes do not affect previously purchased credits.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">7.3 Refunds</h3>
                  <p className="ml-6">
                    Unused credits may be refunded within 14 days of purchase by contacting us. Used credits are non-refundable. Complimentary credits (included with account registration) are not eligible for refund.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">7.4 Credit Expiration</h3>
                  <p className="ml-6">
                    Purchased credits do not expire. Complimentary credits may be subject to expiration as specified at the time of grant.
                  </p>
                </div>
              </section>

              {/* 8. Beta Program */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">8. Beta Program</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">8.1 Beta Access</h3>
                  <p className="ml-6">
                    Beta features are made available on an "as-is" basis to selected members. CTC may modify, suspend, or discontinue any beta feature at any time without notice. Beta access does not guarantee future availability of any feature.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">8.2 Feedback</h3>
                  <p className="ml-6">
                    By submitting feedback through the beta program, you grant CTC a perpetual, non-exclusive, royalty-free license to use, modify, and incorporate your feedback into our products and services. You will not be compensated for feedback unless separately agreed in writing.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">8.3 Beta Reliability</h3>
                  <p className="ml-6">
                    Beta features may contain bugs, errors, or incomplete functionality. CTC is not liable for any loss of data, service interruptions, or other issues arising from the use of beta features.
                  </p>
                </div>
              </section>

              {/* 9. User Content License */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">9. User Content License</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">9.1 Your Content</h3>
                  <p className="ml-6">
                    You retain ownership of all content you submit to CTC, including profile information, messages, images, and portfolio materials ("User Content").
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">9.2 License Grant</h3>
                  <p className="ml-6">
                    By submitting User Content, you grant CTC a non-exclusive, worldwide, royalty-free license to:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>Display your profile in the member directory and talent matching results</li>
                    <li>Process your content through AI systems (OpenAI, Anthropic) for embedding generation and talent matching as described in Section 4</li>
                    <li>Enrich your profile with publicly available information from URLs you provide</li>
                    <li>Store, transmit, and deliver your messages to intended recipients</li>
                    <li>Display your profile image alongside your name in the platform</li>
                  </ul>
                  <p className="ml-6">
                    This license continues for the duration of your membership and terminates upon account deletion, except where retention is required by law or for legitimate business purposes (e.g., message history in conversations with other users).
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">9.3 Content Responsibility</h3>
                  <p className="ml-6">
                    You are solely responsible for User Content you submit. You represent that you have all necessary rights to grant the license above and that your content does not infringe any third-party rights.
                  </p>
                </div>
              </section>

              {/* 10. Intellectual Property */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">10. Intellectual Property</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">10.1 Organization Materials</h3>
                  <p className="ml-6">
                    All materials, resources, branding, and content provided by CTC (including the website design, logos, and curated resources) remain the property of the organization or its licensors. Members may not redistribute or commercialize these materials without express written permission.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">10.2 Third-Party Resources</h3>
                  <p className="ml-6">
                    The organization may provide links to or information about third-party resources. These resources remain the property of their respective owners and are subject to their own terms of use.
                  </p>
                </div>
              </section>

              {/* 11. Third-Party Resources & External Links */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">11. Third-Party Resources &amp; External Links</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">11.1 No Endorsement</h3>
                  <p className="ml-6">
                    The inclusion of any third-party resource in our directory or platform does not constitute an endorsement or guarantee by CTC.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">11.2 External Website Disclaimer</h3>
                  <p className="ml-6">
                    When you follow external links, you leave our platform and are subject to the terms and privacy policies of the destination. We are not responsible for the content, accuracy, or availability of third-party resources, or for any damages arising from their use.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">11.3 Content Removal</h3>
                  <p className="ml-6">
                    If you are the owner of content linked in our directory and wish to have it removed, please contact us at <a href="mailto:dwayne@creativetechnologists.nl" className="text-pink-400 hover:text-pink-300">dwayne@creativetechnologists.nl</a>.
                  </p>
                </div>
              </section>

              {/* 12. Data Processing */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">12. Data Processing &amp; Sub-Processors</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    CTC uses the following third-party services to process user data. By using our platform, you acknowledge that your data may be processed by these sub-processors as described in our <a href="/privacy" className="text-pink-400 hover:text-pink-300">Privacy Policy</a>:
                  </p>
                  <ul className="list-disc list-inside ml-6 space-y-2">
                    <li><strong>Supabase:</strong> Database, authentication, messaging, and file storage</li>
                    <li><strong>OpenAI:</strong> Profile embedding generation for similarity search</li>
                    <li><strong>Anthropic:</strong> AI-powered talent matching and analysis</li>
                    <li><strong>Stripe:</strong> Payment processing for credit purchases</li>
                    <li><strong>Google Analytics:</strong> Website analytics and traffic measurement</li>
                    <li><strong>Jina AI:</strong> Web search for profile enrichment</li>
                    <li><strong>n8n (self-hosted):</strong> Workflow automation and email notifications</li>
                  </ul>
                  <p>
                    We maintain appropriate data processing agreements with our sub-processors and ensure they provide adequate safeguards for your personal data in accordance with GDPR and applicable data protection laws.
                  </p>
                </div>
              </section>

              {/* 13. Limitation of Liability */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">13. Limitation of Liability</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    To the maximum extent permitted by applicable law:
                  </p>
                  <ul className="list-disc list-inside ml-6 space-y-2">
                    <li>CTC provides its services "as is" without warranties of any kind, express or implied</li>
                    <li>CTC is not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform</li>
                    <li>CTC is not responsible for the accuracy of AI-generated match results, scores, or recommendations</li>
                    <li>CTC is not a party to any employment, freelance, or contractor agreement between members and companies</li>
                    <li>CTC's total liability for any claims arising from use of the platform shall not exceed the amount paid by you to CTC in the 12 months preceding the claim</li>
                  </ul>
                </div>
              </section>

              {/* 14. International Users */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">14. International Users</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    CTC is a global community. By using our services, you consent to the transfer and processing of your data in jurisdictions outside your country of residence, including the United States and the European Union. We ensure compliance with applicable data protection laws including GDPR for users in the European Economic Area.
                  </p>
                </div>
              </section>

              {/* 15. Children */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">15. Age Requirement</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    Our services are directed to professionals and require users to be at least 16 years of age. By using our services, you represent that you meet this age requirement.
                  </p>
                </div>
              </section>

              {/* 16. Changes */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">16. Changes to These Terms</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    We may update these Terms from time to time. We will notify you of material changes by email or through our website. Your continued use of our services after notification constitutes acceptance of the updated Terms. If you do not agree with revised Terms, you must discontinue use of our services.
                  </p>
                </div>
              </section>

              {/* 17. Contact */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">17. Contact Us</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    If you have questions, concerns, or requests regarding these Terms, please contact us:
                  </p>
                  <div className="ml-6 space-y-2">
                    <p><strong>Email:</strong> <a href="mailto:dwayne@creativetechnologists.nl" className="text-pink-400 hover:text-pink-300">dwayne@creativetechnologists.nl</a></p>
                    <p><strong>Website:</strong> <a href="https://creativetechcollective.com" className="text-pink-400 hover:text-pink-300">creativetechcollective.com</a></p>
                  </div>
                  <p>
                    We are committed to addressing your concerns and will respond to your inquiries promptly.
                  </p>
                </div>
              </section>

              {/* Effective Date */}
              <div className="text-center pt-8 border-t border-zinc-800">
                <p className="text-zinc-400 text-sm font-secondary">
                  These Terms and Conditions are effective as of March 16, 2026. They replace all previous versions.
                </p>
                <p className="text-zinc-400 text-sm font-secondary mt-2">
                  By continuing your membership or use of our services, you acknowledge that you have read, understood, and agree to be bound by these Terms.
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
          Creative • Technology • Collective • Amsterdam/London • 2026
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

export default TermsConditions;
