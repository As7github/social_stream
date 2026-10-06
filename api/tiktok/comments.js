export default async function handler(req,res){
 const token=process.env.TIKTOK_RESEARCH_ACCESS_TOKEN;
 const videoId=String(req.query?.video_id||"");
 const cursor=Math.max(0,Number(req.query?.cursor||0));
 if(!token)return res.status(503).json({error:"TikTok Research API is not configured"});
 if(!videoId)return res.status(400).json({error:"video_id is required"});
 try{
  const u="https://open.tiktokapis.com/v2/research/video/comment/list/?fields=id,video_id,text,create_time,like_count,reply_count,display_name";
  const r=await fetch(u,{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({video_id:videoId,max_count:100,cursor})});
  const d=await r.json();if(!r.ok)return res.status(r.status).json(d);
  res.setHeader("Cache-Control","no-store");res.status(200).json(d);
 }catch(e){res.status(500).json({error:e.message})}
}