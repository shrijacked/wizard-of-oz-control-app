# Revised LaTeX project

Main source: `main.tex`; bibliography: `references.bib`. Keep `aamas.cls`, `ACM-Reference-Format.bst`, `by.pdf`, and the supplied `figures/` assets beside the source. The template class and bibliography style are unchanged.

Compile the main source with Tectonic, or use an ordinary LaTeX installation:

```
pdflatex -interaction=nonstopmode -halt-on-error main.tex
bibtex main
pdflatex -interaction=nonstopmode -halt-on-error main.tex
pdflatex -interaction=nonstopmode -halt-on-error main.tex
```

The local preview was verified using Tectonic's XeTeX/BibTeX route, not independently with pdfLaTeX. Overleaf can use the supplied class and source files. The project uses TikZ with arrows.meta, positioning, calc, fit, and backgrounds, plus balance, placeins, and float. Do not alter class margins to fit the paper.

The supplementary document is in `supplement/`; compile `supplement.tex` from that directory. It has its own class copy, generated aggregate-result tables, and the condition-order diagram. Its compilation does not need the main paper's photos or bibliography.

The source archive excludes participant records, workbooks, recordings, full reference PDFs, original unredacted images, private review notes, and compiler intermediates. Figure assets include only the derivatives used in the paper. The supplementary results archive contains aggregate contrasts, not raw participant data.

The paired main analysis uses twelve core comparisons (completion, correct pieces, workload, frustration) and nineteen secondary comparisons, separately Holm-adjusted. Recorded duration and final-survey ratings are descriptive. The supplementary puzzle/block-adjusted models are robustness checks, not replacements for the paired estimates.
