#!/usr/bin/env bash
set -euo pipefail
if [[ "${EUID}" -ne 0 ]]; then
  echo 'Run this setup as an administrator.' >&2
  exit 1
fi
task_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
bundle_dir="${task_root}/.runtime/bin"
mkdir -p -- "${bundle_dir}"
cd -- "${bundle_dir}"
# A new checkout has no ignored local archive. Fetch the complete official release.
if [[ ! -s gvisor.tar.zstd || ! -s gvisor.tar.zstd.sha512 ]]; then
  release="${GVISOR_RELEASE:-20260928.0}"
  [[ "$release" =~ ^[0-9]{8}\.[0-9]+$ ]] || { echo "Invalid gVisor release." >&2; exit 1; }
  architecture="$(uname -m)"
  [[ "$architecture" == x86_64 || "$architecture" == aarch64 ]] || { echo "Unsupported architecture." >&2; exit 1; }
  source_url="https://storage.googleapis.com/gvisor/releases/release/${release}/${architecture}"
  curl --fail --location --proto "=https" --tlsv1.2 "$source_url/gvisor.tar.zstd" -o gvisor.tar.zstd
  curl --fail --location --proto "=https" --tlsv1.2 "$source_url/gvisor.tar.zstd.sha512" -o gvisor.tar.zstd.sha512
fi
sha512sum -c gvisor.tar.zstd.sha512
tar --zstd -xf gvisor.tar.zstd
install -m 0755 runsc /usr/local/bin/runsc
install -m 0755 containerd-shim-runsc-v1 /usr/local/bin/containerd-shim-runsc-v1
install -d -m 0755 /usr/local/bin/gvisor-bin
for auxiliary in gvisor-bin/*; do
  install -m 0755 "${auxiliary}" "/usr/local/bin/${auxiliary}"
done
python3 - <<'PY'
from pathlib import Path
import json
path=Path('/etc/docker/daemon.json')
settings=json.loads(path.read_text()) if path.exists() else {}
runtimes=settings.setdefault('runtimes',{})
runtimes['runsc']={'path':'/usr/local/bin/runsc','runtimeArgs':['--platform=systrap','--network=none']}
path.parent.mkdir(exist_ok=True)
path.write_text(json.dumps(settings,indent=2)+'\n')
PY
systemctl reload docker
/usr/local/bin/runsc --version
docker info --format '{{range $key, $value := .Runtimes}}{{$key}} {{end}}'
