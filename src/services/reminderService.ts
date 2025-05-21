
import { supabase } from "../supabaseClient";
export const createReminder = (phoneId: string, body: string, at: string) =>
  supabase.from("reminders").insert({
    user_id: supabase.auth.getUser().data.user?.id,
    phone_id: phoneId,
    body,
    scheduled_at: at,
  });
