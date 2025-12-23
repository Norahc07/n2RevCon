import { Link } from 'react-router-dom';
import { ShieldCheckIcon, LockClosedIcon, KeyIcon, EyeIcon, ServerIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';

const Security = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link to="/" className="text-primary hover:text-primaryLight transition-colors duration-200 inline-flex items-center gap-2 mb-4">
            <span>← Back to Home</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Security</h1>
          <p className="text-gray-600 mt-2">How we protect your data and ensure system security</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheckIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Security Overview</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              At N2 RevCon, we take the security of your construction project data seriously. We implement multiple layers of security measures to protect your sensitive financial and project information from unauthorized access, data breaches, and other security threats.
            </p>
          </section>

          {/* Authentication & Access Control */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <LockClosedIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Authentication & Access Control</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">User Authentication</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>All user accounts require email verification before access</li>
                  <li>Strong password requirements enforced (minimum complexity standards)</li>
                  <li>Two-factor authentication support for enhanced security</li>
                  <li>Account approval system - new registrations require administrator approval</li>
                  <li>Session management with automatic timeout for inactive sessions</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Role-Based Access Control (RBAC)</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Granular permission system controlling access to features and data</li>
                  <li>Different user roles: Master Admin, System Admin, Revenue Officer, Disbursing Officer, Billing Officer, Collecting Officer, and Viewer</li>
                  <li>Users can only access and modify data they are authorized to view</li>
                  <li>Project deletion restricted to Master Admin only</li>
                  <li>Audit trail of all user actions for accountability</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Encryption */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <KeyIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Data Encryption</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">In Transit</h3>
                <p className="text-gray-700">
                  All data transmitted between your browser and our servers is encrypted using industry-standard TLS (Transport Layer Security) protocols. This ensures that your data cannot be intercepted or read by unauthorized parties during transmission.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">At Rest</h3>
                <p className="text-gray-700">
                  Sensitive data stored in our databases is encrypted at rest. This means that even if someone gains unauthorized access to our storage systems, they cannot read your data without the encryption keys.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Password Security</h3>
                <p className="text-gray-700">
                  User passwords are never stored in plain text. We use secure hashing algorithms (bcrypt) to store password hashes, making it virtually impossible to recover original passwords even if our database is compromised.
                </p>
              </div>
            </div>
          </section>

          {/* Data Privacy & Visibility */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <EyeIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Data Privacy & Visibility</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Isolation</h3>
                <p className="text-gray-700">
                  Each user's access is restricted based on their role and permissions. Users can only view and modify data they are authorized to access, ensuring proper data isolation and privacy.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Project-Level Security</h3>
                <p className="text-gray-700">
                  Project data is protected at multiple levels. Only authorized personnel can view project details, financial records, billing information, and collections data based on their assigned roles.
                </p>
              </div>
            </div>
          </section>

          {/* Infrastructure Security */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <ServerIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Infrastructure Security</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Server Security</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Regular security updates and patches applied to all systems</li>
                  <li>Firewall protection to prevent unauthorized access</li>
                  <li>Intrusion detection and monitoring systems</li>
                  <li>Regular security audits and vulnerability assessments</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Database Security</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Secure database connections with authentication</li>
                  <li>Regular database backups stored securely</li>
                  <li>Access controls limiting database access to authorized personnel only</li>
                  <li>Data retention policies in place</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Compliance & Auditing */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <DocumentCheckIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-gray-900">Compliance & Auditing</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Activity Logging</h3>
                <p className="text-gray-700">
                  All user activities are logged, including login attempts, data modifications, exports, and administrative actions. These logs help us detect suspicious activities and maintain accountability.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Regular Security Reviews</h3>
                <p className="text-gray-700">
                  We conduct regular security reviews and assessments to identify and address potential vulnerabilities. Our security practices are continuously improved based on industry best practices and emerging threats.
                </p>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Security Responsibilities</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-gray-800 font-semibold mb-2">To help maintain security, please:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Use a strong, unique password for your account</li>
                <li>Never share your login credentials with others</li>
                <li>Log out when finished, especially on shared devices</li>
                <li>Report any suspicious activity immediately</li>
                <li>Keep your contact information updated for security notifications</li>
                <li>Regularly review your account activity and permissions</li>
              </ul>
            </div>
          </section>

          {/* Incident Response */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Security Incident Response</h2>
            <p className="text-gray-700 mb-4">
              In the event of a security incident, we have procedures in place to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Immediately investigate and contain the incident</li>
              <li>Notify affected users as required by law</li>
              <li>Take corrective actions to prevent future occurrences</li>
              <li>Document lessons learned and update security measures</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Security Concerns?</h2>
            <p className="text-gray-700">
              If you have security concerns or notice any suspicious activity, please contact us immediately at{' '}
              <a href="mailto:rsbp.engineering@yahoo.com" className="text-primary hover:underline">
                rsbp.engineering@yahoo.com
              </a>
              {' '}or call (02) 8252-6739; 0915-5039276.
            </p>
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

export default Security;

