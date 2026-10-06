# Highlighted cumulative TeX review

This package shows the same cumulative changes as ../highlighted-review.html: protocol/anonymity, restored abstract/planned N=24, and the figure revision. The comparison baseline is ../before/main.tex; the clean current source remains ../../../main.tex. The main manuscript and current clean PDF have not been edited by generating this review.

Open main-highlighted.tex as the main document. Green text marks additions; red strike-through marks deletions. Changed graphics have blue frames; removed graphics are smaller with red crosses. The abstract also has word-level changes. Preamble changes, including the old named author blocks, are retained as source diff comments; a visible legend explains the anonymous author change. This is an internal review file, not the anonymous submission file.

All project dependencies are included: aamas.cls, ACM-Reference-Format.bst, references.bib, by.pdf, figures/ and previous-figures/. Standard LaTeX packages include TikZ, ulem, settobox and letltxmacro. Upload the package to Overleaf, select main-highlighted.tex, and use pdfLaTeX/BibTeX; or compile in a standard LaTeX environment:

    pdflatex -interaction=nonstopmode -halt-on-error main-highlighted.tex
    bibtex main-highlighted
    pdflatex -interaction=nonstopmode -halt-on-error main-highlighted.tex
    pdflatex -interaction=nonstopmode -halt-on-error main-highlighted.tex

The checked PDF was compiled using the established Tectonic 0.17.0 / XeTeX + BibTeX route, not independently tested with pdfLaTeX. It has nine pages; all pages were rendered and visually checked, with no final overfull boxes, missing characters, undefined references or fatal errors. The clean paper remains eight pages. Review-only paragraph spacing and disabled final-column balancing accommodate visible deletions; template margins/font size are unchanged.

Generation: official latexdiff standalone script 1.4.0 from https://mirrors.ctan.org/support/latexdiff.zip (project https://github.com/ftilmann/latexdiff). No latexdiff installation is needed to compile the generated source. Custom green/red-strikeout macros are embedded. Deleted figure floats, graphics wrapping and the obsolete figure reference were repaired for compilation; the abstract was separately diffed because its placement in the preamble prevented visible word-level markup in the initial tool output.

validation.json records input/output hashes and checks. package-manifest.json identifies every packaged file. The compiled review PDF is main-highlighted.pdf. Earlier baselines and review files remain intact. No raw participant inputs or literature PDFs are included.
