// Copy this to your browser console on your admin panel
console.log("=== AUTH DEBUG ===");

// Check for session
const session = localStorage.getItem('golang_session');
console.log("Session found:", !!session);

if (session) {
  try {
    const parsed = JSON.parse(session);
    console.log("Session data:", parsed);
    console.log("Token expires:", parsed.expires_at);
    console.log("Is expired:", new Date(parsed.expires_at) < new Date());
    console.log("Access token (first 50 chars):", parsed.access_token?.substring(0, 50));
  } catch (e) {
    console.log("Session parse error:", e);
  }
}

// Check for other tokens
console.log("Other tokens in localStorage:");
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.includes('token') || key.includes('auth') || key.includes('session')) {
    console.log(`  ${key}:`, localStorage.getItem(key)?.substring(0, 50));
  }
}
