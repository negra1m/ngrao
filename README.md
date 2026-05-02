# ngrao

**ng**RAO — Angular **R**eactive **A**rchitecture **O**perator

> Por **Vinícius Negrão** — Few Company
> Open source. Gratuito. MIT.

```bash
npm i -g ng-rao
ngrao apply
```

---

## O nome

**ngrao** carrega duas leituras no mesmo nome:

- **Negrão** — sobrenome do autor, Vinícius Negrão
- **ng + RAO** — `ng` de Angular, `RAO` de **Reactive Architecture Operator**

"Reactive" não é só referência ao Angular (RxJS, signals, reactive forms) — é a proposta da ferramenta: ela reage à estrutura que encontra, analisa, planeja e orquestra a reorganização sem você ter que fazer nada manualmente.

---

## O que faz

Analisa todos os arquivos TypeScript de um projeto Angular e os move para a pasta correta com base no tipo e escopo de cada arquivo, reescrevendo todos os imports afetados automaticamente.

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

Arquivos que já estão no lugar certo são ignorados. A operação é idempotente — pode rodar mais de uma vez sem efeito colateral.

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

Os `index.ts` gerados são barrels com comentário de uso — nunca sobrescrevem nada que já exista.

---

## Comandos

### `ngrao apply`

Executa a reorganização. Pede confirmação antes de mover.

```bash
ngrao apply           # modo interativo
ngrao apply --yes     # pula confirmação
```

### `ngrao preview`

Mostra o que seria feito sem alterar nada no disco.

```bash
ngrao preview
```

### `ngrao check`

Verifica se o projeto está organizado. Sai com código 1 se houver arquivos fora do lugar — útil em CI.

```bash
ngrao check
```

### `ngrao barrel <path>`

Gera um `index.ts` barrel para uma pasta específica (não sobrescreve se já existir).

```bash
ngrao barrel src/app/core/guards
```

---

## Como funciona

### 1. Classificação

Varre `src/app/` recursivamente e determina três atributos por arquivo:

**`kind`** — detectado pelo sufixo:
`.guard.ts`, `.service.ts`, `.interceptor.ts`, `.component.ts`, `.model.ts`, `.mock.ts`, `.pipe.ts`, `.normalizer.ts`

**`scope`** — regras:
- `guard` e `interceptor` → sempre `core`
- `pipe` e `normalizer` → sempre `shared`
- `service` com `providedIn: 'root'` → `core`; sem → `feature`; dentro de `shared/` → `shared`
- `model` / `mock` dentro de `shared/` → `shared`; fora → `core`
- `component` dentro de `shared/` → `shared`; fora → `feature`

**`domain`** — por prioridade:
1. Path contém `modules/[feature]/` → usa `feature`
2. Path contém `core/[type]/[domain]/` → usa `domain`
3. Fallback: primeiro segmento do nome do arquivo (`alarms-list.service.ts` → `alarms`)

**`role`** (só para components):
Lê todos os `*-routing.module.ts` do projeto. Se a classe aparece em algum `component: XxxComponent`, o role é `page`; senão, `component`.

### 2. Planejamento

Gera um plano de ações sem tocar no disco:
- `create_dir` — pastas da estrutura base que ainda não existem
- `move` — arquivo fora do lugar → novo caminho
- `skip` — arquivo já está correto
- `create_barrel` — `index.ts` para pastas que precisam de barrel

### 3. Execução

Aplica o plano e, após todos os moves, reescreve os imports relativos em **todos** os `.ts` do projeto — inclusive nos arquivos que também foram movidos.

### Arquivos nunca movidos

- `app.component.ts`
- Qualquer arquivo já dentro de `shared/`
- Arquivos dentro de `sub-components/`
- `index.ts` (barrels)
- `*.spec.ts`, `*.module.ts`, `*-routing.module.ts`, `*.sandbox.ts`

---

## Compatibilidade

- Angular 19+ com Standalone Components
- Node.js 18+
- Projetos com ou sem NgModules (routing modules são lidos para detectar pages, mas não movidos)

---

## Instalação

```bash
npm i -g ng-rao
```

Ou como devDependency:

```bash
npm i -D ng-rao
npx ngrao apply
```

---

## Desenvolvimento

```bash
npm install
npm run build       # compila com tsup
npm test            # vitest (95 testes)
npm run test:watch  # modo watch
```

---

## Créditos

Criado por **Vinícius Negrão** — [Few Company](https://fewcompany.com)

---

## Licença

MIT
