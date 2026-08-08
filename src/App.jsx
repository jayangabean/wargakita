import React, { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loading />}>
        <RouterProvider router={router} />
      </Suspense>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#191b24',
            border: '1px solid #c2c6d8',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            icon: '✅',
            style: {
              borderLeft: '4px solid #006c49',
            },
          },
          error: {
            icon: '❌',
            style: {
              borderLeft: '4px solid #ba1a1a',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;