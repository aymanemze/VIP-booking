import bcrypt from "bcryptjs";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // Change this!

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function isAdminAuthenticated(request: Request): boolean {
    const cookie = request.headers.get("cookie");
    if (!cookie) return false;

    const authCookie = cookie.split(";").find((c) => c.trim().startsWith("admin_auth="));
    return authCookie?.split("=")[1] === "true";
}
