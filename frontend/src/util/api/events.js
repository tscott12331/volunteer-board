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
