import { APIError, APISuccess } from './api-response';
import { supabase } from './supabaseClient';

const formatTimezone = (timezone) => {
    // replace underscores with space for display
    return timezone ? timezone.replace(/_/g, ' ') : null;
}

const normalizeTimezone = (timezone) => {
    // replace spaces with underscores for database storage
    return timezone ? timezone.replace(/ /g, '_') : null;
}

export async function fetchProfile(userId) {
    try {
        // Prefer RPC for richer data if available
        const res = await supabase.rpc('get_profile_for_page', {
            p_user_id: userId,
        });

        if (!res.error && Array.isArray(res.data)) {
            let data = res.data[0] || null;
            if (!data) return APISuccess(null);
            // If RPC didn't include onboarding_complete, fetch it directly and merge
            if (!Object.prototype.hasOwnProperty.call(data, 'onboarding_complete')) {
                const { data: basic, error: basicErr } = await supabase
                    .from('profiles')
                    .select('onboarding_complete, timezone')
                    .eq('id', userId)
                    .maybeSingle();
                if (!basicErr && basic) {
                    data = { ...data, onboarding_complete: basic.onboarding_complete, timezone: basic.timezone ?? data.timezone };
                }
            }
            
            // Fetch availability separately and merge
            const { data: availData, error: availError } = await supabase
                .from('volunteer_availability')
                .select('day, start_time, end_time, timezone')
                .eq('user_id', userId);
            
            if (!availError && availData) {
                // Convert array to object keyed by day
                const availability = {};
                availData.forEach(record => {
                    availability[record.day] = {
                        enabled: true,
                        start: record.start_time,
                        end: record.end_time
                    };
                });
                data.availability = availability;
            }
            
            return APISuccess({
                ...data,
                timezone: formatTimezone(data.timezone),
            });
        }

        // Fallback: direct query from profiles (minimal fields used by UI/Guard)
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, display_name, avatar_url, phone, bio, timezone, onboarding_complete')
            .eq('id', userId)
            .maybeSingle();
        if (error) return APIError(error.message);
        if (!data) return APISuccess(null);
        
        // Fetch availability for fallback path too
        const { data: availData, error: availError } = await supabase
            .from('volunteer_availability')
            .select('day, start_time, end_time, timezone')
            .eq('user_id', userId);
        
        if (!availError && availData) {
            const availability = {};
            availData.forEach(record => {
                availability[record.day] = {
                    enabled: true,
                    start: record.start_time,
                    end: record.end_time
                };
            });
            data.availability = availability;
        }
        
        return APISuccess({ ...data, timezone: formatTimezone(data.timezone) });
    } catch(error) {
        return APIError("Server error");
    }
}

export async function upsertProfile(userId, data) {
    if (!userId) return APIError('User ID is required');
    try {
        const payload = {
            id: userId,
            full_name: data.full_name ?? null,
            display_name: data.display_name ?? null,
            avatar_url: data.avatar_url ?? null,
            phone: data.phone ?? null,
            bio: data.bio ?? null,
            timezone: normalizeTimezone(data.timezone) ?? 'America/Los_Angeles',
            updated_at: new Date().toISOString(),
        };

        const { data: upserted, error } = await supabase
            .from('profiles')
            .upsert(payload, { onConflict: 'id' })
            .select()
            .single();

        if (error) return APIError(error.message);

        // Save availability directly to the table (no RPC issues)
        if (data.availability && typeof data.availability === 'object') {
            try {
                console.log('Saving availability data:', {
                    userId,
                    availability: data.availability,
                    timezone: data.timezone ?? 'UTC'
                });
                
                // Step 1: Delete existing availability for this user
                const { error: deleteError } = await supabase
                    .from('volunteer_availability')
                    .delete()
                    .eq('user_id', userId);
                
                if (deleteError) {
                    console.error('Failed to delete old availability:', deleteError);
                    return APIError(`Failed to clear old availability: ${deleteError.message}`);
                }
                
                // Step 2: Prepare new records
                const availabilityRecords = [];
                const dayMap = {
                    'Sun': 'Sun',
                    'Mon': 'Mon', 
                    'Tue': 'Tue',
                    'Wed': 'Wed',
                    'Thu': 'Thu',
                    'Fri': 'Fri',
                    'Sat': 'Sat'
                };
                
                for (const [day, config] of Object.entries(data.availability)) {
                    if (config.enabled && config.start && config.end && dayMap[day]) {
                        availabilityRecords.push({
                            user_id: userId,
                            day: dayMap[day],
                            start_time: config.start,
                            end_time: config.end,
                            timezone: normalizeTimezone(data.timezone) ?? 'UTC'
                        });
                    }
                }
                
                // Step 3: Insert new records (only if there are any)
                if (availabilityRecords.length > 0) {
                    console.log('Attempting to insert records:', availabilityRecords);
                    
                    const { data: insertData, error: insertError } = await supabase
                        .from('volunteer_availability')
                        .insert(availabilityRecords)
                        .select();
                    
                    if (insertError) {
                        console.error('Failed to insert availability:', {
                            error: insertError,
                            message: insertError.message,
                            details: insertError.details,
                            hint: insertError.hint,
                            code: insertError.code,
                            records: availabilityRecords
                        });
                        return APIError(`Failed to save availability: ${insertError.message}`);
                    }
                    
                    console.log(`Successfully saved ${availabilityRecords.length} availability slots:`, insertData);
                } else {
                    console.log('No enabled availability to save');
                }
            } catch (e) {
                console.error('Availability save exception:', e);
                return APIError(`Failed to save availability: ${e.message}`);
            }
        }

        return APISuccess(upserted);
    } catch (error) {
        return APIError('Server error');
    }
}

// Best-effort: mark onboarding_complete=true if the column exists.
// If the column does not exist (error code 42703), ignore silently.
export async function markOnboardingComplete(userId) {
    if (!userId) return APIError('User ID is required');
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ onboarding_complete: true, updated_at: new Date().toISOString() })
            .eq('id', userId);
        if (error) {
            // 42703: undefined_column (column doesn't exist) -> ignore
            if (error.code === '42703') return APISuccess({ ignored: true });
            return APIError(error.message);
        }
        return APISuccess({ updated: true });
    } catch (error) {
        return APIError('Server error');
    }
}
