
import React from 'react';
import { Shield } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white dark:bg-gray-900 shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-privacy-600" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Privacy Sentinel <span className="text-privacy-600">PII Detector</span>
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
