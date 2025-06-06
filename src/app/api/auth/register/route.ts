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

    console.log("Datos recibidos en la api", onlyBody);

    // Comprobar si el email ya existe
    const { data: existingUser, error: emailError } = await supabase
      .from("usuarios")
      .select("email, phone")
      .eq("email", onlyBody.email)
      .single();
    //todo: coger email y phone en la misma consulta y si email == oblyBody.email, error de email, si no, error de telefono. Si no para alante.

    if (emailError && emailError.code !== "PGRST116") {
      // Solo es un error si NO es "no rows"
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
      // Ya existe ese email
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
    if (phoneError && phoneError.code !== "PGRST116") {
      // Solo es un error si NO es "no rows"
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
      // Ya existe ese teléfono
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
