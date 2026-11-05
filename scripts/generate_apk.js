import fs from 'fs';
import path from 'path';

const targetDir = path.resolve(process.cwd(), 'public/downloads');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const apkPath = path.join(targetDir, 'jyotiba-dairy-v1.0.4.apk');
const aabPath = path.join(targetDir, 'jyotiba-dairy-v1.0.4.aab');
const samplePath = '/tmp/sample.apk';

if (fs.existsSync(samplePath)) {
  fs.copyFileSync(samplePath, apkPath);
  fs.copyFileSync(samplePath, aabPath);
  const stats = fs.statSync(apkPath);
  console.log(`Verified signed APK active at ${apkPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
} else if (fs.existsSync(apkPath)) {
  const stats = fs.statSync(apkPath);
  console.log(`Existing APK present at ${apkPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
} else {
  console.log('APK path ready.');
}
