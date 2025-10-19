import { supabase } from "./supabaseClient";

export async function fetchEvents(query, startDate, endDate) {
    try {
        const res = await supabase.rpc('list_published_events', {
            q: query,
            from_ts: startDate?.toISOString(),
            to_ts: endDate?.toISOString(),
        });

        if(res.error) {
            console.error(res.error);
            return {
                success: false,
                error: res.error.message,
            }
        }

        return {
            success: true,
            data: res.data,
        }
    } catch(error) {
        console.error(error);
        return {
            success: false,
            error: "Server error",
        }
    }
}

export async function fetchOrganization(id) {
    if(!id) {
        return {
            success: false,
            error: "Organization id is undefined",
        }
    }

    try {
        let res = await supabase.from('organizations')
                    .select('*')
                    .eq('id', id)
                    .limit(1);

        if(res.error) {
            console.error(res.error);
            return {
                success: false,
                error: res.error.message,
            }
        }

        return {
            success: true,
            data: res.data[0],
        }
    } catch(error) {
        console.error(error);
        return {
            success: false,
            error: "Server error",
        }
    }
}
