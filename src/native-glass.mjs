import {nativeMaterialAlpha,nativeMaterialForMode} from './glass.mjs';
/* Objective-C ctypes declarations and behind-window insertion adapted from
 * Zotero-glass, Copyright (c) 2026 Avi7ii, MIT. Full license is distributed in
 * licenses/Zotero-glass-MIT.txt. Window ownership/rollback are implemented here.
 * No global window scan, theme preference writes, helper or private blur API. */
export class NativeGlass {
  constructor({services,chromeUtils,ci,logError=()=>{}}={}){
    this.services=services;this.chromeUtils=chromeUtils;this.ci=ci;this.logError=logError;
    this.records=new Map();this.lastError='';this.failed=false;
  }
  init(){
    if(this.f)return true;if(this.failed)return false;
    try{
      if(this.services?.appinfo.OS!=='Darwin'||!this.services.appinfo.XPCOMABI.startsWith('aarch64'))throw new Error('当前仅验证Apple Silicon macOS');
      const c=this.chromeUtils.importESModule('resource://gre/modules/ctypes.sys.mjs').ctypes;this.c=c;
      this.objc=c.open('/usr/lib/libobjc.A.dylib');
      this.appKit=c.open('/System/Library/Frameworks/AppKit.framework/AppKit');
      const ID=c.voidptr_t,SEL=ID,BOOL=c.signed_char;
      const Point=c.StructType('ZMTPoint',[{x:c.double},{y:c.double}]);
      const Size=c.StructType('ZMTSize',[{width:c.double},{height:c.double}]);
      this.Rect=c.StructType('ZMTRect',[{origin:Point},{size:Size}]);this.Point=Point;this.Size=Size;
      const declare=(result,...args)=>this.objc.declare('objc_msgSend',c.default_abi,result,ID,SEL,...args);
      this.f={cls:this.objc.declare('objc_getClass',c.default_abi,ID,c.char.ptr),sel:this.objc.declare('sel_registerName',c.default_abi,SEL,c.char.ptr),
        id:declare(ID),idString:declare(ID,c.char.ptr),idID:declare(ID,ID),idRect:declare(ID,this.Rect),
        bool:declare(BOOL),boolID:declare(BOOL,ID),long:declare(c.long),double:declare(c.double),rect:declare(this.Rect),
        void:declare(c.void_t),setBool:declare(c.void_t,BOOL),setID:declare(c.void_t,ID),setLong:declare(c.void_t,c.long),setDouble:declare(c.void_t,c.double),
        insert:declare(c.void_t,ID,c.long,ID)};
      this.selectors=new Map();this.classes=new Map();
      if(this.cls('NSVisualEffectView').isNull())throw new Error('NSVisualEffectView不可用');
      return true;
    }catch(error){this.lastError=String(error);this.failed=true;this.logError(error);this.closeLibraries();return false;}
  }
  sel(name){if(!this.selectors.has(name))this.selectors.set(name,this.f.sel(name));return this.selectors.get(name);}
  cls(name){if(!this.classes.has(name))this.classes.set(name,this.f.cls(name));return this.classes.get(name);}
  id(object,name){return this.f.id(object,this.sel(name));}
  setID(object,name,value){this.f.setID(object,this.sel(name),value);}
  setLong(object,name,value){this.f.setLong(object,this.sel(name),value);}
  string(value){return this.f.idString(this.cls('NSString'),this.sel('stringWithUTF8String:'),value);}
  accessibility(){
    if(!this.init())return {available:false};
    const workspace=this.id(this.cls('NSWorkspace'),'sharedWorkspace');
    return {available:true,reducedTransparency:!!this.f.bool(workspace,this.sel('accessibilityDisplayShouldReduceTransparency')),increasedContrast:!!this.f.bool(workspace,this.sel('accessibilityDisplayShouldIncreaseContrast'))};
  }
  locate(win){
    const handle=win.docShell.treeOwner.QueryInterface(this.ci.nsIInterfaceRequestor).getInterface(this.ci.nsIBaseWindow).nativeHandle;
    if(!/^0x[0-9a-f]+$/i.test(handle))throw new Error('窗口原生句柄不可用');
    const window=this.c.voidptr_t(this.c.UInt64(handle));
    if(!this.f.boolID(window,this.sel('isKindOfClass:'),this.cls('NSWindow')))throw new Error('原生句柄不是NSWindow');
    return window;
  }
  apply(win,mode,transparency=60){
    if(!this.init())return false;
    try{
      let record=this.records.get(win);
      if(!record){
        const window=this.locate(win),content=this.id(window,'contentView');
        if(content.isNull())throw new Error('窗口内容视图不可用');
        // Strong references keep rollback safe even during DOM unload.
        this.id(window,'retain');
        record={window,opaque:!!this.f.bool(window,this.sel('isOpaque')),background:this.id(window,'backgroundColor'),effect:null};
        this.id(record.background,'retain');this.records.set(win,record);
        const bounds=this.f.rect(content,this.sel('bounds'));
        const effect=this.f.idRect(this.id(this.cls('NSVisualEffectView'),'alloc'),this.sel('initWithFrame:'),bounds);
        if(effect.isNull())throw new Error('材质视图创建失败');record.effect=effect;
        this.setID(effect,'setIdentifier:',this.string('ZMTMaterialEffect'));
        this.setLong(effect,'setAutoresizingMask:',18);
        this.setLong(effect,'setMaterial:',7); // NSVisualEffectMaterialSidebar
        this.setLong(effect,'setBlendingMode:',0); // BehindWindow
        this.setLong(effect,'setState:',1); // Active: keep material visible behind preferences too
        this.f.insert(content,this.sel('addSubview:positioned:relativeTo:'),effect,-1,this.c.voidptr_t(0));
        this.f.setBool(window,this.sel('setOpaque:'),0);
        this.setID(window,'setBackgroundColor:',this.id(this.cls('NSColor'),'clearColor'));
      }
      const appearance=this.f.idID(this.cls('NSAppearance'),this.sel('appearanceNamed:'),this.string(mode==='dark'?'NSAppearanceNameDarkAqua':'NSAppearanceNameAqua'));
      if(appearance.isNull())throw new Error('系统材质外观不可用');
      this.setID(record.effect,'setAppearance:',appearance);
      this.setLong(record.effect,'setMaterial:',nativeMaterialForMode(mode));
      this.f.setDouble(record.effect,this.sel('setAlphaValue:'),nativeMaterialAlpha(transparency));
      // Gecko may recompute opacity after a chrome stylesheet/theme change.
      this.f.setBool(record.window,this.sel('setOpaque:'),0);
      this.setID(record.window,'setBackgroundColor:',this.id(this.cls('NSColor'),'clearColor'));
      return true;
    }catch(error){this.lastError=String(error);this.logError(error);this.detach(win);return false;}
  }
  detach(win){
    const record=this.records.get(win);if(!record)return;this.records.delete(win);
    const tasks=[()=>{if(record.effect)this.f.void(record.effect,this.sel('removeFromSuperview'));},()=>{if(record.effect)this.id(record.effect,'release');},
      ()=>this.f.setBool(record.window,this.sel('setOpaque:'),record.opaque?1:0),()=>this.setID(record.window,'setBackgroundColor:',record.background),
      ()=>this.id(record.background,'release'),()=>this.id(record.window,'release')];
    for(const task of tasks)try{task();}catch(error){this.logError(error);}
  }
  closeLibraries(){for(const key of ['appKit','objc']){try{this[key]?.close();}catch{}this[key]=null;}this.f=null;}
  stop(){for(const win of [...this.records.keys()])this.detach(win);this.closeLibraries();}
}
