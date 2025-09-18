// src/app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to My Analytics App</h1>
        <p className="text-xl mb-8">
          Track and understand your website's performance with ease.
        </p>
        <div className="flex space-x-4">
          <Link href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Log In
          </Link>
          <Link href="/signup" className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}