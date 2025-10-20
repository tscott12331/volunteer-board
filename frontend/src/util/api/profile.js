import { APIError, APISuccess } from './api-response';
import { supabase } from './supabaseClient';

const formatTimezone = (timezone) => {
    // replace underscores with space
    return timezone ? timezone.replace(/_/g, ' ') : null;
}

export async function fetchProfile(userId) {
    try {
        // Prefer RPC for richer data if available
        const res = await supabase.rpc('get_profile_for_page', {
            p_user_id: userId,
        });

        if (!res.error && Array.isArray(res.data)) {
            let data = res.data[0] || null;
            if (!data) return APISuccess(null);
            // If RPC didn't include onboarding_complete, fetch it directly and merge
            if (!Object.prototype.hasOwnProperty.call(data, 'onboarding_complete')) {
                const { data: basic, error: basicErr } = await supabase
                    .from('profiles')
                    .select('onboarding_complete, timezone')
                    .eq('id', userId)
                    .maybeSingle();
                if (!basicErr && basic) {
                    data = { ...data, onboarding_complete: basic.onboarding_complete, timezone: basic.timezone ?? data.timezone };
                }
            }
            return APISuccess({
                ...data,
                timezone: formatTimezone(data.timezone),
            });
        }

        // Fallback: direct query from profiles (minimal fields used by UI/Guard)
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, display_name, avatar_url, phone, bio, timezone, onboarding_complete')
            .eq('id', userId)
            .maybeSingle();
        if (error) return APIError(error.message);
        if (!data) return APISuccess(null);
        return APISuccess({ ...data, timezone: formatTimezone(data.timezone) });
    } catch(error) {
        return APIError("Server error");
    }
}

export async function upsertProfile(userId, data) {
    if (!userId) return APIError('User ID is required');
    try {
        const payload = {
            id: userId,
            full_name: data.full_name ?? null,
            display_name: data.display_name ?? null,
            avatar_url: data.avatar_url ?? null,
            phone: data.phone ?? null,
            bio: data.bio ?? null,
            timezone: data.timezone ?? 'America/Los_Angeles',
            updated_at: new Date().toISOString(),
        };

        const { data: upserted, error } = await supabase
            .from('profiles')
            .upsert(payload, { onConflict: 'id' })
            .select()
            .single();

        if (error) return APIError(error.message);
        return APISuccess(upserted);
    } catch (error) {
        return APIError('Server error');
    }
}

// Best-effort: mark onboarding_complete=true if the column exists.
// If the column does not exist (error code 42703), ignore silently.
export async function markOnboardingComplete(userId) {
    if (!userId) return APIError('User ID is required');
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ onboarding_complete: true, updated_at: new Date().toISOString() })
            .eq('id', userId);
        if (error) {
            // 42703: undefined_column (column doesn't exist) -> ignore
            if (error.code === '42703') return APISuccess({ ignored: true });
            return APIError(error.message);
        }
        return APISuccess({ updated: true });
    } catch (error) {
        return APIError('Server error');
    }
}
