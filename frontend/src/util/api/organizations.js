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

// fetch an organization by its unique slug with an optional userId for is_followed info
export async function fetchOrganizationBySlug(slug, userId) {
    if (!slug) return APIError("Organization slug is undefined");

    try {
        const res = await supabase.rpc('get_organization_public', {
            p_org_slug: slug,
            p_user_id: userId,
        });

        if (res.error) return APIError(res.error.message);

        return APISuccess(res.data[0]);
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

// fetch an organizations events by its unique slug
export async function fetchOrganizationEventsBySlug(slug) {
    if (!slug) return APIError("Organization slug is undefined");

    try {
        const res = await supabase.rpc('list_org_events_all', {
            p_org_slug: slug,
        })

        if (res.error) return APIError(res.error.message);

        return APISuccess(res.data);
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

/**
 * Fetch registrations for a specific event using Supabase DB function with pagination and status filter
 * @param {string} eventId - UUID of the event
 * @param {Object} options - { status, limit, offset }
 * @returns {Promise<APISuccess|APIError>}
 */
export async function fetchEventRegistrations(eventId, options = {}) {
    if (!eventId) return APIError("Event ID is undefined");
    const { status = null, limit = 50, offset = 0 } = options;
    try {
        // If RLS is enabled, get JWT from Supabase auth
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error('Supabase session error:', sessionError);
        }
        const accessToken = sessionData?.session?.access_token;
        // Call the database function via RPC
        const { data, error } = await supabase.rpc('get_event_registrants', {
            event_uuid: eventId,
            status_filter: status,
            limit_rows: limit,
            offset_rows: offset
        }, {
            ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {})
        });
        if (error) {
            console.error('Supabase RPC error:', error);
            return APIError(error.message || 'Failed to fetch registrants');
        }
        return APISuccess(data || []);
    } catch (error) {
        console.error('fetchEventRegistrations exception:', error);
        return APIError("Server error");
    }
}

// Update registration status (check in/out)
export async function updateRegistrationStatus(registrationId, status, actingUserId = null) {
    if (!registrationId) return APIError("Registration ID is undefined");
    if (!status) return APIError("Status is undefined");

    try {
        // Get acting user ID if not provided
        let userId = actingUserId;
        if (!userId) {
            const { data: sessionData } = await supabase.auth.getSession();
            userId = sessionData?.session?.user?.id || null;
        }
        // Call the database function via RPC
        const { data, error } = await supabase.rpc('update_registration_status', {
            registration_id: registrationId,
            new_status: status,
            acting_user: userId
        });
        if (error) return APIError(error.message);
        return APISuccess(data);
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

// subscribe to/follow an organization
export async function followOrganization(orgId) {
    if (!orgId) return APIError("Organization ID is undefined");

    try {
        const res = await supabase.rpc('subscribe_to_org', {
            p_org_id: orgId
        })

        if (res.error) return APIError(res.error.message);

        return APISuccess(res.data);
    } catch(error) {
        return APIError("Server error");
    }
}

// unsubscribe from/unfollow an organization
export async function unfollowOrganization(orgId) {
    if (!orgId) return APIError("Organization ID is undefined");

    try {
        const res = await supabase.rpc('unsubscribe_from_org', {
            p_org_id: orgId
        })

        if (res.error) return APIError(res.error.message);

        return APISuccess(res.data);
    } catch(error) {
        return APIError("Server error");
    }
}
