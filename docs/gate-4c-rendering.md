# Gate 4C PDF rendering and font decision

Gate 4C uses PDFKit 0.19.1 to draw the five synthetic Form 3A reports as landscape A4 vector PDFs. The renderer reads report metadata and signatures from the canonical fixture, page and bilingual label order from the official field catalogue, and daily ratings and recommendations from the normalized Gate 4A data. It does not perform OCR or introduce external context.

English text uses PDFKit's PDF-standard Helvetica fonts. Chinese text uses Noto Sans HK 5.2.9 from the declared `@fontsource/noto-sans-hk` dependency. Noto Sans HK is licensed under SIL Open Font License 1.1. The package splits its Chinese coverage into Unicode-range WOFF files, so the renderer selects the matching chunk for each character and PDFKit embeds only used glyphs. The repository does not copy, vendor, or commit any system or proprietary font file.

The generator fixes PDF creation and modification dates and keeps report and page ordering stable. It writes five four-page files and one combined twenty-page file under `generated/work-package-1/pdfs/`.

Automated QA uses PDF.js to verify page counts, bilingual labels, report order, recommendations, signatures, notices, and deterministic bytes. Visual QA uses `scripts/render-gate4c-pages.sh`, which requires Poppler `pdfinfo` and `pdftoppm`, renders all twenty combined pages to `tmp/pdfs/gate4c/`, and verifies the rendered image count. Review every rendered page for clipping, overlaps, broken borders, missing glyphs, incorrect page breaks, and unreadable text before Gate 4C review.
