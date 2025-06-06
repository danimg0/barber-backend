import { encriptar, getUserFromRequest } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function PATCH(request: NextRequest) {
  console.log(`password recibida:`);
  try {
    //password:
    const body = await request.json();

    const { newPassword } = body;

    const { user, error, status } = await getUserFromRequest(request);

    let passwordEncriptada = encriptar(newPassword);

    if (error || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Ha ocurrido un error ${error}`,
        }),
        { status: 401 }
      );
    }

    const { data, error: updateError } = await supabase
      .from("usuarios")
      .update({ password: passwordEncriptada })
      .eq("id", user.id);

    if (updateError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Ha ocurrido un error ${error}`,
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password cambiada correctamente",
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Ha ocurrido un error ${error}`,
      }),
      { status: 500 }
    );
  }
}
