import { getUserFromRequest } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";
import { NextRequest } from "next/server";

interface Servicio {
  nombre: string;
  descripcion: string;
  precio: number | string;
  duracion: number | string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body: Servicio = await request.json();

    // const url = new URL(request.url);
    // const id = url.searchParams.get("id");
    const { id } = await params;
    const servicioId = Number(id);

    if (!servicioId) {
      return new Response(
        JSON.stringify({ success: false, message: "ID no válido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (
      !body ||
      !body.nombre ||
      !body.descripcion ||
      body.precio === undefined ||
      body.duracion === undefined
    ) {
      return new Response(
        JSON.stringify({ success: false, message: "Datos incompletos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { status, error } = await getUserFromRequest(request);
    if (error) {
      return new Response(JSON.stringify({ success: false, message: error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error: newError } = await supabase
      .from("servicios")
      .update({
        nombre: body.nombre,
        descripcion: body.descripcion,
        precio: Number(body.precio),
        duracion: Number(body.duracion),
      })
      .eq("id", servicioId)
      .select("*")
      .single();

    if (newError) {
      return new Response(
        JSON.stringify({ success: false, message: newError.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ///////////////////////////     METODO DELETE    ///////////////////////////
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const servicioId = Number(id);

    if (!servicioId) {
      return new Response(
        JSON.stringify({ success: false, message: "ID no válido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { status, error } = await getUserFromRequest(request);
    if (error) {
      return new Response(JSON.stringify({ success: false, message: error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error: deleteError } = await supabase
      .from("servicios")
      .delete()
      .eq("id", servicioId);

    if (deleteError) {
      return new Response(
        JSON.stringify({ success: false, message: deleteError.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Servicio eliminado correctamente",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
