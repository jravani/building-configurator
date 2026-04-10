# Building Configurator

A React-based GUI for configuring building energy models in the [EnerPlanET](https://www.figma.com/make/pEolLUBa32IcVQP4t7PA49/Building-configurator_for_buem?fullscreen=1&t=61BMw2Y4ObTDiNp2-1) frontend. Feeds building parameters into the BUEM microservice for thermal simulation via the [BUEM JSON Schema contract](https://github.com/THD-Spatial-AI).

## Features

- Configure building geometry, envelope elements, and thermal parameters
- Set up roof and photovoltaic (PV) system properties
- Visualise the building energy envelope and surface composition
- View simulated heating and cooling load profiles
- Step-by-step configuration workflow with live building snapshot

## Running the code

```bash
npm install
npm run dev
```

## Try it out

Deployed on Vercel — [building-configurator-gui.vercel.app](https://building-configurator-gui.vercel.app/)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to report bugs, request features, and submit pull requests.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Designed and developed by

[Jay Ravani](https://github.com/jravani)
