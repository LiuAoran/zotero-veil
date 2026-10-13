"""Package reproducible source; never include a live profile, node_modules or app research copies."""
import pathlib, zipfile, json
root=pathlib.Path(__file__).resolve().parents[1]
version=json.loads((root/'addon/manifest.json').read_text())['version']
target=root/f'dist/zotero-veil-{version}-source.zip'
paths=[root/name for name in ['addon','src','scripts','tests','docs','licenses','README.md','LICENSE','package.json','package-lock.json','.gitignore']]
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
    for item in paths:
        files=item.rglob('*') if item.is_dir() else [item]
        for file in sorted(files):
            if file.is_file() and file.name!='.isolated-base' and '__pycache__' not in file.parts:
                archive.write(file,file.relative_to(root))
print(target)
