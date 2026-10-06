export default async function handler(req,res){
  const {code,error}=req.query||{};
  if(error)return res.status(400).send("Instagram authorization failed: "+error);
  if(!code)return res.status(400).send("Missing authorization code.");
  const clientId=process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret=process.env.INSTAGRAM_CLIENT_SECRET;
  const redirect=process.env.INSTAGRAM_REDIRECT_URI||((req.headers["x-forwarded-proto"]||"https")+"://"+req.headers.host+"/api/instagram/callback");
  if(!clientId||!clientSecret)return res.status(500).send("Instagram OAuth is not configured on the server.");
  try{
    const body=new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:"authorization_code",redirect_uri:redirect,code});
    const tokenRes=await fetch("https://api.instagram.com/oauth/access_token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
    const token=await tokenRes.json();
    if(!tokenRes.ok||!token.access_token)throw new Error(token.error_message||"Token exchange failed");
    const profileRes=await fetch("https://graph.instagram.com/me?fields=id,username,user_id&access_token="+encodeURIComponent(token.access_token));
    const profile=await profileRes.json();
    if(!profileRes.ok)throw new Error(profile.error?.message||"Profile lookup failed");
    res.setHeader("Set-Cookie","ig_access_token="+encodeURIComponent(token.access_token)+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=5184000");
    res.setHeader("Cache-Control","no-store");
    res.redirect("/winner-picker.html?instagram_connected=1");
  }catch(e){res.status(400).send("Instagram connection failed: "+e.message)}
}