import { APIError, APISuccess } from "./api-response";
import { supabase } from "./supabaseClient";

// fetch events based on search query, start date, and end date
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

// fetch events that {userId} is registered to
export async function fetchRegisteredEvents(userId) {
    if(!userId) return APIError("User ID is undefined");

    try {
        // fetch all cols from events on the condition that
        // an associated event_registration exists that matches
        // the given userId
        const res = await supabase.from('event_registrations')
                            .select(`
                                    user_id,
                                    events ( * )
                                `).eq('user_id', userId);

        if(res.error) return APIError(res.error.message);

        // data from join comes back as
        // [{
            // user_id
            // events: {
                // event data...
            // }
        // }]
        const events = res.data.map(o => ({
            ...o.events
        }));

        return APISuccess(events);
    } catch(error) {
        return APIError("Server error");
    }
}

// fetch an organization based on its id
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

// register a user to an event based on its id
export async function registerForEvent(eventId) {
    try {
        // call supabase db rpc function join_event,
        // passing in the event id we want to join
        const res = await supabase.rpc('join_event', {
            p_event_id: eventId,
        });

        if(res.error) return APIError(res.error.message);

        return APISuccess(res.data);
    } catch(error) {
        return APIError("Server error");
    }
}
