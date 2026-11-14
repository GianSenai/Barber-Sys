
/**
 * Administrador local para demonstração.
 * Não utilizar como autenticação de produção.
 */

const DEMO_EMAIL = "admin@barbersys.com";
const DEMO_PASSWORD = "BarberSys@2026!";
const DEMO_SESSION_KEY = "barber-sys-demo-admin-session";

export function signInDemoAdmin(
  email: string,
  password: string
): boolean {
  if (typeof window === "undefined") return false;

  const valid =
    email.trim().toLowerCase() === DEMO_EMAIL &&
    password === DEMO_PASSWORD;

  if (valid) {
    window.localStorage.setItem(DEMO_SESSION_KEY, "true");
  }

  return valid;
}

export function isDemoAdminSession(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.localStorage.getItem(DEMO_SESSION_KEY) === "true"
  );
}

export function signOutDemoAdmin(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(DEMO_SESSION_KEY);
  }
}
