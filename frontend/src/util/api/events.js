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

// fetch a single event by id
export async function fetchEventById(id) {
    if (!id) return APIError('Event ID is undefined');

    try {
        const res = await supabase.from('events').select('*').eq('id', id).limit(1);
        if (res.error) return APIError(res.error.message);
        return APISuccess(res.data[0]);
    } catch (error) {
        return APIError('Server error');
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
        // First, get the registration_id for this event and user
        const { data: registration, error: fetchError } = await supabase
            .from('event_registrations')
            .select('id, status')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .maybeSingle();

        if (fetchError) return APIError(fetchError.message);
        if (!registration) return APIError("Registration not found");
        
        // If already cancelled, return success
        if (registration.status === 'cancelled') {
            return APISuccess(true);
        }

        // Try calling the RPC function first
        const { data: rpcData, error: rpcError } = await supabase.rpc('update_registration_status', {
            registration_id: registration.id,
            new_status: 'cancelled',
            acting_user: userId
        });

        // If RPC fails due to RLS on notifications, fall back to direct update
        if (rpcError) {
            console.warn('RPC update_registration_status failed, falling back to direct update:', rpcError.message);
            
            // Directly update the status field
            const { error: updateError } = await supabase
                .from('event_registrations')
                .update({ 
                    status: 'cancelled',
                    updated_at: new Date().toISOString()
                })
                .eq('id', registration.id);

            if (updateError) return APIError(updateError.message);
            return APISuccess(true);
        }

        return APISuccess(rpcData ?? true);
    } catch (error) {
        console.error('Unregister error:', error);
        return APIError("Server error");
    }
}
