import { createWriteStream, readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import yazl from 'yazl';

export function createZip(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const zip = new yazl.ZipFile();

    function addDir(dir: string) {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          addDir(full);
        } else {
          const rel = relative(sourceDir, full);
          zip.addBuffer(readFileSync(full), rel);
        }
      }
    }

    addDir(sourceDir);
    zip.end();

    const out = createWriteStream(outputPath);
    zip.outputStream.pipe(out);
    out.on('close', resolve);
    out.on('error', reject);
  });
}
