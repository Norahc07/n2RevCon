import { Link } from 'react-router-dom';
import { ShieldCheckIcon, EyeIcon, LockClosedIcon, DocumentTextIcon, UserIcon, ServerIcon } from '@heroicons/react/24/outline';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link to="/" className="text-primary hover:text-primaryLight transition-colors duration-200 inline-flex items-center gap-2 mb-4">
            <span>← Back to Home</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">How we collect, use, and protect your personal information</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheckIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Introduction</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              N2 RevCon ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our construction revenue management system. Please read this policy carefully to understand our practices regarding your personal data.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              By using our service, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our service.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <DocumentTextIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Personal Information</h3>
                <p className="text-gray-700 mb-2">When you register for an account, we collect:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Name (first name and last name)</li>
                  <li>Email address</li>
                  <li>Password (stored securely as a hash)</li>
                  <li>Role and permissions assigned by administrators</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Project and Financial Data</h3>
                <p className="text-gray-700 mb-2">In the course of using our service, you may input:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Project information (names, codes, descriptions, budgets)</li>
                  <li>Revenue and expense records</li>
                  <li>Billing and collection information</li>
                  <li>Client information</li>
                  <li>Financial transactions and amounts</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Usage Information</h3>
                <p className="text-gray-700 mb-2">We automatically collect certain information about your use of the service:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Login history and session information</li>
                  <li>User actions and activities (for audit purposes)</li>
                  <li>Device information and browser type</li>
                  <li>IP address (for security and troubleshooting)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <EyeIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">We use the collected information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Service Provision:</strong> To provide, maintain, and improve our construction revenue management services</li>
                <li><strong>Authentication:</strong> To verify your identity and manage your account access</li>
                <li><strong>Authorization:</strong> To enforce role-based access controls and permissions</li>
                <li><strong>Communication:</strong> To send you important notifications, updates, and security alerts</li>
                <li><strong>Support:</strong> To respond to your inquiries and provide customer support</li>
                <li><strong>Security:</strong> To detect, prevent, and address security issues and fraudulent activities</li>
                <li><strong>Compliance:</strong> To comply with legal obligations and enforce our terms of service</li>
                <li><strong>Analytics:</strong> To analyze usage patterns and improve system performance</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing and Disclosure */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <LockClosedIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Data Sharing and Disclosure</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Within Your Organization:</strong> Data is accessible to authorized users within your organization based on their assigned roles and permissions</li>
                <li><strong>Service Providers:</strong> We may share information with trusted third-party service providers who assist us in operating our service (e.g., cloud hosting, email services), subject to confidentiality agreements</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government regulation</li>
                <li><strong>Security:</strong> We may share information to protect our rights, privacy, safety, or property, or that of our users</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction</li>
              </ul>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <ServerIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">We implement industry-standard security measures to protect your information:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Encryption of data in transit (TLS/SSL) and at rest</li>
                <li>Secure password hashing (bcrypt)</li>
                <li>Role-based access controls</li>
                <li>Regular security audits and updates</li>
                <li>Firewall protection and intrusion detection</li>
                <li>Regular data backups</li>
              </ul>
              <p className="text-gray-700 mt-4">
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Your Privacy Rights</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700">You have the following rights regarding your personal information:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>Access:</strong> You can access and review your personal information through your account settings</li>
                <li><strong>Correction:</strong> You can update your personal information at any time through your account</li>
                <li><strong>Deletion:</strong> You can request deletion of your account, subject to legal and operational requirements</li>
                <li><strong>Data Export:</strong> You can export your project data through the export functionality</li>
                <li><strong>Account Control:</strong> You can manage your account settings, password, and session preferences</li>
              </ul>
              <p className="text-gray-700 mt-4">
                To exercise these rights, please contact your system administrator or reach out to us using the contact information provided below.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Project data and financial records are retained according to your organization's requirements and applicable accounting standards. Deleted projects are retained for 30 days before permanent deletion, allowing for recovery if needed.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking Technologies</h2>
            <p className="text-gray-700">
              We use cookies and similar tracking technologies to maintain your session, remember your preferences, and improve your experience. These technologies are essential for the functionality of our service. You can control cookies through your browser settings, though disabling cookies may affect service functionality.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700">
              Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically to stay informed about how we protect your information.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
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

export default Privacy;

