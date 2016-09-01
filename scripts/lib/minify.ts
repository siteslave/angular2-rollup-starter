import * as path from 'path';
import * as fs from 'fs-extra';
import * as uglifyjs from 'uglify-js';
import { Observable } from 'rxjs';

export function all(): Observable<any[]> {
  return Observable.merge(main(), vendor());
}

export function main(): Observable<any> {
  return minify('main.js', 'main.min.js', 'main.min.js.map');
}

export function vendor(): Observable<any> {
  return minify('vendor.js', 'vendor.min.js', 'vendor.min.js.map');
}

function minify(srcFile: string, destFile: string, sourceMapFile: string): Observable<any> {
  const srcPath: string = path.resolve(__dirname, `../../dist/${srcFile}`);
  const srcSourceMapPath: string = path.resolve(__dirname, `../../dist/${srcFile}.map`);
  const destPath: string = path.resolve(__dirname, `../../dist/${destFile}`);
  const sourceMapDest: string = path.resolve(__dirname, `../../dist/${sourceMapFile}`);

  return new Observable(observer => {
    if (!fs.existsSync(srcPath)) {
      observer.error(`${srcPath} does not exists.`);
      observer.complete();
    } else {
      const srcStats: any = fs.statSync(srcPath);
      const result: any = uglifyjs.minify(srcPath, {
        outSourceMap: sourceMapDest
      });

      fs.outputFile(destPath, result.code, err => {
        if (err) {
          observer.error(err);
        }
        fs.outputFile(sourceMapDest, result.map, sourceMapErr => {
          if (sourceMapErr) {
            observer.error(err);
          }

          fs.unlinkSync(srcPath);
          fs.unlinkSync(srcSourceMapPath);

          const destStats: any = fs.statSync(destPath);
          const sourceMapStats: any = fs.statSync(sourceMapDest);
          const sizes: any = {
            'src': formatBytes(srcStats.size, 2),
            'dest': formatBytes(destStats.size, 2),
            'map': formatBytes(sourceMapStats.size, 2)
          };

          let output = '-------------------------------------------------------\n';
          output += `${srcFile} (${sizes['src']})\n${destFile} (${sizes['dest']})\n`;
          output += `${sourceMapFile} (${sizes['map']})`;

          observer.next(output);
          observer.complete();
        });
      });
    }
  });
}

function formatBytes(bytes: number, decimals: number): string {
   if (bytes === 0) { return '0 Byte'; }
   const k = 1000;
   const dm: number = decimals + 1 || 3;
   const sizes: string[] = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
   const i: number = Math.floor(Math.log(bytes) / Math.log(k));

   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
