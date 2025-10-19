import { supabase } from './supabaseClient';

const formatTimezone = (timezone) => {
    return timezone ? timezone.replace(/_/g, ' ') : null;
}

export async function fetchProfile(userId) {
    try {
        const res = await supabase.rpc('get_profile_for_page', {
            p_user_id: userId,
        });

        if(res.error) {
            return {
                success: false,
                error: res.error.message,
            }
        }

        const data = res.data[0];

        return {
            success: true,
            data: {
                ...data,
                timezone: formatTimezone(data.timezone),
            },
        }
    } catch(error) {
        console.error(error);
        return {
            success: false,
            error: "Server error",
        }
    }
}
