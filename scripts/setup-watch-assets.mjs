import fs from "node:fs";
import path from "node:path";

const projectPath=path.join(process.cwd(),"ios","App","App.xcodeproj","project.pbxproj");
if(!fs.existsSync(projectPath))throw new Error("iOS project not found");
let src=fs.readFileSync(projectPath,"utf8");
if(!src.includes('7A1300302CB0000000000001 /* TTWITTUNWatch */'))throw new Error("Run `node scripts/setup-watch.mjs` first.");

if(!src.includes('7A1300072CB0000000000001 /* Assets.xcassets in Resources */')){
 src=src.replace('/* End PBXBuildFile section */','\t\t7A1300072CB0000000000001 /* Assets.xcassets in Resources */ = {isa = PBXBuildFile; fileRef = 504EC30E1FED79650016851F /* Assets.xcassets */; };\n/* End PBXBuildFile section */');
 src=src.replace('7A1300332CB0000000000001 /* Resources */ = {isa = PBXResourcesBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0; };','7A1300332CB0000000000001 /* Resources */ = {isa = PBXResourcesBuildPhase; buildActionMask = 2147483647; files = (7A1300072CB0000000000001 /* Assets.xcassets in Resources */, ); runOnlyForDeploymentPostprocessing = 0; };');
}

const marker='CODE_SIGN_ENTITLEMENTS = TTWITTUNWatch/TTWITTUNWatch.entitlements;';
const withIcon='CODE_SIGN_ENTITLEMENTS = TTWITTUNWatch/TTWITTUNWatch.entitlements;\n\t\t\t\tASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;';
const iconSettingCount=(src.match(/ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;/g)||[]).length;
if(iconSettingCount<4){
 const pieces=src.split(marker);
 if(pieces.length>=3)src=pieces.join(withIcon);
}

fs.writeFileSync(projectPath,src,"utf8");
console.log("[TTWITTUN] watchOS AppIcon wired from the shared TTWITTUN asset catalog.");
