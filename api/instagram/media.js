export default async function handler(req,res){
 const auth=req.headers.authorization||"";const cookies=Object.fromEntries((req.headers.cookie||"").split(";").map(x=>x.trim().split("=")).filter(x=>x.length===2).map(([k,...v])=>[k,decodeURIComponent(v.join("="))]));const token=auth.startsWith("Bearer ")?auth.slice(7):(cookies.ig_access_token||"");
 if(!token)return res.status(401).json({error:"Missing Instagram token"});
 const limit=Math.min(Number(req.query.limit||50),100);
 try{
  const u="https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit="+limit+"&access_token="+encodeURIComponent(token);
  const r=await fetch(u);const d=await r.json();
  if(!r.ok)return res.status(r.status).json(d);
  res.setHeader("Cache-Control","no-store");res.status(200).json(d);
 }catch(e){res.status(500).json({error:e.message})}
}