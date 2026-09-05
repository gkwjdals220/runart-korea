import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const projectPath=path.join(root,"ios","App","App.xcodeproj","project.pbxproj");
if(!fs.existsSync(projectPath))throw new Error("iOS Xcode project not found. Run `npx cap sync ios` first.");
let src=fs.readFileSync(projectPath,"utf8");
if(src.includes('7A1300302CB0000000000001 /* TTWITTUNWatch */')){
 console.log("[TTWITTUN] Apple Watch target is already configured.");
 process.exit(0);
}

function mustReplace(needle,replacement){
 if(!src.includes(needle))throw new Error(`Watch setup insertion point not found: ${needle.slice(0,80)}`);
 src=src.replace(needle,replacement);
}

// Build file references.
mustReplace(
 '/* End PBXBuildFile section */',
 `\t\t7A1300012CB0000000000001 /* TTWITTUNWatchApp.swift in Sources */ = {isa = PBXBuildFile; fileRef = 7A1300112CB0000000000001 /* TTWITTUNWatchApp.swift */; };\n\t\t7A1300022CB0000000000001 /* ContentView.swift in Sources */ = {isa = PBXBuildFile; fileRef = 7A1300122CB0000000000001 /* ContentView.swift */; };\n\t\t7A1300032CB0000000000001 /* WatchRunManager.swift in Sources */ = {isa = PBXBuildFile; fileRef = 7A1300132CB0000000000001 /* WatchRunManager.swift */; };\n\t\t7A1300042CB0000000000001 /* WatchRunSync.swift in Sources */ = {isa = PBXBuildFile; fileRef = 7A1300162CB0000000000001 /* WatchRunSync.swift */; };\n\t\t7A1300052CB0000000000001 /* TTWITTUNWatchPlugin.swift in Sources */ = {isa = PBXBuildFile; fileRef = 7A1300172CB0000000000001 /* TTWITTUNWatchPlugin.swift */; };\n\t\t7A1300062CB0000000000001 /* TTWITTUNWatch.app in Embed Watch Content */ = {isa = PBXBuildFile; fileRef = 7A1300182CB0000000000001 /* TTWITTUNWatch.app */; settings = {ATTRIBUTES = (RemoveHeadersOnCopy, ); }; };\n/* End PBXBuildFile section */`
);

mustReplace(
 '/* End PBXFileReference section */',
 `\t\t7A1300112CB0000000000001 /* TTWITTUNWatchApp.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = TTWITTUNWatchApp.swift; sourceTree = "<group>"; };\n\t\t7A1300122CB0000000000001 /* ContentView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ContentView.swift; sourceTree = "<group>"; };\n\t\t7A1300132CB0000000000001 /* WatchRunManager.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = WatchRunManager.swift; sourceTree = "<group>"; };\n\t\t7A1300142CB0000000000001 /* TTWITTUNWatch.entitlements */ = {isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = TTWITTUNWatch.entitlements; sourceTree = "<group>"; };\n\t\t7A1300152CB0000000000001 /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };\n\t\t7A1300162CB0000000000001 /* WatchRunSync.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = WatchRunSync.swift; sourceTree = "<group>"; };\n\t\t7A1300172CB0000000000001 /* TTWITTUNWatchPlugin.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = TTWITTUNWatchPlugin.swift; sourceTree = "<group>"; };\n\t\t7A1300182CB0000000000001 /* TTWITTUNWatch.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = TTWITTUNWatch.app; sourceTree = BUILT_PRODUCTS_DIR; };\n/* End PBXFileReference section */`
);

mustReplace(
 '/* End PBXContainerItemProxy section */',
 `\t\t7A1300352CB0000000000001 /* PBXContainerItemProxy */ = {isa = PBXContainerItemProxy; containerPortal = 504EC2FC1FED79650016851F /* Project object */; proxyType = 1; remoteGlobalIDString = 7A1300302CB0000000000001; remoteInfo = TTWITTUNWatch; };\n/* End PBXContainerItemProxy section */`
);

mustReplace(
 '/* End PBXCopyFilesBuildPhase section */',
 `\t\t7A1300342CB0000000000001 /* Embed Watch Content */ = {isa = PBXCopyFilesBuildPhase; buildActionMask = 2147483647; dstPath = "$(CONTENTS_FOLDER_PATH)/Watch"; dstSubfolderSpec = 16; files = (7A1300062CB0000000000001 /* TTWITTUNWatch.app in Embed Watch Content */, ); name = "Embed Watch Content"; runOnlyForDeploymentPostprocessing = 0; };\n/* End PBXCopyFilesBuildPhase section */`
);

mustReplace(
 '/* End PBXFrameworksBuildPhase section */',
 `\t\t7A1300322CB0000000000001 /* Frameworks */ = {isa = PBXFrameworksBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0; };\n/* End PBXFrameworksBuildPhase section */`
);

mustReplace(
 '\t\t\t\t504EC3061FED79650016851F /* App */,\n\t\t\t\t7A1200122CA0000000000001 /* TTWITTUNRunActivity */,',
 '\t\t\t\t504EC3061FED79650016851F /* App */,\n\t\t\t\t7A1200122CA0000000000001 /* TTWITTUNRunActivity */,\n\t\t\t\t7A1300202CB0000000000001 /* TTWITTUNWatch */,'
);

mustReplace(
 '\t\t\t\t504EC3041FED79650016851F /* App.app */,\n\t\t\t\t7A1200042CA0000000000001 /* TTWITTUNRunActivity.appex */,',
 '\t\t\t\t504EC3041FED79650016851F /* App.app */,\n\t\t\t\t7A1200042CA0000000000001 /* TTWITTUNRunActivity.appex */,\n\t\t\t\t7A1300182CB0000000000001 /* TTWITTUNWatch.app */,'
);

mustReplace(
 '\t\t7A1200122CA0000000000001 /* TTWITTUNRunActivity */ = {',
 `\t\t7A1300202CB0000000000001 /* TTWITTUNWatch */ = {\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\t7A1300112CB0000000000001 /* TTWITTUNWatchApp.swift */,\n\t\t\t\t7A1300122CB0000000000001 /* ContentView.swift */,\n\t\t\t\t7A1300132CB0000000000001 /* WatchRunManager.swift */,\n\t\t\t\t7A1300142CB0000000000001 /* TTWITTUNWatch.entitlements */,\n\t\t\t\t7A1300152CB0000000000001 /* Info.plist */,\n\t\t\t);\n\t\t\tpath = TTWITTUNWatch;\n\t\t\tsourceTree = "<group>";\n\t\t};\n\t\t7A1200122CA0000000000001 /* TTWITTUNRunActivity */ = {`
);

mustReplace(
 '\t\t\t\t7A1100062CA0000000000001 /* TTWITTUNBridgeViewController.swift */,',
 '\t\t\t\t7A1100062CA0000000000001 /* TTWITTUNBridgeViewController.swift */,\n\t\t\t\t7A1300162CB0000000000001 /* WatchRunSync.swift */,\n\t\t\t\t7A1300172CB0000000000001 /* TTWITTUNWatchPlugin.swift */,'
);

// App target embeds and depends on the watch app.
mustReplace(
 '\t\t\t\t7A1200112CA0000000000001 /* Embed App Extensions */,',
 '\t\t\t\t7A1200112CA0000000000001 /* Embed App Extensions */,\n\t\t\t\t7A1300342CB0000000000001 /* Embed Watch Content */,'
);
mustReplace(
 '\t\t\t\t7A1200072CA0000000000001 /* PBXTargetDependency */,',
 '\t\t\t\t7A1200072CA0000000000001 /* PBXTargetDependency */,\n\t\t\t\t7A1300362CB0000000000001 /* PBXTargetDependency */,'
);

mustReplace(
 '/* End PBXNativeTarget section */',
 `\t\t7A1300302CB0000000000001 /* TTWITTUNWatch */ = {\n\t\t\tisa = PBXNativeTarget;\n\t\t\tbuildConfigurationList = 7A1300402CB0000000000001 /* Build configuration list for PBXNativeTarget "TTWITTUNWatch" */;\n\t\t\tbuildPhases = (7A1300312CB0000000000001 /* Sources */, 7A1300322CB0000000000001 /* Frameworks */, 7A1300332CB0000000000001 /* Resources */, );\n\t\t\tbuildRules = ();\n\t\t\tdependencies = ();\n\t\t\tname = TTWITTUNWatch;\n\t\t\tproductName = TTWITTUNWatch;\n\t\t\tproductReference = 7A1300182CB0000000000001 /* TTWITTUNWatch.app */;\n\t\t\tproductType = "com.apple.product-type.application.watchapp2";\n\t\t};\n/* End PBXNativeTarget section */`
);

mustReplace(
 '\t\t\t\t\t7A1200092CA0000000000001 = {\n\t\t\t\t\t\tCreatedOnToolsVersion = 16.0;\n\t\t\t\t\t\tProvisioningStyle = Automatic;\n\t\t\t\t\t};',
 `\t\t\t\t\t7A1200092CA0000000000001 = {\n\t\t\t\t\t\tCreatedOnToolsVersion = 16.0;\n\t\t\t\t\t\tProvisioningStyle = Automatic;\n\t\t\t\t\t};\n\t\t\t\t\t7A1300302CB0000000000001 = {\n\t\t\t\t\t\tCreatedOnToolsVersion = 16.0;\n\t\t\t\t\t\tProvisioningStyle = Automatic;\n\t\t\t\t\t\tSystemCapabilities = {\n\t\t\t\t\t\t\tcom.apple.HealthKit = { enabled = 1; };\n\t\t\t\t\t\t};\n\t\t\t\t\t};`
);

mustReplace(
 '\t\t\t\t7A1200092CA0000000000001 /* TTWITTUNRunActivity */,\n\t\t\t);',
 '\t\t\t\t7A1200092CA0000000000001 /* TTWITTUNRunActivity */,\n\t\t\t\t7A1300302CB0000000000001 /* TTWITTUNWatch */,\n\t\t\t);'
);

mustReplace(
 '/* End PBXResourcesBuildPhase section */\n\n/* Begin PBXShellScriptBuildPhase section */',
 `/* End PBXResourcesBuildPhase section */\n\n/* Begin PBXResourcesBuildPhase section */\n\t\t7A1300332CB0000000000001 /* Resources */ = {isa = PBXResourcesBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0; };\n/* End PBXResourcesBuildPhase section */\n\n/* Begin PBXShellScriptBuildPhase section */`
);

mustReplace(
 '\t\t\t\t7A1100052CA0000000000001 /* TTWITTUNBridgeViewController.swift in Sources */,',
 '\t\t\t\t7A1100052CA0000000000001 /* TTWITTUNBridgeViewController.swift in Sources */,\n\t\t\t\t7A1300042CB0000000000001 /* WatchRunSync.swift in Sources */,\n\t\t\t\t7A1300052CB0000000000001 /* TTWITTUNWatchPlugin.swift in Sources */,'
);

mustReplace(
 '/* End PBXSourcesBuildPhase section */\n\n/* Begin PBXTargetDependency section */',
 `/* End PBXSourcesBuildPhase section */\n\n/* Begin PBXSourcesBuildPhase section */\n\t\t7A1300312CB0000000000001 /* Sources */ = {isa = PBXSourcesBuildPhase; buildActionMask = 2147483647; files = (7A1300012CB0000000000001 /* TTWITTUNWatchApp.swift in Sources */, 7A1300022CB0000000000001 /* ContentView.swift in Sources */, 7A1300032CB0000000000001 /* WatchRunManager.swift in Sources */, ); runOnlyForDeploymentPostprocessing = 0; };\n/* End PBXSourcesBuildPhase section */\n\n/* Begin PBXTargetDependency section */`
);

mustReplace(
 '/* End PBXTargetDependency section */',
 `\t\t7A1300362CB0000000000001 /* PBXTargetDependency */ = {isa = PBXTargetDependency; target = 7A1300302CB0000000000001 /* TTWITTUNWatch */; targetProxy = 7A1300352CB0000000000001 /* PBXContainerItemProxy */; };\n/* End PBXTargetDependency section */`
);

mustReplace(
 '/* End XCBuildConfiguration section */',
 `\t\t7A1300412CB0000000000001 /* Debug */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbuildSettings = {\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = TTWITTUNWatch/TTWITTUNWatch.entitlements;\n\t\t\t\tCODE_SIGN_STYLE = Automatic;\n\t\t\t\tCURRENT_PROJECT_VERSION = 4;\n\t\t\t\tDEVELOPMENT_TEAM = G57WPP94A8;\n\t\t\t\tINFOPLIST_FILE = TTWITTUNWatch/Info.plist;\n\t\t\t\tLD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";\n\t\t\t\tMARKETING_VERSION = 1.0;\n\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.ttwittun.korea.watchkitapp;\n\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";\n\t\t\t\tSDKROOT = watchos;\n\t\t\t\tSKIP_INSTALL = YES;\n\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;\n\t\t\t\tSWIFT_VERSION = 5.0;\n\t\t\t\tTARGETED_DEVICE_FAMILY = 4;\n\t\t\t\tWATCHOS_DEPLOYMENT_TARGET = 10.0;\n\t\t\t};\n\t\t\tname = Debug;\n\t\t};\n\t\t7A1300422CB0000000000001 /* Release */ = {\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbuildSettings = {\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = TTWITTUNWatch/TTWITTUNWatch.entitlements;\n\t\t\t\tCODE_SIGN_STYLE = Automatic;\n\t\t\t\tCURRENT_PROJECT_VERSION = 4;\n\t\t\t\tDEVELOPMENT_TEAM = G57WPP94A8;\n\t\t\t\tINFOPLIST_FILE = TTWITTUNWatch/Info.plist;\n\t\t\t\tLD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";\n\t\t\t\tMARKETING_VERSION = 1.0;\n\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.ttwittun.korea.watchkitapp;\n\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";\n\t\t\t\tSDKROOT = watchos;\n\t\t\t\tSKIP_INSTALL = YES;\n\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = "";\n\t\t\t\tSWIFT_VERSION = 5.0;\n\t\t\t\tTARGETED_DEVICE_FAMILY = 4;\n\t\t\t\tWATCHOS_DEPLOYMENT_TARGET = 10.0;\n\t\t\t};\n\t\t\tname = Release;\n\t\t};\n/* End XCBuildConfiguration section */`
);

mustReplace(
 '/* End XCConfigurationList section */',
 `\t\t7A1300402CB0000000000001 /* Build configuration list for PBXNativeTarget "TTWITTUNWatch" */ = {\n\t\t\tisa = XCConfigurationList;\n\t\t\tbuildConfigurations = (7A1300412CB0000000000001 /* Debug */, 7A1300422CB0000000000001 /* Release */, );\n\t\t\tdefaultConfigurationIsVisible = 0;\n\t\t\tdefaultConfigurationName = Release;\n\t\t};\n/* End XCConfigurationList section */`
);

fs.writeFileSync(projectPath,src,"utf8");
console.log("[TTWITTUN] Apple Watch target configured: TTWITTUNWatch");
console.log("[TTWITTUN] HealthKit + standalone GPS + iPhone WatchConnectivity bridge are ready.");
