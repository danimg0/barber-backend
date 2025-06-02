//DELETE por id
//UPDATE por id

import { getUserFromRequest } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";
import { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const barberoId = await Number(id);
  console.log(`Eliminando barbero con ID: ${barberoId}`);

  if (!barberoId) {
    return new Response(
      JSON.stringify({ success: false, message: "ID no válido" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { status, error } = await getUserFromRequest(request);
    if (error) {
      return new Response(JSON.stringify({ success: false, message: error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error: deleteError } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", barberoId)
      .select("id")
      .single();

    if (deleteError) {
      return new Response(
        JSON.stringify({ success: false, message: deleteError.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

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

// PATCH /api/barberos/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {
      user,
      error: authError,
      status,
    } = await getUserFromRequest(request);
    if (authError) {
      return new Response(
        JSON.stringify({ success: false, message: authError }),
        { status: status, headers: { "Content-Type": "application/json" } }
      );
    }
    const body = await request.json();

    const id = Number((await params).id);

    const { name, email, phone, horario } = body;

    const { data, error } = await supabase.rpc("modificar_barbero", {
      p_id_usuario: id,
      p_name: name,
      p_email: email,
      p_phone: phone,
      p_horario: horario ?? null,
    });

    if (error) {
      return new Response(
        JSON.stringify({ success: false, message: error.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Barbero actualizado correctamente",
        data: JSON.stringify(data),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
