# linter-explorer - WiP, don't use it as-is
Live demo of multiple Python linters, all configurable and running in your browser, to help you pick the one which fits you the most

## TODO Ideas
*Not creating issues for now, this is just a quick PoC and I'm not sure where I'm going... Create those if you want*
- Make `ruff` work
  - This one will probably require to release an `Emscripten/wasm32` binary wheel for `ruff`
  - The [Ruff Playground](https://play.ruff.rs) is built using [wasm-pack](https://rustwasm.github.io/wasm-pack/), but not sure this is compatible
  - Actually, maybe we should find a way to bind that version and `subprocess.run` from Pyodide?..
- Make `shed` work - will be easy once we get `ruff`
  - Actually uses `subprocess.run` to use `ruff`... Glad that I checked, I guessed there was an API
- Make it is configurable so you can limit the number of available linters / options, and set the CSS and the logo?
  - Would make a reusable project for any dev that want to show his config
- Just allow to pass all parameters through url, so you can link here instead
- Encourage the addition of more linters through PR
- Move to Preact?
- More languages? Dynamically load runtimes for js, rust...
- Both PyOxide + API?


## Credits
- [Zac-HD](https://github.com/Zac-HD)
  - for the initial idea, [specifically this issue](https://github.com/Zac-HD/shed/issues/49)
  - for [`ghostwriter`](https://github.com/Zac-HD/Zac-HD.github.io/tree/master/ghostwriter) which was used as a base for [Pyodide](https://pyodide.org/en/stable/)
- [José Padilla](https://github.com/jpadilla) for the initial [Black](https://black.readthedocs.io/en/latest/) [demo website](https://black.vercel.app/), from which most of this project was scaffolded (it uses a serverless backend while this project uses [Pyodide](https://pyodide.org/en/stable/), and it uses Next while this is a Vite React project)

### Inspirations
- Naming inspired from [Compiler Eexplorer](https://godbolt.org), which could be a good inspiration for future features
- The [Ruff Playground](https://play.ruff.rs) is actually really good

# TODO : ADDAPT THE NEXT SECTION

[![Deploy](https://github.com/jpadilla/black-playground/actions/workflows/deploy_.yml/badge.svg)](https://github.com/jpadilla/black-playground/actions/workflows/deploy.yml) [![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
                                                                                _
Black is an [open-source](https://github.com/psf/black) Python code formatter by_ [@ambv](https://github.com/ambv). This is an example implementation.

[Check it out](https://black.vercel.app).

[![black-playground-demo](https://user-images.githubusercontent.com/83319/116288177-3ce05a80-a75f-11eb-9493-b580eaba2537.gif)](https://black.vercel.app)
