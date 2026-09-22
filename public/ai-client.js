const THE_ADOP_SERVER='https://the-adop-server.vercel.app';
function getAdopApiBase(){
 try{if(window.AdopAndroid&&typeof window.AdopAndroid.getApiBase==='function'){const b=String(window.AdopAndroid.getApiBase()||'').trim().replace(/\\/+$/,'');if(/^https?:\\/\\//i.test(b)&&!/(localhost|127\\.0\\.1|10\\.0\\.2\\.2)/i.test(b))return b;}}catch(_){}
 try{if(location.protocol==='https:'||location.protocol==='http:')return location.origin;}catch(_){}
 return THE_ADOP_SERVER;
}
function getAdopLanguage(){
 try {
  const candidates=[window.adopLanguage,window.currentLanguage,window.selectedLanguage,window.language,
    localStorage.getItem('adopLanguage'),localStorage.getItem('selectedLanguage'),localStorage.getItem('language')];
  for(const value of candidates){
   const v=String(value||'').trim().toLowerCase();
   if(['ta','tamil','தமிழ்'].includes(v)) return 'Tamil';
   if(['si','sinhala','සිංහල'].includes(v)) return 'Sinhala';
   if(['en','english'].includes(v)) return 'English';
  }
 } catch(_) {}
 return 'English';
}
async function theAdopAI(tool,prompt,language){
 const url=getAdopApiBase().replace(/\\/+$/,'')+'/api/ai', controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),65000);
 try{
  const response=await fetch(url,{method:'POST',mode:'cors',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({tool:String(tool||'').trim(),prompt:String(prompt||'').trim(),language:String(language||getAdopLanguage())}),signal:controller.signal});
  const raw=await response.text();let data;
  try{data=raw?JSON.parse(raw):{}}catch(_){data={error:'Server returned non-JSON response (HTTP '+response.status+'). Check Vercel deployment/routes.'}}
  if(!response.ok)throw new Error(data.error||'AI request failed (HTTP '+response.status+').');
  if(!data||typeof data.text!=='string'||!data.text.trim())throw new Error('AI returned an empty response. Try again.');
  return data.text;
 }catch(e){if(e&&e.name==='AbortError')throw new Error('AI request timed out. Check connection and retry.');if(e instanceof TypeError)throw new Error('Cannot reach THE ADOP API at '+url+'. Check internet, deployment URL and Vercel status.');throw e instanceof Error?e:new Error('Unexpected connection error.');}
 finally{clearTimeout(timer)}
}
window.theAdopAI=theAdopAI;
