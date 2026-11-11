/* ========================================
   Supabase Configuration
   ========================================
   Replace the values below with your
   Supabase project URL and anon key.
   Find them in: Supabase Dashboard → Settings → API
   ======================================== */

const SUPABASE_URL = 'https://idvqbntofuaxryuyeqmt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_nilT9wKVxBIEfhmDg3KzQw_Anss7nMQ';

// Redirect password recovery links to admin page BEFORE creating the client
// (createClient consumes the hash tokens, so redirect must happen first)
if (window.location.hash.indexOf('type=recovery') !== -1 && window.location.pathname.indexOf('admin') === -1) {
  window.location.replace('admin.html' + window.location.hash);
}

// The CDN script creates a global `supabase` object with createClient.
// We reassign it to the initialized client instance.
supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
