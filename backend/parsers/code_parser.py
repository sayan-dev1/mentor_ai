from __future__ import annotations

from pathlib import Path
from typing import List


class CodeParser:
    def parse_repository(self, root: str) -> List[str]:
        files = []
        for path in Path(root).rglob("*"):
            if path.is_file() and path.suffix.lower() in {".py", ".js", ".ts", ".jsx", ".tsx", ".md"}:
                try:
                    text = path.read_text(encoding="utf-8")
                except Exception:
                    continue
                files.append(f"FILE: {path}\n\n{text[:2000]}")
        return files
