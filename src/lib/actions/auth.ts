"use server";

import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateRoomCode } from "@/lib/utils";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(2, "Name must be at least 2 characters").max(20, "Name too long"),
});

export async function registerUser(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    displayName: formData.get("displayName") as string,
  };

  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { email, password, displayName } = parsed.data;

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const username = `${displayName.toLowerCase().replace(/\s+/g, "_")}_${generateRoomCode().toLowerCase()}`;

    await db.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName,
        username,
        name: displayName,
      },
    });

    return { success: true };
  } catch {
    return { error: "Failed to create account. Please try again." };
  }
}

export async function loginUser(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    return { success: true };
  } catch {
    return { error: "Invalid email or password." };
  }
}

export async function logoutUser() {
  await signOut({ redirect: false });
}
