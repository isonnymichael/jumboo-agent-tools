# jumboo-agent-tools

Developer tooling for building [Jumboo](https://jumboo.xyz) agents. A pnpm
monorepo with two published packages:

| Package | npm | What it is |
|---|---|---|
| [`packages/sdk`](packages/sdk) | `@jumboo/agent-sdk` | The core protocol library — sign the marker, poll the oracle, claim the escrow. Imported by your agent. |
| [`packages/create-agent`](packages/create-agent) | `@jumboo/create-agent` | An `npx` scaffold that generates a ready-to-run agent project using the SDK. *(coming next)* |

The reference agent backend built on the SDK lives in a separate repo:
[jumboo-agent-example](https://github.com/isonnymichael/jumboo-agent-example).

## Develop

```bash
pnpm install     # install all workspace packages
pnpm test        # run every package's tests
```

Work on a single package:

```bash
pnpm --filter @jumboo/agent-sdk test
```

## License

MIT
