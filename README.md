# Marilyn Dela Cruz — Portfolio

Personal portfolio of **Marilyn Dela Cruz**, a customer support professional moving into **Virtual Assistant** work.

**Live site:** https://lyn-portfolio.github.io/lyn-portfolio/

A soft, glassy design with a short welcome intro, drifting background sparkles, a cursor sparkle trail, a light / dark theme and a small chat assistant that answers questions from the page's own content.

---

## What's on the page

The menu works like separate pages: **Home** shows every section, and each other menu item opens its section on its own.

| Section | What it shows |
|---|---|
| **Home / Hero** | Name, title, photo orb, "Explore Work" and "Download CV" buttons |
| **About** | Short introduction |
| **Skills** | Skill rows and arches that rise in on scroll |
| **Tools** | Always-moving rows of tools, with a "View All" view split into category tabs |
| **Experience** | Work timeline with a career bar |
| **Recommendations** | A fanned deck of recommendation cards (arrows, dots, keyboard or drag) |
| **Contact** | Message form, contact details and location |
| **Lyn's Assistant** | A chat bubble that answers common questions |

## Built with

- Plain **HTML, CSS and JavaScript**. No build step.
- **Tailwind CSS** utility classes, already compiled into `style.css` (no Tailwind setup is needed).
- **[Web3Forms](https://web3forms.com)** to deliver contact-form messages by email, with FormSubmit as a fallback.
- **Font Awesome** icons and **Google Fonts**.
- Hosted on **GitHub Pages**.

## Files

```
index.html             Page content (all the text and sections)
style.css              Look and layout, in numbered blocks
script.js              Behaviour: intro, page router, chat, contact form, animations
sw.js                  Service worker: offline support and "install as app"
manifest.webmanifest   App name, colours and icons for "install as app"
assets/
  lyn-photo.jpg                  Profile photo
  Marilyn-Dela-Cruz-Resume.pdf   The resume behind "Download CV"
icons/                 App icons
preview.jpg            Picture shown when the link is shared on social media
.github/workflows/     Publishes the site to GitHub Pages on every push to main
```

`style.css` and `script.js` each start with a table of contents. The blocks in `style.css` must stay in their order, because later blocks intentionally override earlier ones. The block holding the compiled Tailwind classes is generated, so don't edit it by hand.

Three tiny scripts stay inline at the top of `index.html` because they have to run before the page is drawn: the https redirect, the saved dark theme and the intro flag.

## Run it on your computer

No installation is needed. Serve the folder with any simple web server, for example:

```bash
npx serve .
```

Then open the address it prints. You can also open `index.html` directly in a browser; everything works except the offline support.

## Update the content

- **Text** (about, experience, recommendations, contact details): `index.html`.
- **Resume:** replace `assets/Marilyn-Dela-Cruz-Resume.pdf` with the new file, keeping the same name.
- **Photo:** replace `assets/lyn-photo.jpg`.
- **Chat assistant answers:** block 6 of `script.js`. It reads most answers straight from the page, so updating `index.html` usually updates the chat too.

## Publish

Push to the `main` branch. The GitHub Actions workflow publishes the site to GitHub Pages within a minute or two.

Before each push that changes the site, raise `VERSION` in `sw.js` (for example `v2` → `v3`) so visitors get the new files instead of a saved copy.

## Notes

- The Web3Forms access key in `script.js` is meant to be public. It can only send messages to Marilyn's own inbox.
- With "reduce motion" turned on in the device settings, the larger animations are toned down.

---

© Marilyn Dela Cruz
