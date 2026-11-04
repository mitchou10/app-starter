/** A fake screenshot as an inline SVG, so the mockups show images without any file. */
export function placeholderScreenshot(label: string, hue: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
<rect width="640" height="400" fill="hsl(${hue} 30% 94%)"/>
<rect x="24" y="24" width="592" height="36" rx="6" fill="hsl(${hue} 30% 82%)"/>
<rect x="24" y="80" width="170" height="296" rx="6" fill="hsl(${hue} 30% 88%)"/>
<rect x="210" y="80" width="406" height="120" rx="6" fill="hsl(${hue} 45% 78%)"/>
<rect x="210" y="216" width="406" height="160" rx="6" fill="hsl(${hue} 30% 88%)"/>
<text x="320" y="390" font-family="sans-serif" font-size="14" fill="hsl(${hue} 20% 40%)" text-anchor="middle">${label}</text>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
