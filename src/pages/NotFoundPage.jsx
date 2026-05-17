import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-lg rounded-[32px] border border-slate-200/80 bg-white/88 p-10 text-center shadow-[0_28px_80px_rgba(15,23,42,0.10)] backdrop-blur">
        <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-full bg-blue-50 text-3xl font-semibold text-blue-700">
          404
        </div>
        <h1 className="mb-4 text-4xl font-semibold text-slate-950">Page Not Found</h1>
        <p className="mb-8 text-lg text-slate-500">
          Sorry, the page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link to="/">
          <Button size="lg">Go Back Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
