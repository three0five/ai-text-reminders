
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
export const handler = async (req: Request) => {
  const { phone, code } = await req.json();
  const { data } = await sb.from("phone_numbers")
    .select("id, code_expires")
    .eq("e164_number", phone).eq("verify_code", code).single();

  if (!data || new Date(data.code_expires) < new Date())
    return new Response("Invalid or expired code", { status: 400 });

  await sb.from("phone_numbers")
    .update({ verified: true, verify_code: null, code_expires: null })
    .eq("id", data.id);

  return Response.json({ success: true });
};
