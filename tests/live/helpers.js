win.ZMTTest={
  directory:project+'/docs/validation',
  async snapshot(name,target=win){
    if(!/^[a-z0-9-]+$/.test(name))throw new Error('Invalid screenshot name');
    await IOUtils.makeDirectory(this.directory,{ignoreExisting:true});
    target.document.documentElement.getBoundingClientRect();
    await Zotero.Promise.delay(450);
    const canvas=target.document.createElementNS('http://www.w3.org/1999/xhtml','canvas');
    canvas.width=target.innerWidth*2;canvas.height=target.innerHeight*2;
    const context=canvas.getContext('2d');context.scale(2,2);
    context.drawWindow(target,0,0,target.innerWidth,target.innerHeight,'rgb(255,255,255)');
    await IOUtils.write(this.directory+'/'+name+'.png',Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]),c=>c.charCodeAt(0)));
    return this.directory+'/'+name+'.png';
  },
  check(name,condition,details){if(!condition)throw new Error(name+': '+JSON.stringify(details));return{name,passed:true,details};},
  async record(name,data){await IOUtils.makeDirectory(this.directory,{ignoreExisting:true});await IOUtils.writeJSON(this.directory+'/'+name+'.json',data);return data;}
};
if(await IOUtils.exists(base+'/fixtures.json'))win.ZMTTest.fixtures=await IOUtils.readJSON(base+'/fixtures.json');
return {ready:true};
