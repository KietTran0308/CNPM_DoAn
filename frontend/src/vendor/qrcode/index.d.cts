/** QRCode for JavaScript, Kazuhiko Arase; MIT licensed. */
declare class QRCode {
  constructor(typeNumber: number, errorCorrectLevel: number);
  modules: boolean[][];
  addData(data: string): void;
  make(): void;
  getModuleCount(): number;
}
export = QRCode;
