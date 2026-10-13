// Test-only helper. Never shipped in the theme XPI.
var timer;
var base;
var handled = '';
async function startup() {
  await Zotero.initializationPromise;
  const profile = Services.dirsvc.get('ProfD', Ci.nsIFile).path;
  if (!profile.startsWith('/private/tmp/zmt-test-') || !profile.endsWith('/profile')) {
    throw new Error('Test bridge refuses any non-isolated profile');
  }
  base = profile.slice(0, -'/profile'.length);
  if (Zotero.DataDirectory.dir !== base + '/data') throw new Error('Isolated dataDir mismatch');
  const { AddonManager } = ChromeUtils.importESModule('resource://gre/modules/AddonManager.sys.mjs');
  timer = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
  let busy = false;
  timer.initWithCallback(async () => {
    if (busy) return;
    busy = true;
    try {
      const path = base + '/request.json';
      if (!(await IOUtils.exists(path))) return;
      const request = await IOUtils.readJSON(path);
      if (request.id === handled) return;
      handled = request.id;
      let result;
      try {
        const win = Zotero.getMainWindow();
        result = await eval('(async () => {' + request.code + '\n})()');
        result = JSON.parse(JSON.stringify(result === undefined ? null : result));
        await IOUtils.writeJSON(base + '/response.json', { id: handled, ok: true, result });
      }
      catch (error) {
        await IOUtils.writeJSON(base + '/response.json', { id: handled, ok: false, error: String(error), stack: error.stack });
      }
    }
    catch (error) { Zotero.logError(error); }
    finally { busy = false; }
  }, 300, Ci.nsITimer.TYPE_REPEATING_SLACK);
  await IOUtils.writeJSON(base + '/ready.json', { profile, dataDir: Zotero.DataDirectory.dir, version: Zotero.version });
}
function shutdown() { timer?.cancel(); timer = null; }
function install() {}
function uninstall() {}
function onMainWindowLoad() {}
function onMainWindowUnload() {}
