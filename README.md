# <img src="assets/app/images/scancode-workbench-logo.png" align="center" alt="ScanCode Workbench">

[![Travis Build Status](https://travis-ci.org/nexB/scancode-workbench.svg?branch=develop)](https://travis-ci.org/nexB/scancode-workbench) 
[![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/github/nexB/scancode-workbench)](https://ci.appveyor.com/project/nexB/scancode-workbench)

ScanCode Workbench provides an advanced visual UI to help you quickly evaluate
license and other notices identified by 
[ScanCode](https://github.com/nexB/scancode-toolkit/) and record your conclusion
about the effective license(s) for a component.
[ScanCode](https://github.com/nexB/scancode-toolkit/) detects licenses, copyrights 
and other interesting information in your code. ScanCode Workbench allows you to take the
scan results from ScanCode and create conclusions. By creating these conclusions 
within your codebase, you are creating a software inventory of your product. 
The conclusions (Concluded License, Concluded Owner, etc.) you make when 
creating your conclusion can be exported as a JSON file or saved as SQLite file.

ScanCode Workbench is based on
[Electron](https://electron.atom.io/) and will be the primary desktop/GUI tool 
for using nexB’s [AboutCode tools](https://github.com/nexB/aboutcode). This app 
works on Windows, OS X and Linux operating systems.

![ScanCode Workbench](https://scancode-workbench.readthedocs.io/en/develop/_images/scancode-workbench-chart-summary.gif)

## Using

* You can [download the latest release](https://github.com/nexB/scancode-workbench/releases) 
for your operating system or build it yourself (see below). Once downloaded, you 
can find `ScanCode-Workbench` under `dist/ScanCode-Workbench-<os>-x64-<version>`.
* ScanCode Workbench >= v2 is only compatible with scans from 
[ScanCode v2.0.0](https://github.com/nexB/scancode-toolkit/releases) and 
above which are run with the ScanCode `-i` option. For a list of available ScanCode 
options see [How To: Set what will be detected in a scan](https://scancode-toolkit.readthedocs.io/en/latest/tutorials/how_to_set_what_will_be_detected_in_a_scan.html)

```bash
./scancode -clipeu <input> <output_file>
```

* We have provided a set of sample scans that you can quickly review in 
ScanCode Workbench in order to get a sense of its functionality and the types of 
information captured by a scan.  The samples are located at 
[https://github.com/nexB/scancode-workbench/tree/develop/samples](https://github.com/nexB/scancode-workbench/tree/develop/samples).
* Import a ScanCode JSON file, and see what components are in your software! See 
the [documentation](https://scancode-workbench.readthedocs.io) for more 
information on how to use ScanCode Workbench.

[Import a JSON file](https://scancode-workbench.readthedocs.io/en/develop/how-to-guides/load-your-data/import-json.html)

## Building

You'll need [Node.js](https://nodejs.org) (which comes with [npm](http://npmjs.com)) 
installed on your computer in order to build this app. For a list of platform 
specific requirements, see the Building section of the [documentation](https://scancode-workbench.readthedocs.io/en/develop/basics/building.html).
Then, from your command line:

```bash
# Clone this repository
$ git clone https://github.com/nexB/scancode-workbench.git

# Go into the repository
$ cd scancode-workbench

# Install dependencies and run the app
$ npm install

# Rebuild native Node.js modules against the app version of Node.js
# MacOS, Linux and Git Bash on Windows
$ $(npm bin)/electron-rebuild
# Windows except for Git Bash
> .\node_modules\.bin\electron-rebuild.cmd

# Run the app
$ npm start
```

## Release Instructions

You can build a `dist` directory containing executables for any one of three 
target platforms by running:

```bash
$ python build.py
```

After building is done, you can find `ScanCode-Workbench` under 
`dist/ScanCode-Workbench-<os>-x64-<version>`. Archives (tar.gz and .zip) are 
also built.

Note: A build for any of the three target platforms must be executed on the 
targeted platform.

## Testing

Test ABCM functionality using:

```bash
$ npm test
```

## License

* Apache-2.0
* Multiple licenses (LGPL, MIT, BSD, etc.) for third-party components.

See the NOTICE file for more details.

## Support

If you have a question, a suggestion or find a bug, enter an issue.

[![Gitter chat](https://badges.gitter.im/aboutcode-org/gitter.png)](https://gitter.im/aboutcode-org/discuss)

For questions and chats, you can join the Gitter channel at https://gitter.im/aboutcode-org/discuss
