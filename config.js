// Supabase Configuration
const SUPABASE_CONFIG = {
    URL: 'https://pvtqfzeqyldggvsjepju.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2dHFmemVxeWxkZ2d2c2plcGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NDgxMTAsImV4cCI6MjA4MDQyNDExMH0.-pMiT9dgXWM6MYc1zjbRX9VV3M45uxSEf_8vgR9f4os'
};

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
