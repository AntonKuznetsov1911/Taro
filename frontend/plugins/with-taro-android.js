const { withAppBuildGradle, withMainApplication, withDangerousMod, withAndroidManifest, withGradleProperties, withAndroidStyles, XML } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withTaroAndroid(config) {
  config = withAndroidStyles(config, async (mod) => {
    for (const style of mod.modResults.resources.style ?? []) {
      if (!style.item?.some(item => item.$?.name === 'android:windowSplashScreenBehavior')) continue;
      const modern = JSON.parse(JSON.stringify(style));
      style.item = style.item.filter(item => item.$?.name !== 'android:windowSplashScreenBehavior');
      const dir = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/values-v33');
      fs.mkdirSync(dir, { recursive: true });
      await XML.writeXMLAsync({ path: path.join(dir, 'styles.xml'), xml: { resources: { $: { 'xmlns:tools': 'http://schemas.android.com/tools' }, style: [modern] } } });
    }
    return mod;
  });
  config = withGradleProperties(config, (mod) => {
    const properties = { reactNativeArchitectures: 'arm64-v8a,armeabi-v7a,x86_64', AsyncStorage_db_size_in_MB: '50' };
    for (const [key, value] of Object.entries(properties)) {
      mod.modResults = mod.modResults.filter(p => p.key !== key);
      mod.modResults.push({ type: 'property', key, value });
    }
    return mod;
  });
  config = withAppBuildGradle(config, (mod) => {
    const source = mod.modResults.contents;
    if (!source.includes('com.google.mediapipe:tasks-vision')) {
      mod.modResults.contents = source.replace('dependencies {', `dependencies {
    implementation 'com.google.mediapipe:tasks-vision:0.10.35'
    implementation 'com.microsoft.onnxruntime:onnxruntime-android:1.24.3'
    androidTestImplementation 'androidx.test:runner:1.6.2'
    androidTestImplementation 'androidx.test.ext:junit:1.2.1'
`);
    }
    if (!mod.modResults.contents.includes('androidTestImplementation')) {
      mod.modResults.contents = mod.modResults.contents.replace('dependencies {', `dependencies {
    androidTestImplementation 'androidx.test:runner:1.6.2'
    androidTestImplementation 'androidx.test.ext:junit:1.2.1'
    androidTestImplementation 'junit:junit:4.13.2'
`);
    }
    if (!mod.modResults.contents.includes('testInstrumentationRunner')) {
      mod.modResults.contents = mod.modResults.contents.replace('defaultConfig {', 'defaultConfig {\n        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"');
      mod.modResults.contents = mod.modResults.contents.replace('android {', 'android {\n    testBuildType "release"');
    }
    // A release is always signed with the persistent application key. Without
    // local signing.properties Gradle deliberately cannot produce a release.
    if (!mod.modResults.contents.includes('taroSigningProperties')) {
      mod.modResults.contents = `def taroSigningProperties = new Properties()
def taroSigningFile = rootProject.file("../signing.properties")
if (taroSigningFile.exists()) {
    taroSigningFile.withInputStream { taroSigningProperties.load(it) }
}
` + mod.modResults.contents;
      mod.modResults.contents = mod.modResults.contents.replace('signingConfigs {', `signingConfigs {
        release {
            if (taroSigningFile.exists()) {
                storeFile file(taroSigningProperties['storeFile'])
                storePassword taroSigningProperties['storePassword']
                keyAlias taroSigningProperties['keyAlias']
                keyPassword taroSigningProperties['keyPassword']
            }
        }
`);
      mod.modResults.contents = mod.modResults.contents.replace(/(buildTypes\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?signingConfig signingConfigs\.)debug/, '$1release');
    }
    return mod;
  });
  config = withMainApplication(config, (mod) => {
    if (!mod.modResults.contents.includes('TaroVisionPackage')) {
      mod.modResults.contents = mod.modResults.contents.replace(/(PackageList\(this\)\.packages\.apply\s*\{)/, '$1\n              add(com.antonkuznetsov.taro.vision.TaroVisionPackage())');
    }
    return mod;
  });
  config = withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application[0].$;
    app['android:allowBackup'] = 'false';
    const features = mod.modResults.manifest['uses-feature'] ?? [];
    for (const name of ['android.hardware.camera', 'android.hardware.camera.autofocus']) {
      const existing = features.find(feature => feature.$?.['android:name'] === name);
      if (existing) existing.$['android:required'] = 'false';
      else features.push({ $: { 'android:name': name, 'android:required': 'false' } });
    }
    mod.modResults.manifest['uses-feature'] = features;
    return mod;
  });
  return withDangerousMod(config, ['android', async (mod) => {
    const root = mod.modRequest.projectRoot;
    const native = path.join(root, 'android/app/src/main');
    const dest = path.join(native, 'java/com/antonkuznetsov/taro/vision');
    fs.mkdirSync(dest, { recursive: true });
    for (const file of ['TaroVisionModule.kt', 'TaroVisionPackage.kt']) {
      fs.copyFileSync(path.join(root, 'native/android', file), path.join(dest, file));
    }
    const assets = path.join(native, 'assets');
    fs.mkdirSync(assets, { recursive: true });
    for (const [src, name] of [
      ['public/mediapipe/hand_landmarker.task', 'hand_landmarker.task'],
      ['public/models/palm_lines.onnx', 'palm_lines.onnx'],
      ['public/models/LICENSE-palm-lines.txt', 'LICENSE-palm-lines.txt'],
      ['public/models/NOTICE-palm-lines.txt', 'NOTICE-palm-lines.txt'],
    ]) fs.copyFileSync(path.join(root, src), path.join(assets, name));
    const tests = path.join(root, 'android/app/src/androidTest');
    const java = path.join(tests, 'java/com/antonkuznetsov/taro/vision');
    fs.mkdirSync(java, { recursive: true });
    fs.copyFileSync(path.join(root, 'native/androidTest/TaroVisionTest.kt'), path.join(java, 'TaroVisionTest.kt'));
    const photo = path.join(root, 'native/androidTest/assets/hand.jpg');
    if (fs.existsSync(photo)) {
      fs.mkdirSync(path.join(tests, 'assets'), { recursive: true });
      fs.copyFileSync(photo, path.join(tests, 'assets/hand.jpg'));
    }
    return mod;
  }]);
};
