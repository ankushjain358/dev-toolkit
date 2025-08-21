'use client';

import { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

export default function AmplifyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      Amplify.configure(outputs);
      console.log('Amplify configured successfully');
    } catch (error) {
      console.error('Error configuring Amplify:', error);
    }
  }, []);

  return <>{children}</>;
}
