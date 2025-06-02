import { encriptar } from "@/lib/auth/authHelper";
import { supabase } from "@/lib/constants/supabase";
import { UsuarioDB } from "@/lib/types/usuario.type";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const onlyBody = body.datos;
    //Comprobar si existe usuario con ese email o telefono
    if (!onlyBody || !onlyBody.name || !onlyBody.email || !onlyBody.phone) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Faltan campos por rellenar",
        }),
        {
          status: 400,
        }
      );
    }

    // Comprobar si el email ya existe
    const { data: existingUser, error: emailError } = await supabase
      .from("usuarios")
      .select("email")
      .eq("email", onlyBody.email)
      .single();

    if (emailError) {
      console.error("Error al comprobar email:", emailError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Error al comprobar el email",
        }),
        { status: 500 }
      );
    }
    if (existingUser) {
      console.log("El email ya está registrado");
      return new Response(
        JSON.stringify({
          success: false,
          message: "El email ya está registrado",
        }),
        { status: 400 }
      );
    }
    // Comprobar si el teléfono ya existe
    const { data: existingPhone, error: phoneError } = await supabase
      .from("usuarios")
      .select("phone")
      .eq("phone", onlyBody.phone)
      .single();
    if (phoneError) {
      console.error("Error al comprobar teléfono:", phoneError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Error al comprobar el teléfono",
        }),
        { status: 500 }
      );
    }
    if (existingPhone) {
      console.log("El teléfono ya está registrado");
      return new Response(
        JSON.stringify({
          success: false,
          message: "El teléfono ya está registrado",
        }),
        { status: 400 }
      );
    }

    console.log("body recibido en la api", body.datos);

    let usuarioARegistrar: UsuarioDB = {
      name: onlyBody.name,
      email: onlyBody.email,
      phone: onlyBody.phone,
      rol: onlyBody.rol ?? 3,
      password: onlyBody.password,
    };

    if (
      !usuarioARegistrar.name ||
      !usuarioARegistrar.email ||
      !usuarioARegistrar.password ||
      !usuarioARegistrar.phone
    ) {
      console.log("Error en la api por falta de campos");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Faltan campos por rellenar",
        }),
        {
          status: 400,
        }
      );
    }

    let passwordEncriptada = encriptar(usuarioARegistrar.password);
    usuarioARegistrar.password = passwordEncriptada;

    console.log("Password encriptada");

    //En Supabase hay un trigger que luego guarda en empleados o cliente en funcion del rol
    const { data, error } = await supabase
      .from("usuarios")
      .insert(usuarioARegistrar)
      .select();

    let idGenerado = data;

    if (error) {
      console.log("Error en la api", error);
      // Si el error es por email duplicado

      return new Response(JSON.stringify({ success: false, message: error }), {
        status: 400,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Usuario registrado correctamente con id ${idGenerado}`,
      })
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: `Error tocho ${error}`,
      }),
      { status: 400 }
    );
  }
}
