// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://esm.sh/jose@5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // admin 权限
const JWT_SECRET = Deno.env.get("JWT_SECRET")!; // Supabase 项目 JWT Secret（用于自签）
const WECHAT_APPID = Deno.env.get("WECHAT_APPID")!;
const WECHAT_SECRET = Deno.env.get("WECHAT_SECRET")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

async function fetchWeChatToken(code: string) {
  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&code=${code}&grant_type=authorization_code`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.errcode) throw new Error(`wechat token error: ${JSON.stringify(data)}`);
  return data as { access_token: string; openid: string; unionid?: string };
}

async function upsertUser(wechat: { openid: string; unionid?: string }) {
  // 用 wechat:openid 作为外部 id，创建/查找 auth.users
  const externalId = `wechat:${wechat.openid}`;
  const email = `${wechat.openid}@wechat.local`;

  // 查是否存在
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1, filter: `email.eq.${email}` as any });
  let userId: string | null = existing?.users?.[0]?.id ?? null;

  if (!userId) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        provider: "wechat",
        openid: wechat.openid,
        unionid: wechat.unionid ?? null,
      }
    });
    if (error) throw error;
    userId = data.user?.id ?? null;
  }
  if (!userId) throw new Error("failed to ensure user");
  return { userId, email };
}

async function signCustomJwt(userId: string) {
  const alg = "HS256";
  const key = new TextEncoder().encode(JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    exp: now + 3600,
    iat: now,
    aud: "authenticated",
    role: "authenticated",
  };
  const jwt = await new jose.SignJWT(payload).setProtectedHeader({ alg }).sign(key);
  return jwt;
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    const { code } = await req.json();
    if (!code) return new Response(JSON.stringify({ error: "missing code" }), { status: 400 });

    const token = await fetchWeChatToken(code);
    const { userId, email } = await upsertUser({ openid: token.openid, unionid: token.unionid });

    const access_token = await signCustomJwt(userId);

    // 同步业务表
    await supabaseAdmin.from("app.users").upsert({ uid: userId, display_name: email.split("@")[0] }).select();

    return new Response(JSON.stringify({
      access_token,
      token_type: "bearer",
      expires_in: 3600,
      user: { id: userId, email }
    }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
});
