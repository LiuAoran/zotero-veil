// Opening a modal dialog changes window activation synchronously. Never touch
// AppKit glass or trigger a full theme refresh inside that activation callback.
export function deferredWindowRefresh(win,refresh){
  let timer=null,disposed=false;
  const listener=event=>{
    if(disposed||win.closed)return;
    if(event?.target&&event.target!==win&&event.target!==win.document)return;
    if(timer!==null)win.clearTimeout(timer);
    timer=win.setTimeout(()=>{
      timer=null;
      if(!disposed&&!win.closed&&win.document.hasFocus())refresh();
    },80);
  };
  const dispose=()=>{disposed=true;if(timer!==null)win.clearTimeout(timer);timer=null;};
  return {listener,dispose};
}
