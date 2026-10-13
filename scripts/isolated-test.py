"""Create a new, isolated Zotero profile, or send a local test request."""
import argparse, json, os, pathlib, time, uuid, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('action', choices=['prepare', 'call', 'reset'])
parser.add_argument('--base')
parser.add_argument('--code')
parser.add_argument('--file')
parser.add_argument('--timeout', type=int, default=30)
args = parser.parse_args()
if args.action == 'prepare':
    base = pathlib.Path('/private/tmp/zmt-test-' + uuid.uuid4().hex[:10])
    profile = base / 'profile'
    (profile / 'extensions').mkdir(parents=True)
    (base / 'data').mkdir()
    settings = {
        'extensions.zotero.dataDir': str(base / 'data'),
        'extensions.zotero.useDataDir': True,
        'extensions.autoDisableScopes': 0,
        'extensions.startupScanScopes': 15,
        'extensions.enabledScopes': 15,
        'extensions.update.enabled': False,
        'app.update.auto': False,
        'extensions.zotero.sync.autoSync': False,
        'extensions.zotero.firstRunGuidance': False,
        'extensions.zotero.sync.server.enabled': False,
        'intl.locale.requested': 'zh-CN',
        'browser.shell.checkDefaultBrowser': False,
    }
    (profile / 'user.js').write_text('\n'.join(f'user_pref({json.dumps(k)}, {json.dumps(v)});' for k, v in settings.items()))
    with zipfile.ZipFile(profile / 'extensions/zmt-isolated-test@example.invalid.xpi', 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in (ROOT / 'tests/bridge').iterdir(): archive.write(path, path.name)
    (ROOT / 'tests/.isolated-base').write_text(str(base))
    print(base)
else:
    base = pathlib.Path(args.base or (ROOT / 'tests/.isolated-base').read_text()).resolve()
    if not str(base).startswith('/private/tmp/zmt-test-'): raise SystemExit('Isolation guard failed')
    if args.action == 'reset':
        # Use only while the isolated process is stopped. Avoid replaying an old
        # request (especially quit) when the test-only bridge starts again.
        for name in ['request.json', 'request.pending', 'response.json', 'ready.json']:
            (base / name).unlink(missing_ok=True)
        print('Cleared isolated test requests:', base)
        raise SystemExit(0)
    code = pathlib.Path(args.file).read_text() if args.file else args.code
    request = {'id': uuid.uuid4().hex, 'code': 'const project = ' + json.dumps(str(ROOT)) + ';\n' + code}
    pending = base / 'request.pending'
    pending.write_text(json.dumps(request)); os.replace(pending, base / 'request.json')
    deadline = time.monotonic() + args.timeout
    while time.monotonic() < deadline:
        try:
            response = json.loads((base / 'response.json').read_text())
            if response['id'] == request['id']:
                print(json.dumps(response, ensure_ascii=False, indent=2))
                raise SystemExit(0 if response['ok'] else 1)
        except (FileNotFoundError, json.JSONDecodeError): pass
        time.sleep(.2)
    raise SystemExit('Timed out waiting for isolated Zotero test bridge')
