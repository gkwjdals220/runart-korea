"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import TtwittunButtonIcon from "@/components/TtwittunButtonIcon";

export default function ProfileEditor({userId,initialName,initialAvatarPath=null}:{userId:string;initialName:string;initialAvatarPath?:string|null}){
 const [name,setName]=useState(initialName);const [savedName,setSavedName]=useState(initialName.trim());const [msg,setMsg]=useState("");const [saving,setSaving]=useState(false);
 const [avatarPath,setAvatarPath]=useState<string|null>(initialAvatarPath);const [avatarUrl,setAvatarUrl]=useState<string>("");const [uploading,setUploading]=useState(false);
 const libraryRef=useRef<HTMLInputElement|null>(null);const cameraRef=useRef<HTMLInputElement|null>(null);
 const sb=createClient();

 useEffect(()=>{let cancelled=false;async function load(){if(!avatarPath){setAvatarUrl("");return}const {data}=await sb.storage.from("runart-media").createSignedUrl(avatarPath,3600);if(!cancelled)setAvatarUrl(data?.signedUrl||"")}load();return()=>{cancelled=true}},[avatarPath]);

 async function save(){
  const v=name.trim();if(!v)return setMsg("표시 이름을 입력해주세요.");if(v===savedName)return setMsg("변경된 이름이 없습니다.");
  setSaving(true);setMsg("");
  try{const {error}=await sb.from("runart_profiles").upsert({user_id:userId,display_name:v,avatar_path:avatarPath,updated_at:new Date().toISOString()});if(error)throw error;setName(v);setSavedName(v);setMsg("표시 이름을 저장했습니다.");}
  catch(e:any){setMsg(e?.message||"이름 저장 중 오류가 발생했습니다.")}finally{setSaving(false)}
 }

 async function uploadAvatar(file?:File){
  if(!file)return;
  if(!file.type.startsWith("image/")){setMsg("이미지 파일만 등록할 수 있습니다.");return}
  if(file.size>5*1024*1024){setMsg("프로필 사진은 5MB 이하로 등록해주세요.");return}
  setUploading(true);setMsg("");
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
  const nextPath=`avatars/${userId}/profile-${Date.now()}.${ext}`;
  try{
   const {error:uploadError}=await sb.storage.from("runart-media").upload(nextPath,file,{cacheControl:"3600",upsert:false,contentType:file.type||"image/jpeg"});if(uploadError)throw uploadError;
   const {error:profileError}=await sb.from("runart_profiles").upsert({user_id:userId,display_name:name.trim()||savedName||"러너",avatar_path:nextPath,updated_at:new Date().toISOString()});if(profileError)throw profileError;
   const previous=avatarPath;setAvatarPath(nextPath);setMsg("프로필 사진을 저장했습니다.");
   if(previous&&previous!==nextPath)await sb.storage.from("runart-media").remove([previous]);
  }catch(e:any){setMsg(e?.message||"프로필 사진 저장 중 오류가 발생했습니다.")}finally{
   setUploading(false);
   if(libraryRef.current)libraryRef.current.value="";
   if(cameraRef.current)cameraRef.current.value="";
  }
 }

 const unchanged=name.trim()===savedName;
 return <div className="card profileEditorCard">
  <div><span className="eyebrow">DISPLAY NAME</span><h3>내 프로필</h3></div>
  <div className="profilePhotoRow">
   <button type="button" className="profilePhotoButton" onClick={()=>libraryRef.current?.click()} disabled={uploading} aria-label="프로필 사진 선택">
    {avatarUrl?<img src={avatarUrl} alt="프로필 사진"/>:<span aria-hidden="true">+</span>}
   </button>
   <div className="profilePhotoMeta">
    <b>{uploading?"사진 업로드 중…":"프로필 사진"}</b><small className="muted">정사각형 이미지 권장 · 최대 5MB</small>
    <div className="profilePhotoActions"><button type="button" className="btn ghost profilePhotoAction" disabled={uploading} onClick={()=>cameraRef.current?.click()}>사진 찍기</button><button type="button" className="btn ghost profilePhotoAction" disabled={uploading} onClick={()=>libraryRef.current?.click()}>앨범에서 선택</button></div>
   </div>
   <input ref={cameraRef} className="profilePhotoInput" type="file" accept="image/*" capture="user" onChange={e=>uploadAvatar(e.target.files?.[0])}/>
   <input ref={libraryRef} className="profilePhotoInput" type="file" accept="image/*" onChange={e=>uploadAvatar(e.target.files?.[0])}/>
  </div>
  <label>표시 이름<input value={name} maxLength={40} disabled={saving} autoComplete="nickname" onChange={e=>{setName(e.target.value);setMsg("")}}/></label>
  <small className="muted profileNameHint">러닝 기록과 크루 화면에 표시됩니다.</small>
  <button className="btn" type="button" disabled={saving||unchanged||!name.trim()} onClick={save}><TtwittunButtonIcon name="save" compact/>{saving?"저장 중…":unchanged?"현재 이름":"이름 저장"}</button>
  {msg&&<p className="muted formStatus" role="status" aria-live="polite">{msg}</p>}
 </div>
}
