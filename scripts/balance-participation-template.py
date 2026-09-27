"""Remove unintended blank paragraphs immediately above a certificate heading."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from docx import Document
from docx.shared import Pt


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--backup", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    output = args.output or args.source
    if args.source.resolve() != args.backup.resolve():
        shutil.copy2(args.source, args.backup)
    document = Document(args.source)
    heading_index = next(
        (index for index, paragraph in enumerate(document.paragraphs)
         if paragraph.text.strip() == "PESHAWAR PENTESTERS"),
        None,
    )
    if heading_index is None:
        raise ValueError("Could not find the Peshawar Pentesters heading.")

    spacer = None
    for paragraph in reversed(document.paragraphs[:heading_index]):
        if paragraph.text.strip():
            break
        # Empty paragraphs can contain anchored artwork (the certificate
        # border/corners); those are layout objects, not whitespace.
        if paragraph._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing'):
            continue
        spacer = paragraph
        break
    if spacer is None:
        raise ValueError("No excess blank paragraphs found above the heading.")

    # Preserve the paragraph itself: deleting it makes LibreOffice pull the
    # inline logo into the page border. Removing only its 7pt after-spacing
    # improves the vertical balance without disturbing any artwork.
    spacer.paragraph_format.space_before = Pt(0)
    spacer.paragraph_format.space_after = Pt(0)
    document.save(output)
    print("Removed the excess after-spacing from the top spacer paragraph.")
    print(f"Backup saved to {args.backup}; corrected file saved to {output}")


if __name__ == "__main__":
    main()
