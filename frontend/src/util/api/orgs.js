import { APIError, APISuccess } from './api-response';
import { supabase } from './supabaseClient';

export default async function fetchUserOrgSubscription(userId) {
    try {
        // const res = await supabase.rpc('list_user_organizations', {
        //     p_user_id: userId,
        // });
        const res = await supabase.from('org_subscriptions')
                                .select(`
                                        organizations ( * )
                                    `).eq('user_id', userId);

        if(res.error) return APIError(res.error.message);

        const orgs = res.data.map(o => o.organizations);

        return APISuccess(orgs);
    } catch(error) {
        return APIError("Server error");
    }
}
