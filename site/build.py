#!/usr/bin/env python3
"""Gera site/index.html, um único arquivo HTML autocontido.

Junta os trechos de src/ em ordem, embute as fontes de assets/fonts/ como
data URIs e coloca o JavaScript num <script> no final do <body>.

Uso:  python3 site/build.py
"""
import base64
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
FONTS = ROOT / "assets" / "fonts"
OUT = ROOT / "index.html"

# Marcador no CSS -> arquivo de fonte
FONT_MAP = {
    "__F72R__": "72-Regular.woff2",
    "__F72S__": "72-Semibold.woff2",
    "__F72B__": "72-Bold.woff2",
    "__F72MR__": "72Mono-Regular.woff2",
    "__F72MB__": "72Mono-Bold.woff2",
    "__ICONS__": "SAP-icons-subset.woff2",
}
HTML_PARTS = ["02_shell.html", "03_c1.html", "04_c2.html", "05_c3.html"]
JS_PARTS = ["06_data.js", "07_app.js", "08_widgets.js"]


def main() -> None:
    head = (SRC / "01_head.html").read_text(encoding="utf-8")
    for marker, name in FONT_MAP.items():
        data = base64.b64encode((FONTS / name).read_bytes()).decode("ascii")
        head = head.replace(marker, data)

    body = "".join((SRC / f).read_text(encoding="utf-8") for f in HTML_PARTS)
    js = "".join((SRC / f).read_text(encoding="utf-8") for f in JS_PARTS)
    if "</script" in js:
        raise SystemExit("O JavaScript contém '</script', o que quebraria o HTML.")

    html = (
        "<!doctype html>\n"
        '<html lang="pt-BR">\n<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        f"{head}\n</head>\n<body>\n{body}\n<script>\n{js}\n</script>\n</body>\n</html>\n"
    )
    OUT.write_text(html, encoding="utf-8")
    print(f"{OUT.relative_to(ROOT.parent)} gerado ({len(html) / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
