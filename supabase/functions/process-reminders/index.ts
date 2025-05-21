
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import twilio from "npm:twilio";
const sb  = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const tw  = twilio(Deno.env.get("TWILIO_ACCOUNT_SID")!, Deno.env.get("TWILIO_AUTH_TOKEN")!);
const FROM = Deno.env.get("TWILIO_FROM_NUMBER")!;
export const handler = async () => {
  const { data: due } = await sb
    .from("reminders")
    .select("id, body, phone_numbers(e164_number)")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .limit(100);

  for (const r of due ?? []) {
    try {
      await tw.messages.create({ to: r.phone_numbers.e164_number,
                                 body: r.body, from: FROM });
      await sb.from("reminders")
              .update({ status: "sent", sent_at: new Date() })
              .eq("id", r.id);
    } catch (e: any) {
      await sb.from("reminders")
              .update({ status: "failed",
                        error_code: e.code ?? e.message })
              .eq("id", r.id);
    }
  }
  return new Response("ok");
};
export const config = { schedule: "*/1 * * * *" };   // every minute
