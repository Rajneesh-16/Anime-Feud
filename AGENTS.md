<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Game rules/scoring live in src/game/config.ts and questions in src/game/data.ts; UI in src/components/feud reads state only via src/game/store.tsx — keeps logic separate from presentation.
- Runtime images use bundled project assets rather than Lovable-only asset URLs so local and hosted builds behave consistently.
