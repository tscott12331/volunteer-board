import { supabase } from "./supabaseClient";

export async function fetchEvents() {
    try {
        const res = await supabase.from('events')
                        .select("*");
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
