import { APIError, APISuccess } from './api-response';
import { supabase } from './supabaseClient';

const formatTimezone = (timezone) => {
    // replace underscores with space
    return timezone ? timezone.replace(/_/g, ' ') : null;
}

export async function fetchProfile(userId) {
    try {
        // call get_profile_for_page db function to get profile information
        // on a specific user (userId)
        const res = await supabase.rpc('get_profile_for_page', {
            p_user_id: userId,
        });

        if(res.error) return APIError(res.error.message);

        // supabase returns an array of profiles
        const data = res.data[0];

        return APISuccess({
            ...data,
            timezone: formatTimezone(data.timezone),
        })
    } catch(error) {
        return APIError("Server error");
    }
}
