import { APIError, APISuccess } from './api-response';
import { supabase } from './supabaseClient';

export default async function fetchUserOrgSubscription(userId) {
    try {
        const res = await supabase.rpc('list_user_organizations', {
            p_user_id: userId,
        });

        if(res.error) return APIError(res.error.message);

        return APISuccess(res.data);
    } catch(error) {
        return APIError("Server error");
    }
}
