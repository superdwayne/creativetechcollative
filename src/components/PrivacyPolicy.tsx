import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white py-8 md:py-16 w-full">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 px-8">
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-primary text-white leading-tight mb-6 md:mb-8">
            Privacy<br />
            Policy
          </h1>
          <p className="text-zinc-400 text-base md:text-lg font-medium font-secondary max-w-2xl mx-auto">
            Last updated January 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-zinc-900/30 border-0 md:border border-zinc-800 md:rounded-xl p-6 md:p-8">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-8">
              
              {/* Introduction */}
              <section>
                <h2 className="text-3xl font-primary text-white mb-6">1. Introduction</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    Creative Technology Collective ("CTC", "we", "us", or "our") is committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, store, and protect your information when you interact with our services, website, and community.
                  </p>
                  <p>
                    By using our services or providing us with your information, you consent to the practices described in this Privacy Policy.
                  </p>
                </div>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">2. Information We Collect</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">2.1 Personal Information</h3>
                  <p className="ml-6">
                    We collect personal information that you voluntarily provide to us, including:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>Name and email address (when subscribing to our newsletter or contacting us)</li>
                    <li>Professional background and expertise (for membership applications)</li>
                    <li>Contact information and communication preferences</li>
                    <li>Project information and collaboration details</li>
                    <li>Feedback, comments, and other communications</li>
                  </ul>
                  
                  <h3 className="text-xl font-primary text-white ml-6">2.2 Technical Information</h3>
                  <p className="ml-6">
                    We automatically collect certain technical information when you visit our website:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>IP address and browser information</li>
                    <li>Device type and operating system</li>
                    <li>Pages visited and time spent on our website</li>
                    <li>Referring websites and search terms</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </section>

              {/* How We Use Your Information */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">3. How We Use Your Information</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">3.1 Primary Uses</h3>
                  <p className="ml-6">
                    We use your personal information for the following purposes:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>Sending newsletters, updates, and relevant community information</li>
                    <li>Processing membership applications and managing member directory</li>
                    <li>Facilitating networking and collaboration opportunities</li>
                    <li>Organizing events, workshops, and educational activities</li>
                    <li>Responding to inquiries and providing customer support</li>
                    <li>Improving our services and website functionality</li>
                  </ul>

                  <h3 className="text-xl font-primary text-white ml-6">3.2 Communication</h3>
                  <p className="ml-6">
                    We use your email address to keep you updated with relevant information about creative technology, community activities, and opportunities. All communications are related to our mission and community objectives.
                  </p>
                </div>
              </section>

              {/* Data Storage and Security */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">4. Data Storage and Security</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">4.1 Storage Platform</h3>
                  <p className="ml-6">
                    We securely store email addresses and related information in Notion, a trusted productivity platform. This allows us to efficiently manage our community communications and member information while maintaining appropriate security standards.
                  </p>
                  
                  <h3 className="text-xl font-primary text-white ml-6">4.2 Security Measures</h3>
                  <p className="ml-6">
                    We implement comprehensive security measures to protect your personal information:
                  </p>
                  <ul className="list-disc list-inside ml-10 space-y-2">
                    <li>End-to-end encryption when handling and transmitting emails</li>
                    <li>Secure storage with access controls and authentication</li>
                    <li>Regular security audits and updates</li>
                    <li>Limited access to personal data on a need-to-know basis</li>
                    <li>Secure backup and recovery procedures</li>
                  </ul>

                  <h3 className="text-xl font-primary text-white ml-6">4.3 Data Integrity</h3>
                  <p className="ml-6">
                    We maintain the accuracy and integrity of your personal information and regularly review our data to ensure it remains current and relevant.
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

              {/* Your Rights and Choices */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">6. Your Rights and Choices</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">6.1 Email Removal</h3>
                  <p className="ml-6">
                    You have the right to request removal of your email address from our systems at any time. To request removal, please contact us at <a href="mailto:hello@creativetechcollective.com" className="text-pink-400 hover:text-pink-300">hello@creativetechcollective.com</a>. We will process your request promptly and confirm when your data has been removed.
                  </p>
                  
                  <h3 className="text-xl font-primary text-white ml-6">6.2 Access and Correction</h3>
                  <p className="ml-6">
                    You may request access to your personal information or request corrections to ensure accuracy. Contact us using the information provided below.
                  </p>

                  <h3 className="text-xl font-primary text-white ml-6">6.3 Communication Preferences</h3>
                  <p className="ml-6">
                    You can update your communication preferences or unsubscribe from our newsletters at any time by using the unsubscribe link in our emails or contacting us directly.
                  </p>
                </div>
              </section>

              {/* Cookies and Tracking */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">7. Cookies and Tracking Technologies</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <h3 className="text-xl font-primary text-white ml-6">7.1 Cookie Usage</h3>
                  <p className="ml-6">
                    We use cookies and similar technologies to enhance your browsing experience, analyze website traffic, and understand user preferences. These technologies help us improve our services and provide personalized content.
                  </p>
                  
                  <h3 className="text-xl font-primary text-white ml-6">7.2 Cookie Control</h3>
                  <p className="ml-6">
                    You can control cookie settings through your browser preferences. However, disabling certain cookies may limit some functionality of our website.
                  </p>
                </div>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">8. Data Retention</h2>
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
                <h2 className="text-2xl font-primary text-white mb-4">9. International Data Transfers</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    As a global community, your information may be transferred to and processed in countries other than your country of residence. We ensure that such transfers comply with applicable data protection laws and maintain appropriate safeguards to protect your information.
                  </p>
                </div>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">10. Children's Privacy</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    Our services are not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.
                  </p>
                </div>
              </section>

              {/* Changes to Privacy Policy */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">11. Changes to This Privacy Policy</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by email or through our website. Your continued use of our services after such notification constitutes acceptance of the updated Privacy Policy.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-primary text-white mb-4">12. Contact Us</h2>
                <div className="space-y-4 text-zinc-300 font-secondary leading-relaxed">
                  <p>
                    If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                  </p>
                  <div className="ml-6 space-y-2">
                    <p><strong>Email:</strong> <a href="mailto:hello@creativetechcollective.com" className="text-pink-400 hover:text-pink-300">hello@creativetechcollective.com</a></p>
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
                  This Privacy Policy is effective as of January 1, 2025.
                </p>
                <p className="text-zinc-400 text-sm font-secondary mt-2">
                  By using our services, you acknowledge that you have read, understood, and agree to this Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;