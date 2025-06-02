import { getUserFromRequest } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";

export async function GET(request: Request): Promise<Response> {
  try {
    const { user, status, error } = await getUserFromRequest(request);

    if (error) {
      return new Response(JSON.stringify({ success: false, message: error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const barberoId = searchParams.get("barberoId");

    let query = supabase
      .from("barberos_con_horarios")
      .select("*")
      .order("disponible");

    if (barberoId) {
      query = query.eq("id", barberoId);
    }

    const { data, error: newError } = await query;

    if (newError)
      return new Response(JSON.stringify({ error: error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error interno del servidor: ${error}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
