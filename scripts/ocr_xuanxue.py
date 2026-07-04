#!/usr/bin/env python3
import concurrent.futures
import os
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "梁湘润-子平基础概要.pdf"
OUTPUT = ROOT / "knowledge-base" / "raw_clean" / "xuanxue_ocr.clean.txt"
PAGES_DIR = ROOT / ".cache" / "xuanxue_pages_140"
OCR_DIR = ROOT / ".cache" / "xuanxue_ocr_pages"


def page_number(path):
    match = re.search(r"-(\d+)\.png$", path.name)
    return int(match.group(1)) if match else 0


def render_pages():
    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    existing = sorted(PAGES_DIR.glob("page-*.png"))
    if len(existing) >= 210:
        return existing
    for stale in existing:
        stale.unlink()
    subprocess.run(
        ["pdftoppm", "-r", "140", "-png", str(PDF), str(PAGES_DIR / "page")],
        check=True,
    )
    return sorted(PAGES_DIR.glob("page-*.png"), key=page_number)


def ocr_one(image_path):
    OCR_DIR.mkdir(parents=True, exist_ok=True)
    page_no = page_number(image_path)
    out_path = OCR_DIR / f"page-{page_no:03d}.txt"
    if out_path.exists() and out_path.stat().st_size > 0:
        return out_path

    result = subprocess.run(
        [
            "tesseract",
            str(image_path),
            "stdout",
            "-l",
            "chi_tra_vert+chi_tra+chi_sim_vert+chi_sim+eng",
            "--psm",
            "5",
        ],
        capture_output=True,
        text=True,
    )
    text = result.stdout
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    out_path.write_text(text, encoding="utf-8")
    return out_path


def combine(txt_paths):
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    parts = []
    for path in sorted(txt_paths, key=lambda p: int(re.search(r"(\d+)", p.stem).group(1))):
        page_no = int(re.search(r"(\d+)", path.stem).group(1))
        text = path.read_text(encoding="utf-8").strip()
        if text:
            parts.append(f"--- page {page_no} ---\n{text}")
    OUTPUT.write_text("\n\n".join(parts), encoding="utf-8")
    return OUTPUT


def main():
    pages = render_pages()
    workers = min(8, max(2, os.cpu_count() or 4))
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        txt_paths = list(pool.map(ocr_one, pages))
    output = combine(txt_paths)
    print(f"pages={len(pages)}")
    print(f"ocr_pages={len(txt_paths)}")
    print(f"output={output}")


if __name__ == "__main__":
    main()
