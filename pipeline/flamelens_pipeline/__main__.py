"""Run the whole pipeline: ``python -m flamelens_pipeline [--refresh]``.

    fetch    download raw snapshots from NASA PSI (skipped for files already on disk)
    stage    parse them into tidy files
    curate   harmonize, verify quotes, write the curated layer
"""

from __future__ import annotations

import argparse

from . import curate, fetch, stage


def main() -> None:
    parser = argparse.ArgumentParser(description="FlameLens SI data pipeline")
    parser.add_argument("--refresh", action="store_true", help="re-download everything from PSI")
    parser.add_argument("--offline", action="store_true", help="skip the download step")
    args = parser.parse_args()
    if not args.offline:
        fetch.run(refresh=args.refresh)
    stage.run()
    curate.run()


if __name__ == "__main__":
    main()
