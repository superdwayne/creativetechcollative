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
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
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
              <span className="block text-3xl font-primary font-medium">13</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Sections</span>
            </div>
            <div>
              <span className="block text-3xl font-primary font-medium">2025</span>
              <span className="text-xs font-secondary text-zinc-500 tracking-wide uppercase">Updated</span>
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
              
              {/* Introduction */}
              <section>
                <h2 className="text-3xl font-primary text-white mb-6">1. Introduction</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    These Terms and Conditions ("Terms") govern your membership in and use of services provided by Creative Technology Collective ("CTC", "the Organization", "we", "us", or "our"), a professional members group for creative technologists.
                  </p>
                  <p>
                    By becoming a member of CTC or using our services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not participate in our organization or use our services.
                  </p>
                </div>
              </section>

              {/* Membership */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">2. Membership</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">2.1 Eligibility</h3>
                  <p className="ml-6">
                    Membership is open to professionals working in creative technology fields, including but not limited to digital design, interactive media, creative coding, and emerging technology applications. Members must be nominated by existing members and approved by the organization.
                  </p>
                  
                  <h3 className="text-xl font-primary text-white ml-6">2.2 Member Obligations</h3>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>Maintain professional conduct in all interactions</li>
                    <li>Respect confidentiality of member discussions and shared information</li>
                    <li>Contribute meaningfully to the organization's objectives</li>
                    <li>Comply with all applicable laws and regulations</li>
                    <li>Notify the organization of any changes to contact information</li>
                  </ul>

                  <h3 className="text-xl font-primary text-white ml-6">2.3 Termination of Membership</h3>
                  <p className="ml-6">
                    Membership may be terminated by the member at any time with written notice. The organization reserves the right to terminate membership for violation of these Terms, unprofessional conduct, or failure to meet membership obligations.
                  </p>
                </div>
              </section>

              {/* Services and Resources */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">3. Services and Resources</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">3.1 Resource Directory</h3>
                  <p className="ml-6">
                    CTC maintains a curated directory of tools, resources, and educational materials for creative technologists. Access to this directory is provided to members for professional development purposes only.
                  </p>
                  
                  <h3 className="text-xl font-primary text-white ml-6">3.2 Networking and Events</h3>
                  <p className="ml-6">
                    The organization may organize networking events, workshops, and professional development activities. Participation is voluntary and subject to separate terms and conditions as applicable.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">3.3 Communications</h3>
                  <p className="ml-6">
                    Members may receive newsletters, announcements, and other communications related to organization activities. Members may opt out of non-essential communications at any time.
                  </p>
                </div>
              </section>

              {/* Intellectual Property */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">4. Intellectual Property</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">4.1 Member Content</h3>
                  <p className="ml-6">
                    Members retain ownership of any content, ideas, or materials they contribute to the organization. By contributing content, members grant CTC a non-exclusive license to use, display, and distribute such content for organizational purposes.
                  </p>
                  
                  <h3 className="text-xl font-primary text-white ml-6">4.2 Organization Materials</h3>
                  <p className="ml-6">
                    All materials, resources, and content provided by CTC remain the property of the organization or its licensors. Members may use these materials for personal professional development but may not redistribute or commercialize them without express written permission.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">4.3 Third-Party Resources</h3>
                  <p className="ml-6">
                    The organization may provide links to or information about third-party resources. These resources remain the property of their respective owners and are subject to their own terms of use.
                  </p>
                </div>
              </section>

              {/* Information Sharing */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">5. Information Sharing and Disclosure</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">5.1 No Third-Party Sharing</h3>
                  <p className="ml-6">
                    We do not sell, rent, trade, or otherwise share your personal information with third parties for marketing or commercial purposes. Your email address and personal information remain confidential and are used exclusively for CTC community purposes.
                  </p>
                  
                  <h3 className="text-xl font-primary text-white ml-6">5.2 Limited Exceptions</h3>
                  <p className="ml-6">
                    We may disclose personal information only in the following limited circumstances:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>When required by law or legal process</li>
                    <li>To protect the rights, property, or safety of CTC or our community</li>
                    <li>With your explicit consent for specific purposes</li>
                    <li>In connection with a business transfer (with continued privacy protection)</li>
                  </ul>
                </div>
              </section>

              {/* Third-Party Resources and Links */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">6. Third-Party Resources and External Links</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">6.1 Resource Directory</h3>
                  <p className="ml-6">
                    Our resource directory contains links to third-party websites, tools, services, and content ("Third-Party Resources"). These resources are provided for informational and educational purposes to benefit our creative technology community.
                  </p>
                  
                  <h3 className="text-xl font-primary text-white ml-6">6.2 No Endorsement</h3>
                  <p className="ml-6">
                    The inclusion of any Third-Party Resource in our directory does not constitute an endorsement, recommendation, or guarantee by CTC. We do not warrant the accuracy, completeness, reliability, or suitability of any Third-Party Resource for any particular purpose.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">6.3 Intellectual Property Respect</h3>
                  <p className="ml-6">
                    We respect the intellectual property rights of all third parties. Our use of thumbnails, descriptions, and links is intended for informational purposes under fair use principles. All trademarks, service marks, and company names mentioned belong to their respective owners.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">6.4 Content Removal</h3>
                  <p className="ml-6">
                    If you are the owner of content linked in our directory and wish to have it removed, please contact us at <a href="mailto:dwayne@creativetechnologists.nl" className="text-pink-400 hover:text-pink-300">dwayne@creativetechnologists.nl</a>. We will promptly review and respond to legitimate removal requests.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">6.5 External Website Disclaimer</h3>
                  <p className="ml-6">
                    When you click on external links, you leave our website and are subject to the terms, conditions, and privacy policies of the destination website. We are not responsible for:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>The content, accuracy, or availability of Third-Party Resources</li>
                    <li>Any damages, losses, or issues arising from your use of Third-Party Resources</li>
                    <li>The privacy practices or data collection of external websites</li>
                    <li>Any transactions or interactions you have with third parties</li>
                  </ul>

                  <h3 className="text-xl font-primary text-white ml-6">6.6 User Responsibility</h3>
                  <p className="ml-6">
                    Users access Third-Party Resources at their own risk and discretion. We recommend reviewing the terms of service and privacy policies of any external websites before providing personal information or engaging with their services.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">6.7 Link Maintenance</h3>
                  <p className="ml-6">
                    While we strive to maintain current and functional links, we cannot guarantee that all external links will remain active or that the content will remain unchanged. We periodically review our resource directory but are not obligated to monitor or update external links continuously.
                  </p>
                </div>
              </section>

              {/* Your Rights and Choices */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">7. Your Rights and Choices</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">7.1 Email Removal</h3>
                  <p className="ml-6">
                    You have the right to request removal of your email address from our systems at any time. To request removal, please contact us at <a href="mailto:dwayne@creativetechnologists.nl" className="text-pink-400 hover:text-pink-300">dwayne@creativetechnologists.nl</a>. We will process your request promptly and confirm when your data has been removed.
                  </p>
                  
                  <h3 className="text-xl font-primary text-white ml-6">7.2 Access and Correction</h3>
                  <p className="ml-6">
                    You may request access to your personal information or request corrections to ensure accuracy. Contact us using the information provided below.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">7.3 Communication Preferences</h3>
                  <p className="ml-6">
                    You can update your communication preferences or unsubscribe from our newsletters at any time by using the unsubscribe link in our emails or contacting us directly.
                  </p>
                </div>
              </section>

              {/* Cookies and Tracking */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">8. Cookies and Tracking Technologies</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">8.1 Cookie Usage</h3>
                  <p className="ml-6">
                    We use cookies and similar technologies to enhance your browsing experience, analyze website traffic, and understand user preferences. These technologies help us improve our services and provide personalized content.
                  </p>
                  
                  <h3 className="text-xl font-primary text-white ml-6">8.2 Cookie Control</h3>
                  <p className="ml-6">
                    You can control cookie settings through your browser preferences. However, disabling certain cookies may limit some functionality of our website.
                  </p>
                </div>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">9. Data Retention</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    We retain personal information only as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. When information is no longer needed, we securely delete or anonymize it.
                  </p>
                  <p>
                    Email addresses are retained until you request removal or unsubscribe from our communications.
                  </p>
                </div>
              </section>

              {/* International Data Transfers */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">10. International Data Transfers</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    As a global community, your information may be transferred to and processed in countries other than your country of residence. We ensure that such transfers comply with applicable data protection laws and maintain appropriate safeguards to protect your information.
                  </p>
                </div>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">11. Children's Privacy</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    Our services are not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.
                  </p>
                </div>
              </section>

              {/* Changes to Privacy Policy */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">12. Changes to This Privacy Policy</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by email or through our website. Your continued use of our services after such notification constitutes acceptance of the updated Privacy Policy.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">13. Contact Us</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                  </p>
                  <div className="ml-6 space-y-2">
                    <p><strong>Email:</strong> <a href="mailto:dwayne@creativetechnologists.nl" className="text-pink-400 hover:text-pink-300">dwayne@creativetechnologists.nl</a></p>
                    <p><strong>Website:</strong> <a href="https://creativetechcollective.com" className="text-pink-400 hover:text-pink-300">creativetechcollective.com</a></p>
                  </div>
                  <p>
                    We are committed to addressing your privacy concerns and will respond to your inquiries promptly.
                  </p>
                </div>
              </section>

              {/* Effective Date */}
              <div className="text-center pt-8 border-t border-zinc-800">
                <p className="text-zinc-400 text-sm font-secondary">
                  These Terms and Conditions are effective as of January 1, 2025.
                </p>
                <p className="text-zinc-400 text-sm font-secondary mt-2">
                  By continuing your membership, you acknowledge that you have read, understood, and agree to be bound by these Terms.
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
          Creative • Technology • Collective • Amsterdam/London • 2025
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