
import React from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ViewLog } from '@/types/database';

interface VideoAccessControlProps {
  videoUrl: string;
  onAccessGranted: () => void;
}

const generateExpirationTime = (hours: number): string => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);
  return expiresAt.toISOString();
};

const VideoAccessControl: React.FC<VideoAccessControlProps> = ({ videoUrl, onAccessGranted }) => {
  const supabase = useSupabaseClient();

  const requestAccess = async (hours: number) => {
    try {
      // Get client IP address from Supabase edge function
      const { data: { ip }, error: ipError } = await supabase.functions.invoke('get-client-ip');
      
      if (ipError) throw ipError;

      // Check if there's an existing valid access
      const { data: existingAccess, error: checkError } = await supabase
        .from('view_logs')
        .select('*')
        .eq('ip_address', ip)
        .eq('video_url', videoUrl)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingAccess) {
        onAccessGranted();
        return;
      }

      // Create new access entry
      const expiresAt = generateExpirationTime(hours);

      const { error: insertError } = await supabase
        .from('view_logs')
        .insert({
          ip_address: ip,
          video_url: videoUrl,
          access_type: hours === 24 ? '24h' : '36h',
          expires_at: expiresAt,
        });

      if (insertError) throw insertError;

      toast.success(`Access granted for ${hours} hours`);
      onAccessGranted();
    } catch (error) {
      console.error('Access request failed:', error);
      toast.error('Failed to request access');
    }
  };

  const redirectToTelegram = () => {
    // Replace with your Telegram bot link
    window.open(`https://t.me/your_bot_username?start=${encodeURIComponent(videoUrl)}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 bg-black/90 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Request Video Access</h2>
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => requestAccess(24)} variant="default">
          24 Hour Access
        </Button>
        <Button onClick={() => requestAccess(36)} variant="default">
          36 Hour Access
        </Button>
        <Button onClick={redirectToTelegram} variant="default">
          Get via Telegram
        </Button>
      </div>
    </div>
  );
};

export default VideoAccessControl;
