/**
 * Distinguishes edits within a document from opening/replacing an entire document.
 * Async image/font/file decoding can safely finish after normal edits, but must
 * never commit into a NEW project selected while the old file was loading.
 * This guard owns no media and performs no network/IndexedDB operations.
 */
export class DocumentSession {
 private epoch=0;
 capture():number{return this.epoch;}
 isCurrent(captured:number):boolean{return Number.isSafeInteger(captured)&&captured===this.epoch;}
 replace():number{this.epoch++;return this.epoch;}
}
