const COOKIE_NAME = "site_session";

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

export default async (request: Request) => {
  const url = new URL(request.url);
  const password = Deno.env.get("PROTECTED_PAGE_PASSWORD");

  // Never fail open.
  if (!password) {
    return new Response(
      renderPage({
        notConfigured: true,
      }),
      { status: 503, headers: { "content-type": "text/html" } },
    );
  }

  const expectedHash = await sha256(password);

  // Logout
  if (url.pathname === "/__logout") {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
      },
    });
  }

  // Login submission
  if (request.method === "POST") {
    const form = await request.formData();
    const submitted = String(form.get("password") ?? "");
    const submittedHash = await sha256(submitted);

    if (submittedHash === expectedHash) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: url.pathname === "/__logout" ? "/" : url.pathname,
          "Set-Cookie": `${COOKIE_NAME}=${expectedHash}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
        },
      });
    }

    return new Response(renderPage({ error: true }), {
      status: 401,
      headers: { "content-type": "text/html" },
    });
  }

  // Already authenticated
  const sessionCookie = getCookie(request, COOKIE_NAME);
  if (sessionCookie === expectedHash) {
    return; // pass through to the real static page
  }

  return new Response(renderPage({}), {
    status: 401,
    headers: { "content-type": "text/html" },
  });
};

function renderPage({
  error,
  notConfigured,
}: {
  error?: boolean;
  notConfigured?: boolean;
}) {
  if (notConfigured) {
    return `<!DOCTYPE html><html><body style="font-family:system-ui;max-width:480px;margin:120px auto;text-align:center;">
      <p>This page is not yet configured.</p>
    </body></html>`;
  }
  return `<!DOCTYPE html><html><body style="font-family:var(--sl-font, system-ui);background:var(--sl-color-bg, #1e293b);color:var(--sl-color-text, #fff);display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
    <form method="POST" style="background:var(--sl-color-bg-nav, #0f172a);padding:2rem;border-radius:8px;width:300px;">
      <h1 style="font-size:1.1rem;margin-top:0;">Password required</h1>
      ${error ? `<p style="color:#f87171;font-size:0.9rem;">Incorrect password. Try again.</p>` : ""}
      <input type="password" name="password" placeholder="Password" required autofocus
        style="width:100%;padding:0.6rem;box-sizing:border-box;border-radius:4px;border:1px solid #475569;margin-bottom:0.75rem;">
      <button type="submit" style="width:100%;padding:0.6rem;border-radius:4px;border:none;background:var(--sl-color-accent, #6366f1);color:#fff;cursor:pointer;">
        Enter
      </button>
    </form>
  </body></html>`;
}
