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
  <img src="https://img.shields.io/badge/tests-122%20passing-brightgreen" alt="122 tests passing"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT"/>
</p>

---

```bash
npm i -g ng-rao
ngrao apply
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

## Comandos

### `ngrao apply`

Executa a reorganização. Pede confirmação antes de mover.

```bash
ngrao apply           # modo interativo
ngrao apply --yes     # pula confirmação
```

### `ngrao preview`

Mostra o que seria feito **sem alterar nada** no disco. Seguro para rodar em qualquer projeto.

```bash
ngrao preview
```

### `ngrao check`

Verifica se o projeto está organizado. Sai com código `1` se houver arquivos fora do lugar — útil em CI.

```bash
ngrao check
```

### `ngrao barrel <path>`

Gera um `index.ts` barrel para uma pasta específica, re-exportando os arquivos `.ts` existentes nela. Não sobrescreve se já existir.

```bash
ngrao barrel src/app/core/guards
```

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
# global
npm i -g ng-rao

# ou como devDependency
npm i -D ng-rao
npx ngrao apply
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
