// filename: api/registrations.js
import { createClient } from '@supabase/supabase-js';

// Be sure these env vars are set and NOT hardcoded in code
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Helper: get registration id for (eventId, userId)
async function getRegistrationIdForUser(eventId, userId) {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

// Unregister via RPC that enforces business rules in Postgres
export async function unregisterFromEvent(eventId, userId) {
  const registrationId = await getRegistrationIdForUser(eventId, userId);
  if (!registrationId) {
    // No row to update; you can treat this as success
    return { ok: true, message: 'No registration found' };
  }

  // Use the exact enum value in your DB (e.g., 'unregistered' or 'not_registered')
  const targetStatus = 'unregistered';

  const { data, error } = await supabase.rpc('update_registration_status', {
    registration_id: registrationId,
    new_status: targetStatus,
    acting_user: userId
  });

  if (error) throw error;
  return { ok: true, data };
}
