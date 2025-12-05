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
            <span className="text-xs font-secondary tracking-[0.3em] text-zinc-500 uppercase">
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
              <span className="block text-3xl font-primary font-medium">12</span>
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
                    You have the right to request removal of your email address from our systems at any time. To request removal, please contact us at <a href="mailto:dwayne@creativetechnologists.nl" className="text-pink-400 hover:text-pink-300">dwayne@creativetechnologists.nl</a>. We will process your request promptly and confirm when your data has been removed.
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
                  This Privacy Policy is effective as of January 1, 2025.
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
          Privacy • Policy • 2025
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