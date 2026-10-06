export default async function handler(req,res){
 const token=process.env.APIFY_API_TOKEN;
 const videoUrl=String(req.query?.video_url||"").trim();
 const runId=String(req.query?.run_id||"").trim();
 const action=String(req.query?.action||"start").trim();
 if(!token)return res.status(503).json({error:"TikTok collector is not configured yet."});
 try{
  if(action==="start"){
   if(!videoUrl)return res.status(400).json({error:"video_url is required"});
   const r=await fetch("https://api.apify.com/v2/acts/clockworks~tiktok-comments-scraper/runs?token="+encodeURIComponent(token),{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({postURLs:[videoUrl],commentsPerPost:100000,maxRepliesPerComment:0,resultsPerPage:100})
   });
   const d=await r.json().catch(()=>({}));
   if(!r.ok)return res.status(r.status).json({error:d?.error?.message||"Could not start TikTok collector"});
   res.setHeader("Cache-Control","no-store");
   return res.status(202).json({status:d?.data?.status||"RUNNING",run_id:d?.data?.id,dataset_id:d?.data?.defaultDatasetId});
  }
  if(action==="status"){
   if(!runId)return res.status(400).json({error:"run_id is required"});
   const r=await fetch("https://api.apify.com/v2/actor-runs/"+encodeURIComponent(runId)+"?token="+encodeURIComponent(token));
   const d=await r.json().catch(()=>({}));
   if(!r.ok)return res.status(r.status).json({error:d?.error?.message||"Could not read TikTok collector status"});
   const status=d?.data?.status||"UNKNOWN";
   if(status!=="SUCCEEDED"&&status!=="FAILED"&&status!=="ABORTED"&&status!=="TIMED-OUT")
    return res.status(200).json({status,ready:false});
   if(status!=="SUCCEEDED")return res.status(200).json({status,ready:false,error:"TikTok collection "+status.toLowerCase()});
   const datasetId=d?.data?.defaultDatasetId;
   const items=[];
   let offset=0;
   while(true){
    const u="https://api.apify.com/v2/datasets/"+encodeURIComponent(datasetId)+"/items?clean=true&format=json&limit=1000&offset="+offset;
    const ir=await fetch(u,{headers:{Authorization:"Bearer "+token}});
    const arr=await ir.json().catch(()=>[]);
    if(!ir.ok)throw new Error("Could not read TikTok comments");
    if(!Array.isArray(arr)||!arr.length)break;
    items.push(...arr);
    offset+=arr.length;
    if(arr.length<1000)break;
    if(items.length>=100000)break;
   }
   const comments=items.map(x=>({id:x.commentId||x.id||"",username:x.uniqueId||x.authorUsername||x.author?.uniqueId||x.nickname||"user",text:x.text||x.commentText||""})).filter(x=>x.text);
   res.setHeader("Cache-Control","no-store");
   return res.status(200).json({status:"SUCCEEDED",ready:true,total:comments.length,comments});
  }
  return res.status(400).json({error:"Unknown action"});
 }catch(e){return res.status(500).json({error:e.message||"TikTok collector error"})}
}