#!/usr/bin/env python3
"""Generate the operator tangram hint reference PDF from study.json."""

from __future__ import annotations

import json
import math
import shutil
import subprocess
from datetime import date
from html import escape
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "study.json"
PUZZLE_DIR = ROOT / "tangram puzzles"
TEMP_DIR = ROOT / "tmp" / "pdfs" / "hint-reference"
OUTPUT_PATH = ROOT / "output" / "pdf" / "tangram-hint-reference.pdf"

INK = colors.HexColor("#1F2937")
MUTED = colors.HexColor("#667085")
ACCENT = colors.HexColor("#2F6F9F")
ACCENT_LIGHT = colors.HexColor("#EAF2F8")
PAPER = colors.HexColor("#F7F4ED")
RULE = colors.HexColor("#D6D3CB")


def ascii_text(value: str) -> str:
    return (
        str(value)
        .replace("\u2014", " - ")
        .replace("\u2013", "-")
        .replace("\u2011", "-")
        .replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
    )


def render_source_pdfs() -> dict[str, tuple[Path, Path]]:
    pdftoppm = shutil.which("pdftoppm")
    if not pdftoppm:
        raise RuntimeError("pdftoppm is required to render the puzzle PDFs")

    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    rendered: dict[str, tuple[Path, Path]] = {}
    for puzzle_id in map(str, range(1, 10)):
        prompt_prefix = TEMP_DIR / f"puzzle-{puzzle_id}"
        solution_prefix = TEMP_DIR / f"solution-{puzzle_id}"
        subprocess.run(
            [
                pdftoppm,
                "-f",
                "1",
                "-singlefile",
                "-png",
                "-r",
                "130",
                str(PUZZLE_DIR / f"{puzzle_id}.pdf"),
                str(prompt_prefix),
            ],
            check=True,
        )
        subprocess.run(
            [
                pdftoppm,
                "-f",
                "1",
                "-singlefile",
                "-png",
                "-r",
                "130",
                str(PUZZLE_DIR / f"{puzzle_id}s.pdf"),
                str(solution_prefix),
            ],
            check=True,
        )

        prompt_path = prompt_prefix.with_suffix(".png")
        full_solution_path = solution_prefix.with_suffix(".png")
        cropped_solution_path = TEMP_DIR / f"solution-{puzzle_id}-crop.png"
        with PILImage.open(full_solution_path) as solution:
            width, height = solution.size
            crop_box = (
                round(width * 0.0665),
                round(height * 0.598),
                round(width * 0.55),
                round(height * 0.927),
            )
            solution.crop(crop_box).save(cropped_solution_path)
        rendered[puzzle_id] = (prompt_path, cropped_solution_path)

    return rendered


def fitted_image(path: Path, max_width: float, max_height: float) -> Image:
    with PILImage.open(path) as source:
        width, height = source.size
    scale = min(max_width / width, max_height / height)
    return Image(str(path), width=width * scale, height=height * scale)


def page_decor(canvas, doc) -> None:
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(ACCENT)
    canvas.rect(0, height - 7 * mm, width, 7 * mm, stroke=0, fill=1)
    canvas.setStrokeColor(RULE)
    canvas.line(18 * mm, 13 * mm, width - 18 * mm, 13 * mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 8 * mm, "Tangram Hint Reference")
    canvas.drawRightString(width - 18 * mm, 8 * mm, f"Page {doc.page}")
    canvas.restoreState()


def hint_columns(hints: list[str], hint_style: ParagraphStyle) -> Table:
    split_at = math.ceil(len(hints) / 2)
    columns = []
    for start, subset in ((0, hints[:split_at]), (split_at, hints[split_at:])):
        column = []
        for offset, hint in enumerate(subset, start=start + 1):
            text = escape(ascii_text(hint))
            column.append(Paragraph(f"<b>{offset}.</b> {text}", hint_style))
        columns.append(column)

    table = Table([columns], colWidths=[84 * mm, 84 * mm], hAlign="CENTER")
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (0, 0), 0),
                ("RIGHTPADDING", (0, 0), (0, 0), 5 * mm),
                ("LEFTPADDING", (1, 0), (1, 0), 5 * mm),
                ("RIGHTPADDING", (1, 0), (1, 0), 0),
                ("LINEBEFORE", (1, 0), (1, 0), 0.5, RULE),
            ]
        )
    )
    return table


def build_pdf() -> Path:
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    rendered = render_source_pdfs()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=27,
        leading=31,
        textColor=INK,
        alignment=TA_CENTER,
        spaceAfter=5 * mm,
    )
    subtitle = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=MUTED,
        alignment=TA_CENTER,
        spaceAfter=10 * mm,
    )
    h1 = ParagraphStyle(
        "PuzzleHeading",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=25,
        textColor=INK,
        spaceAfter=2 * mm,
    )
    h2 = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=ACCENT,
        spaceBefore=3 * mm,
        spaceAfter=2 * mm,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=INK,
        spaceAfter=2 * mm,
    )
    hint = ParagraphStyle(
        "Hint",
        parent=body,
        fontSize=8.5,
        leading=11.2,
        spaceAfter=2.2 * mm,
    )
    compact_hint = ParagraphStyle(
        "CompactHint",
        parent=hint,
        fontSize=8.1,
        leading=10.1,
        spaceAfter=1.5 * mm,
    )
    caption = ParagraphStyle(
        "Caption",
        parent=body,
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=MUTED,
        alignment=TA_CENTER,
        spaceAfter=0,
    )
    note = ParagraphStyle(
        "Note",
        parent=body,
        fontSize=9,
        leading=13,
        leftIndent=4 * mm,
        rightIndent=4 * mm,
        spaceAfter=0,
    )

    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=17 * mm,
        bottomMargin=18 * mm,
        title="Tangram Hint Reference",
        author="Wizard of Oz Tangram Study",
        subject="Puzzle-specific operator hint presets",
    )

    story = [
        Spacer(1, 23 * mm),
        Paragraph("Tangram Hint Reference", title),
        Paragraph("Puzzles 1-9 | Operator reference document", subtitle),
    ]

    intro_box = Table(
        [[Paragraph(
            "Each puzzle page shows the participant silhouette and the color solution before the complete preset hint list. Hints move from broad structural guidance toward more specific placement and adjacency information.",
            note,
        )]],
        colWidths=[166 * mm],
    )
    intro_box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), ACCENT_LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.6, ACCENT),
                ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
            ]
        )
    )
    story.extend([intro_box, Spacer(1, 8 * mm), Paragraph("Piece legend", h2)])

    piece_rows = []
    pieces = config.get("pieces", [])
    for index in range(0, len(pieces), 2):
        row = []
        for piece in pieces[index:index + 2]:
            swatch = Table([[""]], colWidths=[7 * mm], rowHeights=[7 * mm])
            swatch.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(piece["color"])), ("BOX", (0, 0), (-1, -1), 0.5, INK)]))
            label = Paragraph(f"<b>{piece['programNumber']}.</b> {escape(ascii_text(piece['label']))}", body)
            row.append(Table([[swatch, label]], colWidths=[10 * mm, 68 * mm], style=[("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
        while len(row) < 2:
            row.append("")
        piece_rows.append(row)
    legend = Table(piece_rows, colWidths=[83 * mm, 83 * mm])
    legend.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm)]))
    story.extend([legend, Spacer(1, 5 * mm), Paragraph("Shared hints", h2)])

    for index, shared_hint in enumerate(config.get("hintPresets", []), start=1):
        story.append(Paragraph(f"<b>{index}.</b> {escape(ascii_text(shared_hint))}", body))

    story.extend(
        [
            Spacer(1, 5 * mm),
            Paragraph("Using this guide", h2),
            Paragraph("1. Identify the active puzzle number before selecting a hint.", body),
            Paragraph("2. Start with a broad structural hint when possible, then move toward exact placement only if needed.", body),
            Paragraph("3. The color solution is for the operator's reference and should not be shown to the participant.", body),
            Spacer(1, 8 * mm),
            Paragraph(f"Prepared {date.today().strftime('%d %B %Y')}", caption),
        ]
    )

    hints_by_puzzle = config.get("hintPresetsByPuzzle", {})
    for puzzle_id in map(str, range(1, 10)):
        puzzle_hints = hints_by_puzzle[puzzle_id]
        prompt_path, solution_path = rendered[puzzle_id]
        story.extend(
            [
                PageBreak(),
                Paragraph(f"Puzzle {puzzle_id}", h1),
                Paragraph(f"{len(puzzle_hints)} puzzle-specific hints", caption),
                Spacer(1, 2 * mm),
            ]
        )

        image_size = 65 * mm if len(puzzle_hints) > 18 else 70 * mm
        prompt_image = fitted_image(prompt_path, image_size, image_size)
        solution_image = fitted_image(solution_path, image_size, image_size)
        figures = Table(
            [
                [prompt_image, solution_image],
                [Paragraph("Participant silhouette", caption), Paragraph("Operator solution", caption)],
            ],
            colWidths=[84 * mm, 84 * mm],
            hAlign="CENTER",
        )
        figures.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("BOX", (0, 0), (0, 0), 0.5, RULE),
                    ("BOX", (1, 0), (1, 0), 0.5, RULE),
                    ("BACKGROUND", (0, 0), (-1, 0), PAPER),
                    ("TOPPADDING", (0, 0), (-1, 0), 2 * mm),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 2 * mm),
                    ("TOPPADDING", (0, 1), (-1, 1), 2 * mm),
                    ("BOTTOMPADDING", (0, 1), (-1, 1), 1 * mm),
                ]
            )
        )
        story.extend(
            [
                figures,
                Spacer(1, 2 * mm),
                Paragraph("Preset hints", h2),
                hint_columns(puzzle_hints, compact_hint if len(puzzle_hints) > 18 else hint),
            ]
        )

    doc.build(story, onFirstPage=page_decor, onLaterPages=page_decor)
    return OUTPUT_PATH


if __name__ == "__main__":
    output = build_pdf()
    print(output)
