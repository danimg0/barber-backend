import { supabase } from "@/lib/constants/supabase";
import { sendMail } from "@/lib/mails/emailSender";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { resetPasswordLink } from "@/lib/constants/links";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const emailRequestingChange = body.email;

    const { data, error: emailError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", emailRequestingChange)
      .single();

    if ((emailError && emailError.code !== "PGRST116") || !data) {
      console.info(`El correo ${emailRequestingChange} no existe`);
      return new Response(
        JSON.stringify({ success: false, error: "El correo no existe" })
      );
    }

    // Crear un resetToken que se guarda en base de datos
    //jwt
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const token = jwt.sign({ userId: data.id }, process.env.JWT_SECRET, {
      expiresIn: "10m", // 10 minutos
    });
    // Crear un enlace que incluye ese reset token
    let resetURL = "";
    if (process.env.STAGE == "dev") {
      resetURL = `${resetPasswordLink}?token=${token}`;
      console.log("url creada: ", resetURL);
    } else {
      //poner link https y configurarlo con la web para que abra la app si esta instalada
      resetURL = "";
    }
    //

    await sendMail({
      email: emailRequestingChange,
      sendTo: emailRequestingChange,
      subject: "Recuperación de la contraseña",
      text: `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetURL}`,
      html: `
<div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
  <p>Haz clic en el siguiente botón para restablecer tu contraseña:</p>
  <a href="${resetURL}" 
     style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
    Restablecer contraseña
  </a>
  <p>Si no lo has solicitado, puedes ignorar este mensaje.</p>
  <p style="font-size: 14px; color: #666;">Enlace directo: <a href="${resetURL}">${resetURL}</a></p>
</div>

      `,
    });

    // const { data: updateData, error: updateError } = await supabase
    //   .from("usuarios")
    //   .update({ reset_token: token })
    //   .eq("id", data.id);

    // if (updateError) {
    //   return new Response(
    //     JSON.stringify({
    //       success: false,
    //       message: "Error al guardar el reset token en supabase",
    //     }),
    //     { status: 400 }
    //   );
    // }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Correo enviado exitosamente",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en la ruta de reset password:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Error al procesar la solicitud",
      }),
      { status: 500 }
    );
  }
}
