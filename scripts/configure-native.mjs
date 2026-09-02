import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const iosPlist=path.join(root,"ios","App","App","Info.plist");
const androidManifest=path.join(root,"android","app","src","main","AndroidManifest.xml");

function replaceOnce(file,needle,replacement){
 const src=fs.readFileSync(file,"utf8");
 if(src.includes(replacement.trim()))return false;
 if(!src.includes(needle))throw new Error(`Could not find insertion point in ${file}`);
 fs.writeFileSync(file,src.replace(needle,replacement),"utf8");
 return true;
}

if(fs.existsSync(iosPlist)){
 const src=fs.readFileSync(iosPlist,"utf8");
 if(!src.includes("NSLocationWhenInUseUsageDescription")){
  const marker="</dict>\n</plist>";
  const block=`\t<key>NSLocationWhenInUseUsageDescription</key>\n\t<string>TTWITTUN은 러닝 중 현재 위치와 이동 경로를 기록하고 주변 러닝 코스를 안내하기 위해 위치 정보를 사용합니다.</string>\n</dict>\n</plist>`;
  replaceOnce(iosPlist,marker,block);
 }
 console.log("[TTWITTUN] iOS location descriptions configured.");
}else{
 console.warn("[TTWITTUN] iOS project not found. Run `npx cap add ios` first.");
}

if(fs.existsSync(androidManifest)){
 let src=fs.readFileSync(androidManifest,"utf8");
 const permissions=[
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />'
 ];
 const missing=permissions.filter(p=>!src.includes(p));
 if(missing.length){
  src=src.replace("<application",`${missing.join("\n    ")}\n\n    <application`);
  fs.writeFileSync(androidManifest,src,"utf8");
 }
 console.log("[TTWITTUN] Android foreground location permissions configured.");
}else{
 console.warn("[TTWITTUN] Android project not found. Run `npx cap add android` first.");
}

console.log("[TTWITTUN] Native configuration complete.");
