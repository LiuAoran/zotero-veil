import {tokenCSS} from './palette.mjs';
import {glassTokens} from './glass.mjs';

// Reader chrome and PDF margin styles are separate; paper and content are untouched.
export function readerCSS(roles,reducedMotion,{glass=false,level='balanced',transparency}={}) {
  return `
    #reader-ui .toolbar,#reader-ui .sidebar-toolbar,#reader-ui #sidebarContainer,#reader-ui #sidebarContent{${tokenCSS(roles)}${glassTokens(level,transparency)}
      --fill-primary:var(--zmt-on-surface);--fill-secondary:var(--zmt-on-surface-variant);
      --fill-tertiary:var(--zmt-outline);--fill-quarternary:color-mix(in srgb,var(--zmt-on-surface) 12%,transparent);
      --fill-quinary:color-mix(in srgb,var(--zmt-on-surface) 8%,transparent);
      --color-background:var(--zmt-surface-container-lowest);--color-sidepane:var(--zmt-surface-container-lowest);
      background:var(--zmt-surface-container-lowest);color:var(--zmt-on-surface);
      border-color:var(--zmt-outline-variant);
    }
    #reader-ui .toolbar{background:var(--zmt-surface-container)}
    #reader-ui .toolbar .toolbar-button{border-radius:999px;transition:background-color 100ms cubic-bezier(.2,0,0,1)}
    #reader-ui .toolbar .toolbar-button:not([disabled]):hover{background:var(--fill-quinary)}
    #reader-ui .toolbar .toolbar-button:not([disabled]):active{background:var(--fill-quarternary)}
    #reader-ui .toolbar .toolbar-button[disabled]{color:color-mix(in srgb,var(--zmt-on-surface) 38%,transparent)}
    #reader-ui .toolbar .toolbar-button:focus-visible{outline:2px solid var(--zmt-primary);outline-offset:-2px}
    #reader-ui .toolbar .toolbar-text-input{color:var(--zmt-on-surface);background:var(--zmt-surface-container-highest);border-color:var(--zmt-outline);border-radius:4px}
    #reader-ui .toolbar .divider{background:var(--zmt-outline-variant)}
    ${glass?`
      #reader-ui .toolbar{background:transparent}
      #reader-ui .toolbar,#reader-ui .sidebar-toolbar,#reader-ui #sidebarContent{--zmt-on-surface-variant:var(--zmt-on-surface)}
      #reader-ui #sidebarContainer{background:transparent}
      #reader-ui .sidebar-toolbar,#reader-ui #sidebarContent{--color-background:transparent;--color-sidepane:transparent;--material-sidepane:transparent;background:var(--zmt-side-wash)}
      #reader-ui #sidebarContent .annotations{background:transparent}
      #reader-ui .toolbar .toolbar-button:not([disabled]){background:transparent}
      #reader-ui .sidebar-toolbar .toolbar-button:not([disabled]){background:transparent;border-radius:999px}
      #reader-ui .toolbar .toolbar-button:not([disabled]):hover{background:var(--fill-quinary)}
      #reader-ui .toolbar .toolbar-button:not([disabled]):active{background:var(--fill-quarternary)}
      #reader-ui #sidebarContent .outline-row,#reader-ui #sidebarContent .annotation{background:transparent}
    `:''}
    #reader-ui .toolbar .toolbar-button.active,#reader-ui .sidebar-toolbar .toolbar-button.active{background:var(--zmt-secondary-container);color:var(--zmt-on-secondary-container)}
    ${reducedMotion?'#reader-ui .toolbar .toolbar-button{transition:none}':''}
  `;
}

export const PDF_VIEWER_URI='resource://zotero/reader/pdf/web/viewer.html';
// Only verified page-exterior paint layers. No page, canvas, text or annotation rules.
export function pdfMarginCSS(){return 'html,body,#viewerContainer{background:transparent !important;}';}
export function syncPDFMargins(record,glass){
  record.pdfSheets??=new Map();
  const documents=new Set();
  for(const frame of record.doc.querySelectorAll?.('iframe')??[]){
    try{let doc=frame.contentDocument;if(doc?.documentURI!==PDF_VIEWER_URI)continue;
      doc=doc.wrappedJSObject??doc;documents.add(doc);
      if(glass&&!record.pdfSheets.has(doc)&&doc.head){const sheet=doc.createElement('style');sheet.id='zmt-pdf-margin-sheet';sheet.textContent=pdfMarginCSS();doc.head.append(sheet);record.pdfSheets.set(doc,sheet);}
    }catch{/* Unavailable or unrelated frame: never style it. */}
  }
  for(const [doc,sheet] of record.pdfSheets){if(!glass||!documents.has(doc)){sheet.remove();record.pdfSheets.delete(doc);}}
}
export function clearPDFMargins(record){for(const sheet of record.pdfSheets?.values()??[])sheet.remove();record.pdfSheets?.clear();}
