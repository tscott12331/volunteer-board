import { APIError, APISuccess } from "./api-response";
import { supabase } from "./supabaseClient";

// fetch events based on search query, start date, and end date
export async function fetchEvents(startDate, endDate, userId) {
    try {
        // call list_published_events db function
        const res = await supabase.rpc('list_published_events', {
            // q: query, // search query
            p_user_id: userId,
            p_start_date: startDate?.toISOString(), // start date filter
            p_end_date: endDate?.toISOString(), // end date filter

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
        // use supabase rpc list_user_registered_events to get
        // events that user {userId} id registered for
        const res = await supabase.rpc('list_user_registered_events', {
            p_user_id: userId,
            p_only_upcoming: false,
        });

        if(res.error) return APIError(res.error.message);

        return APISuccess(res.data);
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

// unregister a user from an event
export async function unregisterFromEvent(eventId, userId) {
    if (!eventId || !userId) return APIError("Event ID or User ID is undefined");
    try {
        // Try direct delete; if RLS blocks this, fall back to RPC if available
        const { error } = await supabase
            .from('event_registrations')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', userId);

        if (error) {
            // Optional: attempt RPC 'leave_event' if your DB function exists
            const rpc = await supabase.rpc('leave_event', { p_event_id: eventId });
            if (rpc.error) return APIError(error.message || rpc.error.message);
            return APISuccess(rpc.data ?? true);
        }
        return APISuccess(true);
    } catch (error) {
        return APIError("Server error");
    }
}
