"""Create a temporary modal-dialog diagnostic XPI without altering release output."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
root = Path(__file__).resolve().parents[1]
version = json.loads((root/'addon/manifest.json').read_text())['version']
helper = (root/'tests/diagnostics/modal-bootstrap.js').read_text()
target_path = root/f'dist/zotero-veil-{version}-diagnostic.xpi'
with ZipFile(root/f'dist/zotero-veil-{version}.xpi') as source, ZipFile(target_path, 'w', ZIP_DEFLATED) as target:
    for name in source.namelist():
        data = source.read(name)
        if name == 'manifest.json':
            manifest = json.loads(data)
            manifest['name'] = 'Zotero Veil (Diagnostic)'
            data = json.dumps(manifest, ensure_ascii=False, indent=2).encode()
        if name == 'bootstrap.js':
            script = helper + '\n' + data.decode()
            script = script.replace('try {await controller.start();}', 'try {await controller.start();veilTrace("diagnostic.start");Services.ww.registerNotification(veilDiagnosticWatcher);for(const win of Zotero.getMainWindows())veilTraceWindow(win);}')
            script = script.replace('function shutdown() {', 'function shutdown() {\n  try{Services.ww.unregisterNotification(veilDiagnosticWatcher);}catch{}\n  for(const cleanup of veilDiagnosticCleanups.splice(0))try{cleanup();}catch{}\n  veilDiagnosticWindows.clear();')
            script = script.replace('controller?.attachWindow(window);', 'controller?.attachWindow(window);veilTraceWindow(window);')
            data = script.encode()
        target.writestr(name, data)
print(target_path)
