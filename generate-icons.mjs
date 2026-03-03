// 生成 PWA 图标（简单的蓝色 CRM 图标）
const { createCanvas } = await import('canvas').catch(() => null) || {};

// 如果没有 canvas 模块，用纯 JS 生成 BMP/PNG
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, 'public', 'icons');

// 生成简单的 PNG 文件（手动构建 PNG 格式）
function createPNG(size) {
  // 使用 PPM 格式转 PNG 太复杂，改用 SVG
  return null;
}

// 生成 SVG 图标
function createSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#bg)"/>
  <text x="50%" y="52%" dominant-baseline="central" text-anchor="middle"
    font-family="Arial,sans-serif" font-weight="bold" font-size="${size * 0.3}" fill="white">CRM</text>
  <text x="50%" y="76%" dominant-baseline="central" text-anchor="middle"
    font-family="Arial,sans-serif" font-size="${size * 0.11}" fill="rgba(255,255,255,0.85)">客户管理</text>
</svg>`;
}

// 写入各尺寸 SVG 图标
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), createSVG(size));
});

// 生成一个通用 favicon
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), createSVG(32));

console.log('Icons generated:', sizes.map(s => `icon-${s}x${s}.svg`).join(', '));
