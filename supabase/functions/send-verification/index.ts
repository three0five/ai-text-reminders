
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import twilio from "npm:twilio";
const sb  = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const tw  = twilio(Deno.env.get("TWILIO_ACCOUNT_SID")!, Deno.env.get("TWILIO_AUTH_TOKEN")!);
const FROM = Deno.env.get("TWILIO_FROM_NUMBER")!;
export const handler = async (req: Request) => {
  const { phone } = await req.json();
  if (!phone) return new Response("phone required", { status: 400 });

  const code    = (Math.floor(100000 + Math.random()*900000)).toString();
  const expires = new Date(Date.now() + 10*60_000).toISOString();
  await sb.from("phone_numbers")
    .upsert({ user_id: req.headers.get("x-user-id"), e164_number: phone,
              verify_code: code, code_expires: expires })
    .eq("e164_number", phone);

  await tw.messages.create({ to: phone, from: FROM,
                             body: `Your verification code: ${code}` });
  return Response.json({ success: true });
};
