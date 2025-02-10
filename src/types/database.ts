
export interface ViewLog {
  id: string;
  ip_address: string;
  video_url: string;
  access_type: '24h' | '36h' | 'telegram';
  created_at: string;
  expires_at: string;
}
