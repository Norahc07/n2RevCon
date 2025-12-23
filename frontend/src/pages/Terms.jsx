import { Link } from 'react-router-dom';
import { DocumentTextIcon, ScaleIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link to="/" className="text-primary hover:text-primaryLight transition-colors duration-200 inline-flex items-center gap-2 mb-4">
            <span>← Back to Home</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-gray-600 mt-2">Terms and conditions for using N2 RevCon</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <DocumentTextIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Agreement to Terms</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using N2 RevCon ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all users, including administrators, officers, and viewers.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on this page. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* Account Registration */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircleIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Account Registration and Access</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Registration Requirements</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>You must provide accurate, current, and complete information during registration</li>
                  <li>You must verify your email address before accessing the Service</li>
                  <li>Your account must be approved by an administrator before you can log in</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must notify us immediately of any unauthorized access to your account</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Account Responsibilities</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>You must use a strong, unique password</li>
                  <li>You must not share your account credentials with others</li>
                  <li>You must log out when finished, especially on shared devices</li>
                  <li>You must comply with all applicable laws and regulations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Acceptable Use */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <ScaleIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Acceptable Use Policy</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any applicable local, state, national, or international law</li>
                <li>Attempt to gain unauthorized access to the Service or related systems</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                <li>Upload or transmit viruses, malware, or any other malicious code</li>
                <li>Access data not intended for you or log into accounts you are not authorized to access</li>
                <li>Modify, adapt, or hack the Service or attempt to reverse engineer any portion of the Service</li>
                <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
                <li>Impersonate any person or entity or misrepresent your affiliation with any entity</li>
                <li>Collect or store personal data about other users without their consent</li>
                <li>Use the Service to transmit spam, chain letters, or unsolicited communications</li>
              </ul>
            </div>
          </section>

          {/* User Roles and Permissions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Roles and Permissions</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                The Service uses a role-based access control system. Your access to features and data is determined by your assigned role:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Master Admin:</strong> Full system access, including user management and project deletion</li>
                <li><strong>System Admin:</strong> Can approve/reject users and manage projects, but cannot delete projects</li>
                <li><strong>Officers:</strong> Can manage data within their specific domain (Revenue, Expenses, Billing, Collections)</li>
                <li><strong>Viewer:</strong> Read-only access to reports and project information</li>
              </ul>
              <p className="text-gray-700 mt-4">
                You must only access and modify data you are authorized to handle based on your role. Unauthorized access or modification of data may result in account termination and legal action.
              </p>
            </div>
          </section>

          {/* Data and Content */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data and Content</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Data</h3>
                <p className="text-gray-700">
                  You retain ownership of all data you input into the Service. By using the Service, you grant us a license to store, process, and display your data as necessary to provide the Service. You are responsible for ensuring you have the right to input any data you provide.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Accuracy</h3>
                <p className="text-gray-700">
                  You are responsible for the accuracy, completeness, and legality of all data you input. We are not responsible for errors in data you provide. You should regularly review and verify your data for accuracy.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Backup</h3>
                <p className="text-gray-700">
                  While we maintain regular backups, you are encouraged to export your data regularly. We are not liable for data loss due to user error, system failures, or other causes beyond our reasonable control.
                </p>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                The Service, including its original content, features, and functionality, is owned by N2 RevCon and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-gray-700">
                You may not copy, modify, distribute, sell, or lease any part of the Service or included software, nor may you reverse engineer or attempt to extract the source code of that software, unless laws prohibit those restrictions or you have our written permission.
              </p>
            </div>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Availability</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                We strive to provide reliable service availability, but we do not guarantee uninterrupted or error-free operation. The Service may be temporarily unavailable due to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Scheduled maintenance</li>
                <li>System updates or upgrades</li>
                <li>Technical issues or failures</li>
                <li>Force majeure events</li>
              </ul>
              <p className="text-gray-700 mt-4">
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We are not liable for any loss or damage resulting from service unavailability.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Limitation of Liability</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, N2 REVCON AND ITS PROVIDERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Your use or inability to use the Service</li>
                <li>Unauthorized access to or alteration of your data</li>
                <li>Statements or conduct of any third party on the Service</li>
                <li>Any other matter relating to the Service</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Our total liability for any claims arising from or related to the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim, or one hundred dollars ($100), whichever is greater.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <XCircleIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Termination</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Termination by You</h3>
                <p className="text-gray-700">
                  You may stop using the Service at any time. You may request account deletion by contacting your administrator or us. Upon termination, your access to the Service will be revoked, but data may be retained according to our data retention policies.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Termination by Us</h3>
                <p className="text-gray-700">
                  We may terminate or suspend your account immediately, without prior notice, if you breach these Terms or engage in any conduct we deem harmful to the Service or other users. We may also terminate accounts that are inactive for extended periods.
                </p>
              </div>
            </div>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700">
              These Terms shall be governed by and construed in accordance with the laws of the Philippines, without regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of the Philippines.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Severability</h2>
            <p className="text-gray-700">
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          {/* Entire Agreement */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Entire Agreement</h2>
            <p className="text-gray-700">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and N2 RevCon regarding the Service and supersede all prior agreements and understandings.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Questions About These Terms?</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> <a href="mailto:rsbp.engineering@yahoo.com" className="text-primary hover:underline">rsbp.engineering@yahoo.com</a></p>
              <p><strong>Phone:</strong> (02) 8252-6739; 0915-5039276</p>
              <p><strong>Address:</strong> BLOCK 3 LOT 36, JASMINE ST., VM TOWNHOMES, BRGY. PUTATAN MUNTINLUPA CITY, 1772</p>
            </div>
          </section>

          {/* Last Updated */}
          <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
            Last updated: January 2025
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;

