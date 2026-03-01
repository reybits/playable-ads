import { readFileSync, writeFileSync } from 'fs';

export function inlineHtml(
  templatePath: string,
  jsPath: string,
  outputPath: string,
): void {
  const template = readFileSync(templatePath, 'utf-8');
  const js = readFileSync(jsPath, 'utf-8');

  const html = template.replace('__INLINE_JS__', () => js);
  writeFileSync(outputPath, html, 'utf-8');
}
