# linter-explorer - WiP, don't use it as-is
Live demo of multiple Python linters, all configurable and running in your browser, to help you pick the one which fits you the most

- Starting Python only, with Black/Ruff/Shed, only the lib works for now, there is no WiP for the whole UI
  - The tests prove the equivalence with the local tools => `make generate-references` to update

## TODO Future ideas
*Not creating issues for now, this is just a quick PoC and I'm not sure where I'm going... Create those if you want*
- Make it is configurable so you can limit the number of available linters / options, and set the CSS and the logo?
  - Would make a reusable project for any dev that want to show his config
- Just allow to pass all parameters through url, so you can link here instead
- Encourage the addition of more linters through PR

## Credits
- [Zac-HD](https://github.com/Zac-HD)
  - for the initial idea, [specifically this issue](https://github.com/Zac-HD/shed/issues/49)
  - for [`ghostwriter`](https://github.com/Zac-HD/Zac-HD.github.io/tree/master/ghostwriter) which was used as a base for [Pyodide](https://pyodide.org/en/stable/)
- [José Padilla](https://github.com/jpadilla) for the initial [Black](https://black.readthedocs.io/en/latest/) [demo website](https://black.vercel.app/), from which most of this project was scaffolded (it uses a serverless backend while this project uses [Pyodide](https://pyodide.org/en/stable/), and it uses Next while this is a Vite React project)

### Inspirations
- Naming inspired from [Compiler Explorer](https://godbolt.org), which could be a good inspiration for future features
- The [Ruff Playground](https://play.ruff.rs) is actually really good
