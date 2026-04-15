import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

/**
 * 404 Not Found Page
 */
const NotFoundPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Link to="/">
          <Button size="lg">Go Back Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
