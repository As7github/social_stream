const json=async r=>{try{return await r.json()}catch{return {}}};
const headers={"Content-Type":"application/json","apikey":process.env.SUPABASE_SERVICE_ROLE_KEY,"Authorization":"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY};
async function sb(path,opts={}){
 const r=await fetch(process.env.SUPABASE_URL+"/rest/v1/"+path,{...opts,headers:{...headers,...(opts.headers||{})}});
 const d=await json(r);if(!r.ok)throw new Error(d.message||d.error||"Supabase error");return d;
}
export default async function handler(req,res){
 if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return res.status(500).json({error:"Storage is not configured"});
 try{
  const body=req.method==="POST"?req.body||{}:{};
  const workspace=String((req.query&&req.query.workspace_id)||body.workspace_id||"").trim(),id=String((req.query&&req.query.giveaway_id)||body.giveaway_id||"").trim();
  if(!workspace||!id)return res.status(400).json({error:"workspace_id and giveaway_id are required"});
  if(req.method==="GET"){
   const g=await sb("giveaways?id=eq."+encodeURIComponent(id)+"&workspace_id=eq."+encodeURIComponent(workspace)+"&select=*");
   let p=[],offset=0;
   while(true){const page=await sb("participants?giveaway_id=eq."+encodeURIComponent(id)+"&workspace_id=eq."+encodeURIComponent(workspace)+"&select=id,participant_key,name,role,weight&order=id.asc&limit=1000&offset="+offset);p.push(...page);if(page.length<1000)break;offset+=1000;if(offset>=100000)break}
   const d=await sb("draws?giveaway_id=eq."+encodeURIComponent(id)+"&workspace_id=eq."+encodeURIComponent(workspace)+"&select=platform,winners,created_at&order=id.asc&limit=1000");
   return res.status(200).json({giveaway:g[0]||null,participants:p,draws:d});
  }
  if(req.method!=="POST")return res.status(405).end();
  if(body.action==="save_giveaway"){
   await sb("giveaways?on_conflict=id",{method:"POST",headers:{"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify([{id,workspace_id:workspace,name:body.name||"Untitled giveaway",platform:body.platform||"Twitch",status:body.status||"open",settings:body.settings||{}}])});
   return res.status(200).json({ok:true});
  }
  if(body.action==="replace_participants"){
   const rows=Array.isArray(body.participants)?body.participants:[];
   await sb("participants?giveaway_id=eq."+encodeURIComponent(id)+"&workspace_id=eq."+encodeURIComponent(workspace),{method:"DELETE"});
   for(let i=0;i<rows.length;i+=500){
    const batch=rows.slice(i,i+500).map(p=>({workspace_id:workspace,giveaway_id:id,participant_key:String(p.key||p.name).toLowerCase(),name:String(p.name||""),role:p.role||"Viewer",weight:Math.max(1,Number(p.weight)||1)}));
    if(batch.length)await sb("participants",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify(batch)});
   }
   return res.status(200).json({ok:true,count:rows.length});
  }
  if(body.action==="save_draw"){
   await sb("draws",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify([{workspace_id:workspace,giveaway_id:id,platform:body.platform||"Twitch",winners:body.winners||[]}])});
   return res.status(200).json({ok:true});
  }
  return res.status(400).json({error:"Unknown action"});
 }catch(e){return res.status(500).json({error:e.message})}
}
