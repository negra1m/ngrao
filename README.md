# ng-rao

<p align="center">
  <b>ngRAO — Angular Reactive Architecture Operator</b><br/>
  Reorganiza projetos Angular automaticamente. Move arquivos, reescreve imports, gera barrels.<br/>
  Tudo local. Sem servidor. Sem configuração.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ng-rao"><img src="https://img.shields.io/npm/v/ng-rao?color=cb3837&label=npm" alt="npm version"/></a>
  <a href="https://www.npmjs.com/package/ng-rao"><img src="https://img.shields.io/npm/dm/ng-rao?color=cb3837" alt="npm downloads"/></a>
  <img src="https://img.shields.io/badge/Angular-19%2B-dd0031?logo=angular" alt="Angular 19+"/>
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js" alt="Node 18+"/>
  <img src="https://img.shields.io/badge/tests-169%20passing-brightgreen" alt="169 tests passing"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT"/>
</p>

---

```bash
npm i -D ng-rao
npx ngrao apply
```

---

## O nome

**ng-rao** vem de **ng + RAO** — `ng` de Angular, `RAO` de **Reactive Architecture Operator**.

"Reactive" não é só referência ao Angular (RxJS, signals, reactive forms) — é a proposta da ferramenta: ela *reage* à estrutura que encontra, analisa, planeja e orquestra a reorganização sem você fazer nada manualmente.

---

## O que faz

Analisa todos os arquivos `.ts` de um projeto Angular e os move para a pasta correta com base no tipo e escopo de cada um, reescrevendo todos os imports afetados automaticamente.

| Tipo | Destino |
|------|---------|
| Guard | `src/app/core/guards/` |
| Interceptor | `src/app/core/interceptors/` |
| Service (`providedIn: 'root'`) | `src/app/core/services/[domain]/` |
| Service (feature-scoped) | `src/app/modules/[domain]/services/` |
| Component (page roteável) | `src/app/modules/[domain]/pages/[name]/` |
| Component (reutilizável) | `src/app/modules/[domain]/components/[name]/` |
| Model | `src/app/core/models/[domain]/` |
| Mock | `src/app/core/mocks/[domain]/` |
| Pipe | `src/app/shared/pipes/[name]/` |
| Normalizer | `src/app/shared/normalizers/[domain]/` |

Arquivos que já estão no lugar certo são ignorados. A operação é **idempotente** — pode rodar mais de uma vez sem efeito colateral.

---

## Estrutura gerada

```
src/app/
├── core/
│   ├── constants/       ← index.ts gerado
│   ├── guards/          ← index.ts gerado
│   ├── interceptors/    ← index.ts gerado
│   ├── mocks/
│   ├── models/
│   └── services/
├── modules/
│   └── [feature]/
│       ├── components/
│       ├── pages/
│       └── services/    ← index.ts gerado
└── shared/
    ├── components/      ← index.ts gerado
    ├── normalizers/
    └── pipes/           ← index.ts gerado
```

Os `index.ts` gerados re-exportam os arquivos existentes na pasta no momento da criação (pastas vazias recebem um placeholder comentado). **Nunca sobrescrevem nada que já exista.**

---

## Modo feature-first (v1.2)

Escolhido por votação da comunidade. Abole `core/` e `shared/` e gera uma estrutura flat, alinhada ao Angular standalone moderno: **a feature é a unidade de organização, não o tipo do arquivo.**

```bash
ngrao preview --feature-first
ngrao apply --feature-first
ngrao check --feature-first
```

Sem a flag, o comportamento é exatamente o da v1.1 — nada muda para quem já usa.

### Estrutura gerada

```
src/app/
├── app.component.ts
├── app.routes.ts
├── alarms/                        ← feature
│   ├── alarms.component.ts        ← page roteável, na raiz da feature
│   ├── alarms.service.ts
│   ├── alarms.model.ts
│   └── alarm-card/                ← component da feature
│       └── alarm-card.component.ts
├── login/
│   └── login.component.ts
├── components/                    ← componentes reutilizáveis (ex-shared)
│   └── search-box/
├── guards/
├── interceptors/
├── services/                      ← só o que não tem feature dona
├── models/
├── mocks/
├── normalizers/
└── pipes/
```

### Destinos

| Tipo | Destino |
|------|---------|
| Component page (roteável) | `src/app/[feature]/` |
| Component de feature | `src/app/[feature]/[nome]/` |
| Component reutilizável (ex-`shared/`) | `src/app/components/[nome]/` |
| Service / Model / Mock / Normalizer **com feature dona** | `src/app/[feature]/` |
| Service / Model / Mock / Normalizer **sem feature dona** | `src/app/services/` `models/` `mocks/` `normalizers/` |
| Guard | `src/app/guards/` |
| Interceptor | `src/app/interceptors/` |
| Pipe | `src/app/pipes/` |

### Diferenças em relação ao modo clássico

- **`providedIn: 'root'` não decide nada.** É só como o Angular registra o provider — o que decide é existir uma feature com o mesmo domínio. `alarms.service.ts` mora em `alarms/` mesmo sendo root; `api.service.ts`, sem feature `api`, vai para `services/`.
- **Não gera barrels.** Imports apontam direto para o arquivo — o style guide moderno desencoraja `index.ts` (import circular e tree-shaking pior). O comando `ngrao barrel <path>` continua disponível para uso manual.
- **Não respeita path alias.** No clássico, `@core/*` sinaliza estrutura intencional e o conteúdo é preservado. No feature-first, `@core` aponta justamente para o que se quer abolir — os arquivos são movidos e os imports por alias viram caminho relativo quando o destino sai da raiz do alias.
- **Não cria estrutura base.** Só as pastas que os moves exigem — nada de pasta vazia.
- **Remove as pastas que ficaram vazias.** `core/`, `shared/` e `modules/` somem de fato após a migração.
- **`shared/components/[x]/` preserva a subestrutura** ao virar `components/[x]/` — `models/`, `services/` e `sub-components/` continuam junto do componente.

---

## Comandos

### `ngrao apply`

Executa a reorganização. Pede confirmação antes de mover, e lista tudo que vai fazer — incluindo os scripts de [validação contínua](#validação-contínua) que serão adicionados ao `package.json`.

```bash
ngrao apply                    # modo interativo
ngrao apply --yes              # pula confirmação
ngrao apply --feature-first    # layout feature-first (sem core/shared)
```

### `ngrao preview`

Mostra o que seria feito **sem alterar nada** no disco. Seguro para rodar em qualquer projeto.

```bash
ngrao preview
ngrao preview --feature-first
```

### `ngrao check`

Verifica se o projeto está organizado. Sai com código `1` se houver arquivos fora do lugar — útil em CI.

```bash
ngrao check
ngrao check --feature-first
```

### `ngrao barrel <path>`

Gera um `index.ts` barrel para uma pasta específica, re-exportando os arquivos `.ts` existentes nela. Não sobrescreve se já existir.

```bash
ngrao barrel src/app/core/guards
```

---

## Validação contínua

Organizar uma vez não resolve — projeto volta a bagunçar no PR seguinte. Por isso o `apply` **também deixa a validação plugada no `package.json`**:

```json
{
  "scripts": {
    "ngrao:check": "npx ng-rao check --feature-first",
    "build": "npx ng-rao check --feature-first && ng build"
  }
}
```

- O script `ngrao:check` é sempre adicionado.
- O `build` existente é encadeado — **build quebra se a arquitetura divergir**. Se você não quer isso, remova o encadeamento e mantenha só o `ngrao:check`.
- Nada é sobrescrito e nada é duplicado: se o check já estiver ali, o `apply` não mexe. Rodar duas vezes não muda nada na segunda.
- Usa `npx` de propósito, e não uma `devDependency` nova: adicionar dependência sem rodar `npm install` deixaria o `package-lock.json` fora de sincronia e quebraria `npm ci`.

### Em CI

```yaml
name: architecture
on: [push, pull_request]

jobs:
  ngrao:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx ng-rao check --feature-first
```

`check` sai com código `1` quando há arquivo fora do lugar — o job falha e o PR fica marcado.

---

## Como funciona

### 1 — Classificação

Varre `src/app/` recursivamente e determina três atributos por arquivo:

**`kind`** — detectado pelo sufixo do arquivo:
`.guard.ts` `.service.ts` `.interceptor.ts` `.component.ts` `.model.ts` `.mock.ts` `.pipe.ts` `.normalizer.ts`

**`scope`**:
- `guard` / `interceptor` → sempre `core`
- `pipe` / `normalizer` → sempre `shared`
- `service` com `providedIn: 'root'` → `core`; sem → `feature`; dentro de `shared/` → `shared`
- `model` / `mock` dentro de `shared/` → `shared`; fora → `core`
- `component` dentro de `shared/` → `shared`; fora → `feature`

**`domain`** — por prioridade:
1. Path contém `modules/[feature]/` → usa `feature`
2. Path contém `core/[type]/[domain]/` → usa `domain`
3. Fallback: primeiro segmento do nome (`alarms-list.service.ts` → `alarms`)

**`role`** (só para components):
Lê todos os `*-routing.module.ts` e `*.routes.ts` (incluindo `app.routes.ts` standalone). Se a classe aparece em `component: XxxComponent` ou em `loadComponent: () => import('...').then(m => m.XxxComponent)`, é `page`. Senão, `component`.

### 2 — Planejamento

Gera um plano de ações sem tocar no disco:
- `create_dir` — pastas da estrutura base que ainda não existem
- `move` — arquivo fora do lugar → novo caminho
- `skip` — arquivo já está no lugar certo
- `create_barrel` — `index.ts` para pastas que precisam de barrel

### 3 — Execução

Aplica o plano e reescreve os imports relativos em **todos** os `.ts` do projeto — inclusive nos arquivos que também foram movidos.

### Arquivos nunca movidos

- `app.component.ts`
- Arquivos dentro de `shared/` (já estão no lugar)
- Arquivos dentro de `sub-components/`
- `index.ts` (barrels)
- `*.spec.ts` `*.module.ts` `*-routing.module.ts` `*.routes.ts` `*.sandbox.ts`
- Arquivos dentro de raízes cobertas por path alias no `tsconfig` (ex: `@core/*` → `src/app/core/*`) — o alias indica estrutura intencional

---

## Testado em projetos reais

Antes da publicação, `ngrao preview` foi rodado contra **258 projetos Angular públicos no GitHub** (238 analisados com sucesso) — de 3 a 8.864 arquivos `.ts`. Zero crashes.

| Projeto | Arquivos | Moves |
|---------|----------|-------|
| akveo/ngx-admin | 236 | 169 |
| aviabird/angularspree | 326 | 100 |
| OwenKelvin/Angular-School-Management-System | 201 | 65 |
| gothinkster/angular-realworld-example-app | 46 | 31 |
| mtwn105/Clinix-Angular | 59 | 45 |

Detalhes completos em [HOW_WE_TESTED.md](https://github.com/negra1m/ngrao/blob/main/HOW_WE_TESTED.md).

---

## Instalação

```bash
# como devDependency do projeto (recomendado — permite rodar o check em CI)
npm i -D ng-rao
npx ngrao apply

# ou global
npm i -g ng-rao
ngrao apply
```

---

## Compatibilidade

- Angular 19+ com Standalone Components
- Node.js 18+
- Funciona com ou sem NgModules

---

## Créditos

Criado por **Vinícius Negrão** — [@negra1m](https://github.com/negra1m)

---

## Repo

Acesse no [GITHUB](https://github.com/negra1m/ngrao/)

---

## Licença

MIT
