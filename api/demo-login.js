export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const demoEmail = process.env.WASHTRAC_DEMO_EMAIL;
  const demoPassword = process.env.WASHTRAC_DEMO_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey || !demoEmail || !demoPassword) {
    return res.status(500).json({
      error: "Live Demo environment variables are not configured."
    });
  }

  try {
    const authResponse = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey
        },
        body: JSON.stringify({
          email: demoEmail,
          password: demoPassword
        })
      }
    );

    const authData = await authResponse.json();

    if (!authResponse.ok || !authData.access_token || !authData.refresh_token) {
      console.error("Demo authentication failed:", authData);

      return res.status(401).json({
        error: "The Live Demo account could not be authenticated."
      });
    }

    return res.status(200).json({
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      expires_in: authData.expires_in
    });

  } catch (error) {
    console.error("Demo login endpoint error:", error);

    return res.status(500).json({
      error: "The Live Demo service is temporarily unavailable."
    });
  }
}
