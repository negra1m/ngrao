# MELHORIAS — ng-rao

Análise técnica do código v1.0.4 contra o proposto no README.
Base: suíte de testes executada (95/95 passando, 3 arquivos, 1.59s) + leitura integral de `src/` (960 linhas).

## Status da aplicação (2026-07-21)

Aplicado na branch `feat/melhorias-v1.1` — suíte final: 122/122 testes passando.

| Item | Status |
|------|--------|
| 1.1 confirm fictício | Aplicado — `isConfirmation()`: Enter/y/yes/s/sim confirmam, resto cancela |
| 1.2 rotas standalone | Aplicado — lê `*.routes.ts` + `loadComponent: ... .then(m => m.X)` |
| 1.3 JSONC/falha silenciosa | Aplicado — stripper correto (strings, block, trailing commas) + `logger.warn` em parse fail |
| 1.4 atomicidade | Aplicado — warn de git sujo antes do apply; em falha no meio, imports dos moves já feitos ainda são reescritos antes de propagar o erro |
| 2.1 ações fantasma | Aplicado — `buildPlan` usa `scanExistingStructure`/`getMissingEntries`; projeto conforme gera plano vazio |
| 2.2 check estrutural | Aplicado — check falha também para pastas/barrels ausentes |
| 2.3 barrels vazios | Aplicado — barrels re-exportam os `.ts` da pasta na criação (nunca sobrescrevem); descrição do CLI corrigida |
| 2.4 alias destruído | Aplicado — reescrita preserva estilo do import (alias, src-absoluto, baseUrl); regra de skip por alias documentada no README |
| 3.1 shared/ frouxo | Aplicado — ancorado em `src/app/shared/` |
| 3.2 domain heurístico | Aplicado — longest-match contra módulos existentes em `modules/` |
| 3.3 imports não cobertos | Aplicado parcialmente — side-effect imports cobertos; `styleUrls` multiline com `]` em string segue fora (borda rara) |
| 3.4 tsconfig extends | Parcial — warn implementado (via 1.3); resolução de `extends` fora do cwd não implementada |
| 4.x higiene | Aplicado — versão injetada no build, nome corrigido, README 258 repos, badge 122, parsing/walk/barrel unificados em `src/utils/`, código morto agora em uso |
| 5.x testes | Aplicado — 27 testes novos (`tests/melhorias.spec.ts`): confirm, JSONC, standalone, longest-match, plano vazio, barrels, estilos de import. Pendente: fixture com `tsc --noEmit` pós-apply |

Pendências restantes: resolução de `extends` do tsconfig, e2e com compilação real.

---

## 1. Críticos (contradizem o proposto ou causam dano)

### 1.1 Confirmação do `apply` é fictícia
`src/commands/apply.ts:52-60` — `confirm()` resolve `true` para **qualquer** input. Digitar `n`, `nao` ou qualquer coisa confirma a operação. O branch `if (!confirmed)` é código morto. Para uma ferramenta que move arquivos e reescreve imports em massa, isso é o defeito mais grave do projeto.
**Sugestão:** ler a resposta (`rl.question(q, (answer) => ...)`) e só confirmar em `''`, `y`, `s`. Qualquer outra coisa cancela.

### 1.2 Detecção de "page" não funciona em projetos standalone — o público-alvo declarado
README promete "Angular 19+ com Standalone Components", mas `collectRoutedComponents` (`src/classifier/index.ts:71-94`) lê **apenas** `*-routing.module.ts` e o padrão `component: XxxComponent`. Projetos standalone usam `app.routes.ts` / `*.routes.ts` e `loadComponent: () => import(...)`. Resultado: em projeto standalone puro, nenhum component é classificado como `page` — todos caem em `modules/[domain]/components/`, contrariando a tabela de destinos do README.
**Sugestão:** incluir `*.routes.ts` e `app.routes.ts` no walk de rotas; adicionar regex para `loadComponent: () => import('...').then(m => m.XxxComponent)`.

### 1.3 Falha silenciosa no parse do tsconfig pode quebrar o projeto do usuário
O strip de JSONC (`classifier/index.ts:29-32`, `writer/index.ts:199-201, 223-225`) remove só linhas que **começam** com comentário. Um comentário trailing (`"baseUrl": "src", // x`) quebra o `JSON.parse`, o `catch` engole, e aliases/baseUrl se perdem. Consequência: imports via alias **não são reescritos** após o move — o projeto do usuário quebra sem nenhum aviso.
**Sugestão:** emitir `logger.warn` quando o parse falhar; melhorar o strip (remover trailing comments fora de strings) ou usar um parser JSONC pequeno.

### 1.4 Sem atomicidade nem proteção contra estado sujo
`execute()` faz `renameSync` em sequência e só reescreve imports **no final**. Se qualquer move falhar no meio (permissão, EXDEV em cross-device no Windows, arquivo aberto), o projeto fica meio-movido com imports quebrados e sem rollback.
**Sugestão mínima:** antes do `apply`, verificar se o working tree do git está limpo e avisar/abortar se não estiver (é o rollback gratuito). Envolver o loop de moves em try/catch que, em falha, ainda executa `rewriteImports` com o `moveMap` parcial.

---

## 2. Altos (gap entre proposto e implementado)

### 2.1 "Projeto já está conforme. Nada a fazer." nunca dispara
`buildPlan` (`src/architect/index.ts:40-48`) adiciona incondicionalmente os 12 `create_dir` do TEMPLATE + barrels, sem checar existência. Num projeto 100% conforme, `actionable.length` nunca é 0 — `preview` e `apply` sempre listam ações fantasma e pedem confirmação. A idempotência existe no disco (os guards `existsSync` do writer), mas a UX contradiz o README ("Arquivos que já estão no lugar certo são ignorados").
**Nota:** `scanExistingStructure` (detector) e `getMissingEntries` (architect) existem exatamente para isso e **não são usados por ninguém** — código morto. Usar ambos no `buildPlan` resolve.

### 2.2 `check` não valida a estrutura base
`checkCommand` só considera ações `move`. Projeto sem `core/`, `shared/` etc. passa no check com exit 0, mas o `apply` ainda criaria pastas e barrels. Para uso em CI (proposta do README), check e apply deveriam concordar sobre "conforme".

### 2.3 Barrels gerados não exportam nada
O `index.ts` criado é só comentário-placeholder. O README diz "gera barrels", mas um barrel sem `export *` não é consumível — importar dele falha. Além disso, a descrição do comando `barrel` diz "Generate **or update**" e o código nunca atualiza (skip se existir).
**Sugestão:** gerar `export * from './<arquivo>';` para os `.ts` reais da pasta (excluindo spec), ou ajustar README/descrição para "cria placeholder".

### 2.4 Reescrita de import por alias destrói o alias
`rewritePath` (`writer/index.ts:115-154`) resolve `@core/foo` para caminho absoluto e devolve **caminho relativo** — o projeto que usava aliases passa a ter mistura de estilos após o apply. E arquivos sob raiz de alias nunca são movidos (`coveredByAlias` → kind `other`), regra que não está documentada no README.
**Sugestão:** quando o import original era alias e o destino continua sob a mesma raiz do alias, reescrever mantendo o alias. Documentar a regra de skip por alias.

---

## 3. Médios (robustez e correção de borda)

### 3.1 Matching de `shared/` frouxo
`detectScope` usa `relativePath.includes('shared/')` — casa também `modules/dashboard/shared/foo.service.ts`, classificando como shared algo que é da feature. Usar prefixo ancorado: `src/app/shared/`.

### 3.2 Heurística de domain por primeiro segmento do nome é agressiva
`user-profile.service.ts` → domain `user`; `order-list.component.ts` → `order`. Em projetos com nomes compostos legítimos (`user-profile` como feature), arquivos da mesma feature se espalham por módulos diferentes. Os 258 previews do HOW_WE_TESTED validaram "não crasha", não "classificou certo".
**Sugestão:** quando existir `modules/<primeiro-segmento>-<segundo>/`, preferir o match mais longo; ou expor um mapa de domains via config opcional.

### 3.3 Imports não cobertos pela reescrita
- Side-effect imports: `import './setup';`
- `export ... from` está coberto (regex `\bfrom`), mas `require()` não (irrelevante para Angular — ok ignorar, documentar).
- `styleUrls` multiline com `]` dentro de string quebraria o regex `[^\]]*` (borda rara).

### 3.4 tsconfig com `extends` não é resolvido
Ler os 3 candidatos fixos mitiga o caso comum, mas monorepo com `extends: '../../tsconfig.base.json'` fora do cwd perde paths/baseUrl silenciosamente. Relacionado ao 1.3 — o warn resolve o "silencioso".

---

## 4. Baixos (higiene)

| Item | Onde | Problema |
|------|------|----------|
| Versão hardcoded | `src/cli.ts:12` | `'1.0.0'` vs 1.0.4 no package.json. Importar do package.json no build. |
| Nome inconsistente | `src/cli.ts:11` | "Angular **Rewriter** Architecture **Orchestrator**" vs "Reactive Architecture Operator" (README/package.json). |
| README vs HOW_WE_TESTED | README:167 | README diz "39 projetos", HOW_WE_TESTED.md diz 258. |
| Badge de testes hardcoded | README:14 | "95 passing" estático — vai divorciar da realidade no primeiro teste novo. |
| Parsing JSONC triplicado | classifier + writer (2x) | `readAliasRoots`/`readBaseUrl`/`readAliasPaths` repetem o mesmo strip+parse. Extrair `src/tsconfig/index.ts`. |
| `walkTs` duplicado | classifier e writer | Duas implementações com filtros diferentes. Unificar com parâmetro de filtro. |
| `barrelComment` duplicado | architect e commands/barrel | Mesmo template em dois lugares. |
| Código morto | detector/architect | `scanExistingStructure`, `getMissingEntries`, `getAngularVersion` sem chamadores (usar no 2.1 ou remover). |

---

## 5. Testes

95 testes cobrem bem classifier, architect e writer (incluindo end-to-end de move + rewrite). Lacunas:

1. **Zero testes para `commands/`** — o bug 1.1 (confirm sempre true) seria pego por um teste trivial de `apply` com input "n".
2. **Zero testes para `detector/`** e para o parsing de tsconfig (JSONC com trailing comment, `extends`, malformado).
3. **Sem teste de compilação pós-apply** — o critério real de sucesso é "o projeto compila depois". Sugestão: fixture de projeto Angular mínimo + `tsc --noEmit` após `execute()` no CI.
4. **Sem fixture standalone** — nenhum teste com `app.routes.ts`/`loadComponent`, exatamente o gap 1.2.

---

## Prioridade sugerida

1. **1.1** (confirm) — correção de 5 linhas, risco real ao usuário.
2. **1.2** (standalone routes) — é a promessa central do README.
3. **2.1** (plano fantasma) — usar o código morto já escrito para isso.
4. **1.3 + 3.4** (warn em tsconfig ilegível) — 1 linha de warn elimina a falha silenciosa.
5. **1.4** (git limpo antes de apply).
6. Restante conforme roadmap.
