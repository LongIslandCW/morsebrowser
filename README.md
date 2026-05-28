# Long Island CW Morse Practice Page Source Code Repository

<!-- Logo swaps for GitHub light/dark theme (standard prefers-color-scheme) -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="src/assets/CW-Club-logo-dark-300x300.png">
  <source media="(prefers-color-scheme: light)" srcset="src/assets/CW-Club-logo-clear400-300x300.png">
  <img alt="Long Island CW Club logo" src="src/assets/CW-Club-logo-clear400-300x300.png" width="300" height="300">
</picture>

What is this?

The **source code repository** for [Long Island CW Club's](https://longislandcwclub.org/) customized version of [SG Phillip's](https://morsecode.world/international/trainer/generator.html) (and by the way, please note that we've made a few tweaks to his [morse-pro js libraries](https://github.com/scp93ch/morse-pro)) It is available for use by anyone who wants to practice morse code and has many useful features, and also includes LICW's lessons that go along with some classes.

This GitHub repo (`rdreed21/morsebrowser_dev`) is a **development fork**. The club’s **production** site is on the parent repo and **GitHub Pages**; this fork is previewed on **Cloudflare Workers**, not Pages. See [docs/README.md](docs/README.md) and [AGENTS.md](AGENTS.md).

### Use the live app (club — GitHub Pages)

**If you just want to practice Morse, use the club site:** https://longislandcw.github.io/morsebrowser/index.html

Or download https://longislandcw.github.io/morsebrowser/download/morse.zip and unzip somewhere on your device, then open index.html in your browser.

### Develop on this fork (Cloudflare Workers)

```bash
npm install
npm run dev          # local webpack dev server — http://localhost:3000
npm run build
npm run deploy       # publish dist/ to Cloudflare Workers (wrangler)
```

PRs to `develop` run tests in GitHub Actions and show **Workers Builds** preview URLs in the PR checks.

# Found a bug, or have a feature suggestion?

Feel free to make feature requests or bug reports using the "Issues" tab.https://github.com/LongIslandCW/morsebrowser/issues Note that you may need to open a github account. _Please respect the request to submit issues here on github rather than emailing the contributors directly_.

# Do you want to help code or just tinker with the code?

KN4YRM originally built it to be "ham tinkerer-friendly." This means it isn't built with the latest-and-greatest software development tools and techniques, but rather some compromises were made so the code might be approachable to a non-professional audience of hams who might want to tinker with it. For example, frameworks with steep learning curves might be easy for KN4YRM to work with, but hard for a non-professional software programmer to pickup. So for example, instead of react.js or angular.js, a beginner-friendly knockout.js https://knockoutjs.com/ was selected. Currently, it can best be described as knockout.js with bootstrap https://getbootstrap.com/ styling, with webpack used for builds (sourcemaps enabled so tinkerers can see how it works). This decision was also made so that ongoing future maintenance and feature requests aren't dependent on one person. KN4YRM suggests over time not losing sight of this philospohy for this project. Hams are encouraged to tinker with it and make pull requests.
Update 5/29/22: As the complexity of the feature set increased, it seemed prudent to begin a switch to typescript in order to take advantage of compile-time features that will hopefully prevent bugs and increase long term maintainability.

**Developer documentation:** see [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) for a full guide (HTML layout, Knockout/Bootstrap, build pipeline, lessons/presets, playback) with Mermaid flow diagrams. Index: [docs/README.md](docs/README.md).

It's suggested that if you want to help:
- tinkering with look and feel: https://getbootstrap.com/ and look at `src/template.html` and `src/css/`
- functionality: you'll need to know some javascript (update 5/29/22: and typescript) and especially https://knockoutjs.com/ and look at `src/morse/morse.ts`
- other genric tools of which you'll need some basic understing: node, npm, webpack, eslint, git (and github if you want to constribute)
- KN4YRM used VSCode as his IDE for this project
- Please create a feature branch off of develop, and submit a pull request to merge into develop if you have code to contribute.

1.0.0
