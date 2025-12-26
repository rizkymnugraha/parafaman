/// <reference types="vite/client" />

// Type declaration for ?url imports
declare module '*?url' {
  const src: string;
  export default src;
}

// Specific declaration for pdfjs worker
declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url' {
  const workerUrl: string;
  export default workerUrl;
}
