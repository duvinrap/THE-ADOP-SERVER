const roles = {
 gameIdea:'You are a professional game designer. Create original practical game concepts with genre, core loop, mechanics, progression, art direction and pitch.',
 story:'You are a game narrative designer. Create original stories, characters, motivations, world, conflicts and mission hooks.',
 level:'You are a level designer. Create playable levels with objectives, layout, encounters, rewards and progression.',
 npc:'You are a game AI/NPC designer. Create NPC role, personality, behavior, dialogue hooks, AI states and gameplay purpose.',
 code:'You are a senior game developer. Follow requested language/engine; default to Godot GDScript. Provide complete readable code, file placement and required nodes.',
 asset:'You are a game art director. Create detailed production-friendly prompts for game assets, characters, environments, UI and VFX.',
 gdd:'You are a game producer. Create a concise mini Game Design Document covering vision, audience, gameplay, systems, story, levels, art, audio and roadmap.'
};
function cors(res){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');}
module.exports=async(req,res)=>{
 cors(res);
 if(req.method==='OPTIONS')return res.status(204).end();
 if(req.method==='GET')return res.status(200).json({ok:true,service:'THE ADOP AI API'});
 if(req.method!=='POST')return res.status(405).json({error:'Use POST for AI requests.'});
 try{
  const key=process.env.GEMINI_API_KEY, model=(process.env.GEMINI_MODEL||'gemini-2.5-flash').trim();
  if(!key)return res.status(503).json({error:'Setup required: add GEMINI_API_KEY in Vercel Environment Variables.'});
  let body=req.body;
  if(typeof body==='string'){try{body=JSON.parse(body)}catch{body=null}}
  if(!body||typeof body!=='object')return res.status(400).json({error:'Request body must be valid JSON.'});
  const tool=String(body.tool||'').trim(), prompt=String(body.prompt||'').trim();
  if(!roles[tool])return res.status(400).json({error:'Unknown AI tool. Refresh THE ADOP and try again.'});
  if(!prompt)return res.status(400).json({error:'Please enter a prompt first.'});
  if(prompt.length>20000)return res.status(413).json({error:'Prompt is too long. Shorten it.'});
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),50000);
  let response;
  try{response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},signal:controller.signal,body:JSON.stringify({system_instruction:{parts:[{text:roles[tool]}]},contents:[{role:'user',parts:[{text:prompt+'\n\nReturn a useful structured answer. Be original.'}]}]})});}
  catch(e){return res.status(e.name==='AbortError'?504:502).json({error:e.name==='AbortError'?'Gemini timed out. Try again.':'Could not connect to Gemini. Check service status and retry.'});}
  finally{clearTimeout(timer)}
  const data=await response.json().catch(()=>({}));
  if(!response.ok)return res.status(response.status===429?429:502).json({error:data?.error?.message||'Gemini failed (HTTP '+response.status+'). Check API key, model and quota.'});
  const text=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('').trim();
  if(!text)return res.status(502).json({error:'Gemini returned no text. Try again.'});
  return res.status(200).json({text});
 }catch(e){console.error('THE ADOP API:',e);return res.status(500).json({error:'Unexpected server error. Please retry.'})}
};
