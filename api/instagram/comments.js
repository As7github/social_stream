export default async function handler(req,res){
  const cookies=Object.fromEntries((req.headers.cookie||"").split(";").map(x=>x.trim().split("=")).filter(x=>x.length===2).map(([k,...v])=>[k,decodeURIComponent(v.join("="))]));
  const token=cookies.ig_access_token;
  if(!token)return res.status(401).json({error:"Instagram is not connected"});
  const mediaId=req.query.media_id;
  if(!mediaId)return res.status(400).json({error:"media_id is required"});
  try{
    const after=req.query.after?("&after="+encodeURIComponent(req.query.after)):""; const url="https://graph.instagram.com/"+encodeURIComponent(mediaId)+"/comments?fields=id,text,username,timestamp,replies&limit=100"+after+"&access_token="+encodeURIComponent(token);
    const r=await fetch(url);const d=await r.json();
    if(!r.ok)return res.status(r.status).json(d);
    res.setHeader("Cache-Control","no-store");res.status(200).json(d);
  }catch(e){res.status(500).json({error:e.message})}
}
