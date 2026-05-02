# How We Tested ngrao

Before publishing, `ngrao preview` was run against **58 real public Angular repositories** on GitHub. No files were modified — only the dry-run plan was analyzed. All clones were deleted from disk immediately after each test.

**Results: 39 ok · 19 skipped (no `angular.json` at root — monorepos/fullstack) · 0 crashes**

Total TypeScript files analyzed across all repos: **3,171**

---

## Repos tested — ok (39)

| Repo | Files | Moves | Skips |
|------|-------|-------|-------|
| [gothinkster/angular-realworld-example-app](https://github.com/gothinkster/angular-realworld-example-app) | 46 | 31 | 3 |
| [nikosanif/angular-authentication](https://github.com/nikosanif/angular-authentication) | 58 | 17 | 0 |
| [Ismaestro/angular-example-app](https://github.com/Ismaestro/angular-example-app) | 105 | 23 | 6 |
| [tomastrajan/angular-ngrx-material-starter](https://github.com/tomastrajan/angular-ngrx-material-starter) | — | 0 | 0 |
| [michalmarchewczyk/ecommerce-platform-angular-admin-panel](https://github.com/michalmarchewczyk/ecommerce-platform-angular-admin-panel) | 326 | 70 | 0 |
| [akveo/ngx-admin](https://github.com/akveo/ngx-admin) | 236 | 169 | 0 |
| [DanWahlin/Angular-JumpStart](https://github.com/DanWahlin/Angular-JumpStart) | 45 | 31 | 1 |
| [bartosz-io/budget-angular](https://github.com/bartosz-io/budget-angular) | 101 | 44 | 0 |
| [ng-alain/ng-alain](https://github.com/ng-alain/ng-alain) | 107 | 67 | 0 |
| [ng-matero/ng-matero](https://github.com/ng-matero/ng-matero) | 155 | 17 | 0 |
| [aviabird/angularspree](https://github.com/aviabird/angularspree) | 326 | 100 | 10 |
| [ikismail/Angular-ShoppingCart](https://github.com/ikismail/Angular-ShoppingCart) | 58 | 30 | 0 |
| [enzocandido/angular-ecommerce](https://github.com/enzocandido/angular-ecommerce) | 25 | 14 | 0 |
| [AnkitSharma-007/blogging-app-with-Angular-CloudFirestore](https://github.com/AnkitSharma-007/blogging-app-with-Angular-CloudFirestore) | 47 | 20 | 0 |
| [taiyeoguns/news-app-angular](https://github.com/taiyeoguns/news-app-angular) | 11 | 3 | 0 |
| [AndrewJBateman/angular-news-app](https://github.com/AndrewJBateman/angular-news-app) | 4 | 1 | 0 |
| [tazbin/blog-website-frontend-Angular](https://github.com/tazbin/blog-website-frontend-Angular) | 35 | 21 | 0 |
| [erickboyzo/expense-tracker](https://github.com/erickboyzo/expense-tracker) | 89 | 31 | 0 |
| [abidakram01/angular-movie-app](https://github.com/abidakram01/angular-movie-app) | 63 | 36 | 0 |
| [iposton/angular-ssr-movie-search](https://github.com/iposton/angular-ssr-movie-search) | 13 | 4 | 0 |
| [creativetimofficial/black-dashboard-angular](https://github.com/creativetimofficial/black-dashboard-angular) | 27 | 13 | 0 |
| [creativetimofficial/paper-dashboard-angular](https://github.com/creativetimofficial/paper-dashboard-angular) | 24 | 10 | 0 |
| [rpaschoal/ng-chat](https://github.com/rpaschoal/ng-chat) | — | 0 | 0 |
| [hamedbaatour/minimus](https://github.com/hamedbaatour/minimus) | 18 | 14 | 0 |
| [housseindjirdeh/angular2-hn](https://github.com/housseindjirdeh/angular2-hn) | 27 | 10 | 0 |
| [WodenWang820118/ng-todo](https://github.com/WodenWang820118/ng-todo) | 16 | 7 | 0 |
| [snsakib/state-management-using-angular-ngrx](https://github.com/snsakib/state-management-using-angular-ngrx) | 34 | 5 | 0 |
| [Wassim-Rached/Project-Angular-2023-frontend](https://github.com/Wassim-Rached/Project-Angular-2023-frontend) | 59 | 44 | 0 |
| [AlbanesiDev/ecommerce-angular-hard-store](https://github.com/AlbanesiDev/ecommerce-angular-hard-store) | 68 | 26 | 0 |
| [cidaluna/ecommerce-angular-14](https://github.com/cidaluna/ecommerce-angular-14) | 22 | 10 | 0 |
| [bill-ahmed/qbit-matUI](https://github.com/bill-ahmed/qbit-matUI) | 51 | 40 | 0 |
| [naveedgol/music-web-player](https://github.com/naveedgol/music-web-player) | 37 | 29 | 0 |
| [piyalidas10/Ecommerce](https://github.com/piyalidas10/Ecommerce) | 104 | 35 | 0 |
| [OwenKelvin/Angular-School-Management-System](https://github.com/OwenKelvin/Angular-School-Management-System) | 201 | 65 | 14 |
| [mtwn105/Clinix-Angular](https://github.com/mtwn105/Clinix-Angular) | 59 | 45 | 0 |
| [brandonroberts/appwrite-angular-chat](https://github.com/brandonroberts/appwrite-angular-chat) | 3 | 2 | 0 |
| [anihalaney/rwa-trivia](https://github.com/anihalaney/rwa-trivia) | — | 0 | 0 |
| [AmitXShukla/Online-School-Management-App-Angular-Firebase](https://github.com/AmitXShukla/Online-School-Management-App-Angular-Firebase) | 43 | 27 | 0 |
| [premrishi/Angular-Spring-boot-Hospital-Management-System](https://github.com/premrishi/Angular-Spring-boot-Hospital-Management-System) | 50 | 20 | 0 |

---

## Repos skipped — no `angular.json` at root (19)

These are fullstack or monorepo projects where the Angular app lives in a subfolder. `ngrao` correctly detected this and refused to run instead of crashing.

| Repo | Reason |
|------|--------|
| [drissiOmar98/Angular-NgRx-Signal-Store](https://github.com/drissiOmar98/Angular-NgRx-Signal-Store) | Angular in subfolder |
| [hrithiqball/angular-nest](https://github.com/hrithiqball/angular-nest) | NestJS + Angular monorepo |
| [tastejs/angular-movies](https://github.com/tastejs/angular-movies) | Nested project structure |
| [michaelparkadze/angular-ecommerce-app](https://github.com/michaelparkadze/angular-ecommerce-app) | Nested |
| [luixaviles/socket-io-typescript-chat](https://github.com/luixaviles/socket-io-typescript-chat) | Angular in subfolder |
| [jmw5598/inventory-management-system](https://github.com/jmw5598/inventory-management-system) | Monorepo |
| [manir22sust/blog-app-angular](https://github.com/manir22sust/blog-app-angular) | Nested |
| [devtoni/angular-movies-app](https://github.com/devtoni/angular-movies-app) | Nested |
| [Robinyo/serendipity](https://github.com/Robinyo/serendipity) | Monorepo |
| [hsbalar/preserver](https://github.com/hsbalar/preserver) | Nested |
| [aviabird/yatrum](https://github.com/aviabird/yatrum) | Angular in subfolder |
| [sinnedpenguin/angular-springboot-ecommerce](https://github.com/sinnedpenguin/angular-springboot-ecommerce) | Spring Boot + Angular monorepo |
| [olasunkanmi-SE/eShop](https://github.com/olasunkanmi-SE/eShop) | Monorepo |
| [eevan7a9/real-estate-management](https://github.com/eevan7a9/real-estate-management) | Nested |
| [ankitkumarsharma/angular-ngrx-2023](https://github.com/ankitkumarsharma/angular-ngrx-2023) | Nested |
| [shreeharsh-ambli/inventory-management](https://github.com/shreeharsh-ambli/inventory-management) | Nested |
| [TommiCodes/real-time-chat-nestjs-angular](https://github.com/TommiCodes/real-time-chat-nestjs-angular) | NestJS + Angular monorepo |
| [stefanoslig/angular-ngrx-nx-realworld-example-app](https://github.com/stefanoslig/angular-ngrx-nx-realworld-example-app) | Nx monorepo |
| [aviabird/pinterest](https://github.com/aviabird/pinterest) | Angular in subfolder |

---

## What the skip message looks like

```
[ng-rao] error: angular.json não encontrado. Execute ng-rao dentro da raiz de um projeto Angular.
```

Expected behavior — `ngrao` must be run from the Angular project root, not the monorepo root.

---

## Sample output — ngx-admin (largest: 169 moves, 236 files)

```
[ng-rao] Preview — 375 ações:

  [create] src/app/core
  [create] src/app/modules/accordion/pages/accordion
  [create] src/app/modules/analytics/services
  [create] src/app/modules/chart/components/chart-panel-header
  [create] src/app/modules/chartjs/pages/chartjs
  [create] src/app/modules/chat/pages/chat
  ...
  [move]   src/app/pages/accordion/accordion.component.ts → src/app/modules/accordion/pages/accordion/accordion.component.ts
  [move]   src/app/pages/charts/charts.component.ts → src/app/modules/charts/pages/charts/charts.component.ts
  [move]   src/app/@core/data/analytics.service.ts → src/app/modules/analytics/services/analytics.service.ts
  ...
  [barrel] src/app/core/guards/index.ts
  [barrel] src/app/shared/components/index.ts
```

---

## Sample output — angular-realworld-example-app (canonical reference)

```
[ng-rao] Preview — 86 ações:

  [create] src/app/core/guards
  [create] src/app/core/interceptors
  [create] src/app/core/models/article
  [create] src/app/core/services/articles
  [create] src/app/modules/auth/components/auth
  [create] src/app/modules/home/components/home
  [create] src/app/shared/pipes/default-image
  [move]   src/app/core/auth/auth.component.ts → src/app/modules/auth/components/auth/auth.component.ts
  [move]   src/app/core/auth/auth.guard.ts → src/app/core/guards/auth.guard.ts
  [move]   src/app/core/article-helpers/article.service.ts → src/app/core/services/articles/article.service.ts
  ...
  [barrel] src/app/core/guards/index.ts
  [barrel] src/app/core/interceptors/index.ts
```

---

## Conclusions

- **0 crashes** across 39 Angular projects — small (3 files) to large (326 files)
- Correctly identifies and skips files already in the right place
- Correctly refuses to run in monorepos without `angular.json` at root
- Plan is coherent across all tested repos — domains, scopes and roles correctly detected
- `ngrao preview` is safe to run on any project: zero files are touched
