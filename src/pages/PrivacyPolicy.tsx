import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p className="text-gray-700">
            We collect information that you provide directly to us when using the Program Manager application,
            including but not limited to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-2">
            <li>Account information (email, name, profile data)</li>
            <li>Program and task-related data</li>
            <li>Usage data and interaction with the application</li>
            <li>Technical information about your device and connection</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p className="text-gray-700">
            We use the collected information for the following purposes:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-2">
            <li>To provide and maintain the Program Manager service</li>
            <li>To improve and personalize your experience</li>
            <li>To communicate with you about service-related matters</li>
            <li>To ensure the security of our service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Data Protection</h2>
          <p className="text-gray-700">
            We implement appropriate technical and organizational measures to protect your personal data
            against unauthorized or unlawful processing, accidental loss, destruction, or damage.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Data Sharing</h2>
          <p className="text-gray-700">
            We do not sell or share your personal information with third parties except as necessary
            to provide our services or as required by law. Any third-party service providers we use
            are bound by contractual obligations to protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
          <p className="text-gray-700">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-2">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Export your data in a portable format</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Updates to This Policy</h2>
          <p className="text-gray-700">
            We may update this privacy policy from time to time. We will notify you of any changes
            by posting the new privacy policy on this page and updating the effective date.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 