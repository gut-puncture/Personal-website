# Site content

Each file in `projects/` is one project page. The part between the `---` lines is
data the site uses for cards, links and the voice agent. The text below it is the
page itself.

Fields:

- `title`: short and literal.
- `slug`: the page address, `/projects/<slug>`. Never change a published slug.
- `group`: `research`, `builds` or `side-quests`.
- `order`: position inside its group, lowest first.
- `year`: year the work finished.
- `kind`: one word shown on the card, such as Paper, Study, Finding, Demo, App.
- `summary`: one or two sentences, result first. Shown on cards and in search previews.
- `status`: one short line on where the work stands.
- `links`: buttons at the top of the page (`label`, `href`).
- `stats`: up to three headline numbers (`value`, `label`). Optional.
- `aliases`: names a visitor might say aloud. Used by the voice agent.
- `agent`: a plain-prose brief the voice agent answers from.

Images and video live in `public/media/<slug>/` and are referenced as `/media/<slug>/<file>`.
