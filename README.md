# v2.lukeanthony.co

Israel Allen’s personal site. Plain HTML, CSS and JavaScript. No build step, no libraries, no trackers.

## What’s here

| File | What it is |
|---|---|
| `index.html` | Home: the grid, the crystal, links to every page |
| `about.html` | About, skills, triathlon and the helmet |
| `work.html` | Research roles with a timeline drawn from their dates |
| `lab.html` | Two images redrawn in text, and the crystal up close |
| `contact.html` | Email, GitHub, LinkedIn, the reaching hands and a message box |
| `404.html` | Shown automatically by GitHub Pages for missing pages |
| `CNAME` | Tells GitHub Pages to serve the site at v2.lukeanthony.co |
| `assets/css/site.css` | All styles. Colors are at the top. |
| `assets/js/glyph.js` | The text-drawing engine shared by every drawing |
| `assets/js/*.js` | One small script per page |
| `ASSETS.md` | Where each image came from. **Fill this in before you publish.** |

## Preview on your computer

Double-clicking `index.html` works for every page except the Lab: browsers block reading image pixels from plain files, so the Lab shows the original images instead. To see everything, run a tiny local server from this folder:

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Press Ctrl+C in the terminal to stop it.

## Publish on GitHub Pages

1. On GitHub, create a new **public** repository named exactly `izzyallen876.github.io`. Leave “Add a README” unticked.
2. On the empty repository page, click **uploading an existing file**. Open this folder, select everything inside it (not the folder itself), drag it all in, then click **Commit changes**.
3. Go to **Settings → Pages**. Under “Build and deployment”, set Source to **Deploy from a branch**, Branch to **main** and the folder to **/ (root)**, then click **Save**. After a minute or two the site is live at https://izzyallen876.github.io.
4. Still on **Settings → Pages**, type `v2.lukeanthony.co` under **Custom domain** and click **Save**. Do this before the DNS step. GitHub warns that adding DNS records first can let someone else claim your domain.
5. In Cloudflare, open v2.lukeanthony.co → **DNS → Records** and add these. Set each one to **DNS only** (grey cloud), so GitHub can issue your HTTPS certificate.

   | Type | Name | Content |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | AAAA | @ | 2606:50c0:8000::153 |
   | AAAA | @ | 2606:50c0:8001::153 |
   | AAAA | @ | 2606:50c0:8002::153 |
   | AAAA | @ | 2606:50c0:8003::153 |
   | CNAME | www | izzyallen876.github.io |

   Delete any older A, AAAA or CNAME records for `@` or `www` that point somewhere else. **Leave your Proton Mail records (MX and TXT) exactly as they are**, or your email will stop working.
6. Back on **Settings → Pages**, wait for the DNS check to pass. It can take up to 24 hours. Then tick **Enforce HTTPS**.
7. Recommended: verify the domain in your GitHub account (your profile’s **Settings → Pages → Add a domain**). It stops anyone else from using it on GitHub.

These DNS values come from GitHub’s guide “Managing a custom domain for your GitHub Pages site”. If they ever change, that guide is the source of truth.

## Changing things

- **Words** are in the `.html` files. The top bar and footer are repeated on every page, so change them in all six.
- **A new role:** in `work.html`, copy an `<article class="job">` block and change its `id`, `data-from` (like `2027-01`), `data-to` (a month, or `now`) and `data-short` (the timeline label). The timeline redraws itself.
- **The Lab images:** swap in your own under the same file names in `assets/img/`. Any size works. Update the `width`, `height` and `alt` text on their `<img>` tags in `lab.html`.

## Privacy and security

There are no cookies, analytics or third-party requests. Your light or dark choice is saved in your own browser. The message box opens a draft in the visitor’s email app, and nothing is sent from the site. Every page carries a content security policy that blocks anything not loaded from this site.

## License

There’s no license file, so by default the code and writing are all rights reserved. If you want others to reuse the code, add a license from your repository page (**Add file → Create new file**, name it `LICENSE`, and GitHub offers templates).
