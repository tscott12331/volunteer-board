import { APIError, APISuccess } from "./api-response";
import { supabase } from "./supabaseClient";

export async function fetchEvents(query, startDate, endDate) {
    try {
        // call list_published_events db function
        const res = await supabase.rpc('list_published_events', {
            q: query, // search query
            from_ts: startDate?.toISOString(), // start date filter
            to_ts: endDate?.toISOString(), // end date filter
        });

        if(res.error) return APIError(res.error.message);

        return APISuccess(res.data);
    } catch(error) {
        return APIError("Server error");
    }
}

export async function fetchOrganization(id) {
    if(!id) return APIError("Organization ID is undefined");

    try {
        // select all cols from this specific organization
        let res = await supabase.from('organizations')
                    .select('*')
                    .eq('id', id)
                    .limit(1);

        if(res.error) return APIError(res.error.message);

        // supabase returns an array, we only want one
        return APISuccess(res.data[0]);
    } catch(error) {
        return APIError("Server error");
    }
}

export async function registerForEvent(eventId) {
    try {
        const res = await supabase.rpc('join_event', {
            p_event_id: eventId,
        });

        if(res.error) return APIError(res.error.message);

        console.log(res.data);
        return APISuccess(res.data);
    } catch(error) {
        return APIError("Server error");
    }
}
