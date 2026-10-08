# Setup-photo and layout revision — 8 October 2026

Baseline: writing commit `ab96ee479d3d4f929597837430bf3aa2187c0ded`.

`before/paper/` preserves the complete pre-edit LaTeX project, figures, compiled PDF and compiler intermediates. `before/aamas2027-refreshed-source.zip` preserves the previous handoff bundle. These copies were made before manuscript edits. The baseline is also recoverable from Git.

This revision selects IMG_3103 for a genuine rear-view setup photograph. HEIC originals are unchanged. JPEG conversion preserves the scene; `jpegtran -copy icc` strips EXIF/location/device metadata without changing decoded pixels or the color profile. The crop is applied only through LaTeX `trim`/`clip`, not baked into the photograph.

Figure 3 keeps the schematic at 70% width and centers a 28%-width stack of setup, overhead, and dashboard images alongside it. Caption and accessible description identify all views. Introduction now carries the intervention-cost and physiological-evaluation rationale; Related Work is condensed without dropping references. Hart's workload citation is moved to Measures. Repeated figure/table caption wording is shortened to improve page flow. No numerical results or analysis inputs changed.

The setup photograph includes the back of a participant's head/body. Before external publication, ensure consent covers this photograph and assess indirect identifiability. Insertion into a local draft does not establish participant permission for public release.

Current editable project: `../../paper/main.tex`. This revision is prepared locally; no new commit or push is implied.
