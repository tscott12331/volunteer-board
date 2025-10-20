import { APIError, APISuccess } from "./api-response";
import { supabase } from "./supabaseClient";

// Create a new organization profile during onboarding
export async function createOrganizationProfile(orgData) {
    if (!orgData.owner_user_id) return APIError("User ID is required");
    if (!orgData.name) return APIError("Organization name is required");
    if (!orgData.slug) return APIError("Organization slug is required");

    try {
        const res = await supabase
            .from('organizations')
            .insert({
                owner_user_id: orgData.owner_user_id,
                name: orgData.name,
                slug: orgData.slug,
                description: orgData.description,
            })
            .select()
            .single();

        if (res.error) {
            // Handle unique constraint violations
            if (res.error.code === '23505') {
                if (res.error.message.includes('slug')) {
                    return APIError("This organization name is already taken. Please choose a different name.");
                }
                return APIError("An organization with this name already exists.");
            }
            return APIError(res.error.message);
        }

        return APISuccess(res.data);
    } catch (error) {
        return APIError("Server error");
    }
}

// Fetch organization by owner user ID
export async function fetchOrganizationByOwner(userId) {
    if (!userId) return APIError("User ID is undefined");

    try {
        const res = await supabase
            .from('organizations')
            .select('*')
            .eq('owner_user_id', userId)
            .single();

        if (res.error) {
            if (res.error.code === 'PGRST116') {
                // No rows returned
                return APISuccess(null);
            }
            return APIError(res.error.message);
        }

        return APISuccess(res.data);
    } catch (error) {
        return APIError("Server error");
    }
}

// Fetch organization by ID
export async function fetchOrganizationById(orgId) {
    if (!orgId) return APIError("Organization ID is undefined");

    try {
        const res = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single();

        if (res.error) return APIError(res.error.message);

        return APISuccess(res.data);
    } catch (error) {
        return APIError("Server error");
    }
}

// Update organization profile
export async function updateOrganization(orgId, data) {
    if (!orgId) return APIError("Organization ID is undefined");

    try {
        const res = await supabase
            .from('organizations')
            .update({
                name: data.name,
                description: data.description,
                logo_url: data.logo_url,
                updated_at: new Date().toISOString(),
            })
            .eq('id', orgId)
            .select()
            .single();

        if (res.error) return APIError(res.error.message);

        return APISuccess(res.data);
    } catch (error) {
        return APIError("Server error");
    }
}

// Fetch all events for an organization
export async function fetchOrganizationEvents(orgId) {
    if (!orgId) return APIError("Organization ID is undefined");

    try {
        const res = await supabase
            .from('events')
            .select(`
                *,
                event_registrations (
                    id,
                    user_id,
                    status,
                    created_at
                )
            `)
            .eq('org_id', orgId)
            .order('start_at', { ascending: false });

        if (res.error) return APIError(res.error.message);

        // Add registration counts to each event
        const eventsWithCounts = res.data.map(event => ({
            ...event,
            registered_count: event.event_registrations.length,
            checked_in_count: event.event_registrations.filter(
                reg => reg.status === 'checked_in'
            ).length,
        }));

        return APISuccess(eventsWithCounts);
    } catch (error) {
        return APIError("Server error");
    }
}

// Create a new event
export async function createEvent(orgId, eventData) {
    if (!orgId) return APIError("Organization ID is undefined");

    try {
        const res = await supabase
            .from('events')
            .insert({
                org_id: orgId,
                title: eventData.title,
                summary: eventData.summary,
                description: eventData.description,
                location: eventData.location,
                start_at: eventData.start_at,
                end_at: eventData.end_at,
                capacity: eventData.capacity,
                status: eventData.status || 'draft',
                image_url: eventData.image_url,
            })
            .select()
            .single();

        if (res.error) return APIError(res.error.message);

        return APISuccess(res.data);
    } catch (error) {
        return APIError("Server error");
    }
}

// Update an event
export async function updateEvent(eventId, eventData) {
    if (!eventId) return APIError("Event ID is undefined");

    try {
        const res = await supabase
            .from('events')
            .update({
                title: eventData.title,
                summary: eventData.summary,
                description: eventData.description,
                location: eventData.location,
                start_at: eventData.start_at,
                end_at: eventData.end_at,
                capacity: eventData.capacity,
                status: eventData.status,
                image_url: eventData.image_url,
                updated_at: new Date().toISOString(),
            })
            .eq('id', eventId)
            .select()
            .single();

        if (res.error) return APIError(res.error.message);

        return APISuccess(res.data);
    } catch (error) {
        return APIError("Server error");
    }
}

// Update event status (publish/unpublish/cancel)
export async function updateEventStatus(eventId, status) {
    if (!eventId) return APIError("Event ID is undefined");
    if (!status) return APIError("Status is undefined");

    try {
        const res = await supabase
            .from('events')
            .update({
                status: status,
                updated_at: new Date().toISOString(),
            })
            .eq('id', eventId)
            .select()
            .single();

        if (res.error) return APIError(res.error.message);

        return APISuccess(res.data);
    } catch (error) {
        return APIError("Server error");
    }
}

// Delete an event
export async function deleteEvent(eventId) {
    if (!eventId) return APIError("Event ID is undefined");

    try {
        const res = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);

        if (res.error) return APIError(res.error.message);

        return APISuccess({ message: "Event deleted successfully" });
    } catch (error) {
        return APIError("Server error");
    }
}

// Fetch registrations for a specific event
export async function fetchEventRegistrations(eventId) {
    if (!eventId) return APIError("Event ID is undefined");

    try {
        const res = await supabase
            .from('event_registrations')
            .select(`
                id,
                status,
                created_at,
                user_id,
                profiles (
                    full_name,
                    display_name,
                    avatar_url
                )
            `)
            .eq('event_id', eventId)
            .order('created_at', { ascending: true });

        if (res.error) return APIError(res.error.message);

        return APISuccess(res.data);
    } catch (error) {
        return APIError("Server error");
    }
}

// Update registration status (check in/out)
export async function updateRegistrationStatus(registrationId, status) {
    if (!registrationId) return APIError("Registration ID is undefined");
    if (!status) return APIError("Status is undefined");

    try {
        const res = await supabase
            .from('event_registrations')
            .update({
                status: status,
                updated_at: new Date().toISOString(),
            })
            .eq('id', registrationId)
            .select()
            .single();

        if (res.error) return APIError(res.error.message);

        return APISuccess(res.data);
    } catch (error) {
        return APIError("Server error");
    }
}

// Fetch organization followers count
export async function fetchOrganizationFollowers(orgId) {
    if (!orgId) return APIError("Organization ID is undefined");

    try {
        const res = await supabase
            .from('org_subscriptions')
            .select('id', { count: 'exact' })
            .eq('org_id', orgId);

        if (res.error) return APIError(res.error.message);

        return APISuccess({ count: res.count });
    } catch (error) {
        return APIError("Server error");
    }
}
