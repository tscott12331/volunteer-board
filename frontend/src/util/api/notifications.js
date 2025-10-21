import { supabase } from './supabaseClient';

// Fetch notifications for a user, paginated
export async function fetchNotifications(userId, { limit = 20, offset = 0, type = null } = {}) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (type) {
    query = query.contains('payload', { type });
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Mark a notification as read
export async function markNotificationRead(id) {
  // Use the RPC for security
  const { error } = await supabase.rpc('mark_notification_read', { p_id: id });
  if (error) throw error;
}

// Mark a notification as unread (toggle)
export async function markNotificationUnread(id) {
  // Direct update (RLS allows only own notifications)
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: false, read_at: null })
    .eq('id', id);
  if (error) throw error;
}

// Mark all as read for a user
export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

// Delete a notification
export async function deleteNotification(id) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Count unread notifications
export async function countUnreadNotifications(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
  return count;
}
