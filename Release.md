## Major changes
- Ported to React + Typescript variant !!
  Under GSoC by @OmkarPh 
- Support for scancode-toolkit v32.x output format v3.0.0
- Updated Tableview library & columns
- New sections: License Detections explorer, Packages explorer, ScanInfo, About
- Support for multiple windows
- Maintain history of imports
- Updated dependencies
- Created UI to support top level packages-deps obtained in latest scans
- Support for Drag & drop JSON/SQLite files
- Github actions to create automated releases
  Exception: macos arm64 is not yet support by Github actions yet, needs manual build & upload

## Bug fixes
- Prevent crashes on unsupported scans
- Provision for header-less scans (Test scans)
- Table column fixes
- Fixed UI anomalies
- Invalid path query fix (Data for files with similar prefix were colliding)