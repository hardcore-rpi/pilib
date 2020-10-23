export interface IFS {
  readFileSync(path: string, options?: { encoding?: any }): any;
  writeFileSync(path: string, data: any, options?: { encoding?: any }): void;
  existsSync(path: string): boolean;
  mkdirSync(path: string): void;
}
