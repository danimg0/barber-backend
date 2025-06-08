import { supabase } from "@/lib/constants/supabase";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { encriptar } from "@/lib/auth/authHelper";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Faltan datos" },
        { status: 400 }
      );
    }

    // Verifica el token y su expiración
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Token inválido o expirado" },
        { status: 400 }
      );
    }

    // Busca el usuario por ID del token
    const { userId } = payload as { userId: number };

    const passwordNuevaEncriptada = encriptar(password);

    console.log("password encriptada");

    const { error } = await supabase
      .from("usuarios")
      .update({ password: passwordNuevaEncriptada })
      .eq("id", userId);

    if (error) {
      return NextResponse.json(
        { success: false, message: "No se pudo actualizar la contraseña" },
        { status: 500 }
      );
    }
    // console.log("usuario actualizado");

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error en el servidor" },
      { status: 500 }
    );
  }
}
