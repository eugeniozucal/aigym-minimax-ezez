import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface GenerateSignupLinkParams {
  communityId: string;
}

interface GenerateSignupLinkResponse {
  signup_link: string;
  community_id: string;
}

export const useCommunitySignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSignupLink = async (params: GenerateSignupLinkParams): Promise<GenerateSignupLinkResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-community-signup-link', {
        body: {
          communityId: params.communityId
        }
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        throw new Error(data.error.message);
      }

      return data.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate signup link';
      setError(errorMessage);
      console.error('Error generating signup link:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  };

  return {
    generateSignupLink,
    copyToClipboard,
    loading,
    error
  };
};

export default useCommunitySignup;