import React from 'react';

const License = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">License Agreement</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Terms of Use</h2>
          <p className="text-gray-700">
            This software is provided for the sole purpose of program management and task organization.
            By using this software, you agree to these terms and conditions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Intellectual Property Rights</h2>
          <p className="text-gray-700">
            All intellectual property rights in the software and its content are owned by us or our licensors.
            You may not copy, modify, distribute, sell, or lease any part of our software or included content.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Usage Restrictions</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>You may not copy or replicate the design or functionality for commercial purposes</li>
            <li>You may not reverse engineer or attempt to extract the source code</li>
            <li>You may not use the software for any illegal or unauthorized purpose</li>
            <li>You may not access the software through automated means</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Disclaimer</h2>
          <p className="text-gray-700">
            The software is provided "as is" without warranty of any kind, express or implied.
            We do not guarantee that the software will be error-free or uninterrupted.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Modifications to Terms</h2>
          <p className="text-gray-700">
            We reserve the right to modify these terms at any time. Continued use of the software
            after such modifications constitutes acceptance of the new terms.
          </p>
        </section>
      </div>
    </div>
  );
};

export default License; 