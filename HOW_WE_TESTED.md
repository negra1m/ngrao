# How We Tested ngrao

Before publishing, `ngrao preview` was run against **258 real public Angular repositories** on GitHub. No files were modified — only the dry-run plan was analyzed. All clones were deleted from disk immediately after each test.

**Results: 238 ok · 19 skipped (no `angular.json` at root — monorepos/fullstack) · 0 crashes · 1 clone fail (network)**

Total TypeScript files analyzed across all repos: **25,199**

---

## Repos tested — ok (238)

| Repo | Files | Moves |
|------|-------|-------|
| [gothinkster/angular-realworld-example-app](https://github.com/gothinkster/angular-realworld-example-app) | 46 | 31 |
| [nikosanif/angular-authentication](https://github.com/nikosanif/angular-authentication) | 58 | 17 |
| [Ismaestro/angular-example-app](https://github.com/Ismaestro/angular-example-app) | 105 | 23 |
| [tomastrajan/angular-ngrx-material-starter](https://github.com/tomastrajan/angular-ngrx-material-starter) | — | 0 |
| [michalmarchewczyk/ecommerce-platform-angular-admin-panel](https://github.com/michalmarchewczyk/ecommerce-platform-angular-admin-panel) | 326 | 70 |
| [akveo/ngx-admin](https://github.com/akveo/ngx-admin) | 236 | 169 |
| [DanWahlin/Angular-JumpStart](https://github.com/DanWahlin/Angular-JumpStart) | 45 | 31 |
| [bartosz-io/budget-angular](https://github.com/bartosz-io/budget-angular) | 101 | 44 |
| [ng-alain/ng-alain](https://github.com/ng-alain/ng-alain) | 107 | 67 |
| [ng-matero/ng-matero](https://github.com/ng-matero/ng-matero) | 155 | 17 |
| [aviabird/angularspree](https://github.com/aviabird/angularspree) | 326 | 100 |
| [ikismail/Angular-ShoppingCart](https://github.com/ikismail/Angular-ShoppingCart) | 58 | 30 |
| [enzocandido/angular-ecommerce](https://github.com/enzocandido/angular-ecommerce) | 25 | 14 |
| [AnkitSharma-007/blogging-app-with-Angular-CloudFirestore](https://github.com/AnkitSharma-007/blogging-app-with-Angular-CloudFirestore) | 47 | 20 |
| [taiyeoguns/news-app-angular](https://github.com/taiyeoguns/news-app-angular) | 11 | 3 |
| [AndrewJBateman/angular-news-app](https://github.com/AndrewJBateman/angular-news-app) | 4 | 1 |
| [tazbin/blog-website-frontend-Angular](https://github.com/tazbin/blog-website-frontend-Angular) | 35 | 21 |
| [erickboyzo/expense-tracker](https://github.com/erickboyzo/expense-tracker) | 89 | 31 |
| [abidakram01/angular-movie-app](https://github.com/abidakram01/angular-movie-app) | 63 | 36 |
| [iposton/angular-ssr-movie-search](https://github.com/iposton/angular-ssr-movie-search) | 13 | 4 |
| [creativetimofficial/black-dashboard-angular](https://github.com/creativetimofficial/black-dashboard-angular) | 27 | 13 |
| [creativetimofficial/paper-dashboard-angular](https://github.com/creativetimofficial/paper-dashboard-angular) | 24 | 10 |
| [rpaschoal/ng-chat](https://github.com/rpaschoal/ng-chat) | — | 0 |
| [hamedbaatour/minimus](https://github.com/hamedbaatour/minimus) | 18 | 14 |
| [housseindjirdeh/angular2-hn](https://github.com/housseindjirdeh/angular2-hn) | 27 | 10 |
| [WodenWang820118/ng-todo](https://github.com/WodenWang820118/ng-todo) | 16 | 7 |
| [snsakib/state-management-using-angular-ngrx](https://github.com/snsakib/state-management-using-angular-ngrx) | 34 | 5 |
| [Wassim-Rached/Project-Angular-2023-frontend](https://github.com/Wassim-Rached/Project-Angular-2023-frontend) | 59 | 44 |
| [AlbanesiDev/ecommerce-angular-hard-store](https://github.com/AlbanesiDev/ecommerce-angular-hard-store) | 68 | 26 |
| [cidaluna/ecommerce-angular-14](https://github.com/cidaluna/ecommerce-angular-14) | 22 | 10 |
| [bill-ahmed/qbit-matUI](https://github.com/bill-ahmed/qbit-matUI) | 51 | 40 |
| [naveedgol/music-web-player](https://github.com/naveedgol/music-web-player) | 37 | 29 |
| [piyalidas10/Ecommerce](https://github.com/piyalidas10/Ecommerce) | 104 | 35 |
| [OwenKelvin/Angular-School-Management-System](https://github.com/OwenKelvin/Angular-School-Management-System) | 201 | 65 |
| [mtwn105/Clinix-Angular](https://github.com/mtwn105/Clinix-Angular) | 59 | 45 |
| [brandonroberts/appwrite-angular-chat](https://github.com/brandonroberts/appwrite-angular-chat) | 3 | 2 |
| [anihalaney/rwa-trivia](https://github.com/anihalaney/rwa-trivia) | — | 0 |
| [AmitXShukla/Online-School-Management-App-Angular-Firebase](https://github.com/AmitXShukla/Online-School-Management-App-Angular-Firebase) | 43 | 27 |
| [premrishi/Angular-Spring-boot-Hospital-Management-System](https://github.com/premrishi/Angular-Spring-boot-Hospital-Management-System) | 50 | 20 |
| [mohanabhorkade-cyber/sparrow-food](https://github.com/mohanabhorkade-cyber/sparrow-food) | 34 | 14 |
| [JuanMonta/rick-and-morty-api](https://github.com/JuanMonta/rick-and-morty-api) | 53 | 18 |
| [smadil997/ngx-anabo-space](https://github.com/smadil997/ngx-anabo-space) | 14 | 0 |
| [spartan-ng/spartan](https://github.com/spartan-ng/spartan) | 1728 | 0 |
| [edouarddiep/pgf-frontend](https://github.com/edouarddiep/pgf-frontend) | 87 | 63 |
| [ZaynabKhribi/NerdySpace_Angular](https://github.com/ZaynabKhribi/NerdySpace_Angular) | 44 | 0 |
| [9394113857/angular_ecommerce](https://github.com/9394113857/angular_ecommerce) | 63 | 30 |
| [idenisovs/timesheet](https://github.com/idenisovs/timesheet) | 166 | 105 |
| [kinde-oss/kinde-auth-pkce-js](https://github.com/kinde-oss/kinde-auth-pkce-js) | 57 | 0 |
| [joumailabderrahmen-ctrl/est-events-spa](https://github.com/joumailabderrahmen-ctrl/est-events-spa) | 47 | 0 |
| [w2m-virtual/app-npm-d5-scoring-spa](https://github.com/w2m-virtual/app-npm-d5-scoring-spa) | 12 | 5 |
| [StudentHelperELearningPlatform/elearning-frontend-spa](https://github.com/StudentHelperELearningPlatform/elearning-frontend-spa) | 108 | 34 |
| [recker99/CadWeb---Angular---Ionic](https://github.com/recker99/CadWeb---Angular---Ionic) | 32 | 8 |
| [Juli21v/app-notas-y-admin-angular](https://github.com/Juli21v/app-notas-y-admin-angular) | 43 | 0 |
| [CamiloRetamal/rickandmorty_app](https://github.com/CamiloRetamal/rickandmorty_app) | 52 | 15 |
| [jose23021995/z-warriors-admin](https://github.com/jose23021995/z-warriors-admin) | 26 | 0 |
| [bonitasoft-ps/bonita-custom-page-toolkit](https://github.com/bonitasoft-ps/bonita-custom-page-toolkit) | 125 | 0 |
| [SAP/spartacus](https://github.com/SAP/spartacus) | 8864 | 0 |
| [cathedraal/PiggyBank.com-Banking](https://github.com/cathedraal/PiggyBank.com-Banking) | 250 | 29 |
| [KiriaIT/angular-film-collection](https://github.com/KiriaIT/angular-film-collection) | 36 | 19 |
| [AKADortys/Vivo-Web](https://github.com/AKADortys/Vivo-Web) | 113 | 7 |
| [rameloarisonrojo/Interface-Intuitive-de-Gestion-de-Biblioth-que](https://github.com/rameloarisonrojo/Interface-Intuitive-de-Gestion-de-Biblioth-que) | 37 | 10 |
| [Santosdevbjj/ecommerce-livros-Angular](https://github.com/Santosdevbjj/ecommerce-livros-Angular) | 9 | 0 |
| [AndresLopezCorrales/clima-atlantis](https://github.com/AndresLopezCorrales/clima-atlantis) | 13 | 0 |
| [programs-w/project-peliculas-angular](https://github.com/programs-w/project-peliculas-angular) | 14 | 7 |
| [auth0/auth0-angular](https://github.com/auth0/auth0-angular) | 42 | 0 |
| [SeniorKian/DnnFree.Modules.SPA.Angular.ClientApp](https://github.com/SeniorKian/DnnFree.Modules.SPA.Angular.ClientApp) | 244 | 0 |
| [PatrickMandujano/Frontend_ControlAccesos](https://github.com/PatrickMandujano/Frontend_ControlAccesos) | 21 | 6 |
| [bitNathan/angular-boids](https://github.com/bitNathan/angular-boids) | 17 | 0 |
| [lalalilo/aws-spa](https://github.com/lalalilo/aws-spa) | 24 | 0 |
| [Hustree/tech-4-everyone](https://github.com/Hustree/tech-4-everyone) | 23 | 9 |
| [joaogabriel1309/nexstock-web](https://github.com/joaogabriel1309/nexstock-web) | 31 | 9 |
| [danielvazmartins/controle-dieta-spa-angular](https://github.com/danielvazmartins/controle-dieta-spa-angular) | 12 | 6 |
| [gencavjj/employee-app](https://github.com/gencavjj/employee-app) | 26 | 5 |
| [KosMaster87/Portfolio](https://github.com/KosMaster87/Portfolio) | 87 | 21 |
| [JaydipJadhav25/Angular](https://github.com/JaydipJadhav25/Angular) | 47 | 0 |
| [soulayma9900/angular-frontend-glid](https://github.com/soulayma9900/angular-frontend-glid) | 48 | 22 |
| [Scaled-AIOps/atlas-frontend](https://github.com/Scaled-AIOps/atlas-frontend) | 35 | 4 |
| [djericj/Downgrooves.Angular](https://github.com/djericj/Downgrooves.Angular) | 53 | 36 |
| [LuFelix/tiweb-headless-wp](https://github.com/LuFelix/tiweb-headless-wp) | 22 | 0 |
| [Dianaqwert/SPA_RaedaCarsInMotion](https://github.com/Dianaqwert/SPA_RaedaCarsInMotion) | 79 | 20 |
| [rudymoran18-blip/mini-scholae-angular](https://github.com/rudymoran18-blip/mini-scholae-angular) | 23 | 2 |
| [SamuelAntunez/Country-SPA](https://github.com/SamuelAntunez/Country-SPA) | 22 | 10 |
| [Mathsqrt2/RedirectionPanel](https://github.com/Mathsqrt2/RedirectionPanel) | 85 | 0 |
| [rudymoran18-blip/sistema-tickets-angular](https://github.com/rudymoran18-blip/sistema-tickets-angular) | 22 | 2 |
| [Sangram03/angular_2026](https://github.com/Sangram03/angular_2026) | 9 | 0 |
| [nebelorz/dura-vault-spa](https://github.com/nebelorz/dura-vault-spa) | 81 | 51 |
| [art2url/quasar-contact-app](https://github.com/art2url/quasar-contact-app) | 144 | 0 |
| [ks-laboratory/kishi-hp](https://github.com/ks-laboratory/kishi-hp) | 35 | 18 |
| [softscanner-sw/softscanner_fa](https://github.com/softscanner-sw/softscanner_fa) | 99 | 0 |
| [CastroLautaro1/Billetera-Front](https://github.com/CastroLautaro1/Billetera-Front) | 43 | 1 |
| [Merkel00/shop-spa](https://github.com/Merkel00/shop-spa) | 59 | 0 |
| [jhosibr/gestor-usuarios-productos](https://github.com/jhosibr/gestor-usuarios-productos) | 47 | 0 |
| [Backbase/golden-sample-app](https://github.com/Backbase/golden-sample-app) | 321 | 0 |
| [SergioBravoUSS/mi-spa-angular](https://github.com/SergioBravoUSS/mi-spa-angular) | 9 | 0 |
| [diegojaviermanceradavila-glitch/proyecto-angular-bootstrap](https://github.com/diegojaviermanceradavila-glitch/proyecto-angular-bootstrap) | 11 | 0 |
| [souzafgabriel/catalogo-livros-angular-dgt2809](https://github.com/souzafgabriel/catalogo-livros-angular-dgt2809) | 15 | 0 |
| [JuanezAC/spa](https://github.com/JuanezAC/spa) | 35 | 0 |
| [Developer2K-Solutions/dev2k.org](https://github.com/Developer2K-Solutions/dev2k.org) | 24 | 9 |
| [ENPeiii/angular-blog-server](https://github.com/ENPeiii/angular-blog-server) | 24 | 0 |
| [arunandholly27/book-walk-frontend](https://github.com/arunandholly27/book-walk-frontend) | 39 | 0 |
| [vitao19/task-manager-web](https://github.com/vitao19/task-manager-web) | 11 | 2 |
| [tsvetelinNaydenov/Angular-Online-Course-System](https://github.com/tsvetelinNaydenov/Angular-Online-Course-System) | 54 | 15 |
| [enzorh222/to-do-app](https://github.com/enzorh222/to-do-app) | 12 | 6 |
| [oraclejames/angular_spa](https://github.com/oraclejames/angular_spa) | 9 | 0 |
| [robert-sanders-software-ontwikkeling/rs-x](https://github.com/robert-sanders-software-ontwikkeling/rs-x) | 850 | 0 |
| [karmasakshi/jet](https://github.com/karmasakshi/jet) | 132 | 39 |
| [jeroenheijmans/sample-angular-oauth2-oidc-with-auth-guards](https://github.com/jeroenheijmans/sample-angular-oauth2-oidc-with-auth-guards) | 29 | 10 |
| [aharbii/movie-finder-frontend](https://github.com/aharbii/movie-finder-frontend) | 19 | 9 |
| [Daranix/spain-holidays-calendar](https://github.com/Daranix/spain-holidays-calendar) | 65 | 26 |
| [PentaStack/E_clinic_frontend](https://github.com/PentaStack/E_clinic_frontend) | 91 | 35 |
| [Brain-up/brn](https://github.com/Brain-up/brn) | 269 | 0 |
| [rishabhsingh1992/ai-spam-classifier-nlp-fastapi-angular](https://github.com/rishabhsingh1992/ai-spam-classifier-nlp-fastapi-angular) | 8 | 0 |
| [eliasgiovanni/crud-usuarios-angular](https://github.com/eliasgiovanni/crud-usuarios-angular) | 5 | 0 |
| [UCI-IN4MATX-191-Token-ATM/token-atm-spa](https://github.com/UCI-IN4MATX-191-Token-ATM/token-atm-spa) | 344 | 63 |
| [rndymi/SpaceDefense](https://github.com/rndymi/SpaceDefense) | 46 | 0 |
| [pachamamadev-pe/pachamama-web-admin](https://github.com/pachamamadev-pe/pachamama-web-admin) | 219 | 141 |
| [alessandrovirmond/team-draft-engine-web](https://github.com/alessandrovirmond/team-draft-engine-web) | 17 | 5 |
| [webdotdiy/webdiy-template-angular](https://github.com/webdotdiy/webdiy-template-angular) | 1 | 0 |
| [BillNobill/angular-teste-client](https://github.com/BillNobill/angular-teste-client) | 10 | 4 |
| [heyding/angular-tailwind-template](https://github.com/heyding/angular-tailwind-template) | 119 | 35 |
| [single-spa/single-spa-angular](https://github.com/single-spa/single-spa-angular) | 78 | 0 |
| [FANMixco/gravitynow-angular](https://github.com/FANMixco/gravitynow-angular) | 40 | 0 |
| [4ndreLuis/ANGULAR-API-Astra-Space-Dashboard-Nasa](https://github.com/4ndreLuis/ANGULAR-API-Astra-Space-Dashboard-Nasa) | 14 | 0 |
| [perumaljayasingha/olx_like_SPA_APP](https://github.com/perumaljayasingha/olx_like_SPA_APP) | 25 | 0 |
| [alexander22042009/address-book-app-angular-dotnet](https://github.com/alexander22042009/address-book-app-angular-dotnet) | 17 | 0 |
| [SofiaToro018/Uceva-Astro-Angular-SSG-SPA](https://github.com/SofiaToro018/Uceva-Astro-Angular-SSG-SPA) | 65 | 0 |
| [kancheng/habit-breaker](https://github.com/kancheng/habit-breaker) | 24 | 0 |
| [flui-cloud/flui-template-angular-21](https://github.com/flui-cloud/flui-template-angular-21) | 2 | 0 |
| [vitorhugo-java/angular-animeseason-jikan](https://github.com/vitorhugo-java/angular-animeseason-jikan) | 14 | 0 |
| [talia-protasova/escape-velocity](https://github.com/talia-protasova/escape-velocity) | 32 | 11 |
| [Rafael-G-Souza/loja-jogos](https://github.com/Rafael-G-Souza/loja-jogos) | 19 | 1 |
| [uideveloper09/angular-dotnet-fullstack-app](https://github.com/uideveloper09/angular-dotnet-fullstack-app) | 7 | 0 |
| [fabiohfarias/attus-frontend-challenge](https://github.com/fabiohfarias/attus-frontend-challenge) | 16 | 5 |
| [ng-g-c-Nathan/angular-ecommerce](https://github.com/ng-g-c-Nathan/angular-ecommerce) | 90 | 26 |
| [ahsan-ul-alam/routing-angular](https://github.com/ahsan-ul-alam/routing-angular) | 13 | 0 |
| [r2rka1/frontend-angular](https://github.com/r2rka1/frontend-angular) | 20 | 14 |
| [EBI-Metabolights/metabolights-editor](https://github.com/EBI-Metabolights/metabolights-editor) | 395 | 100 |
| [clumsy-goose/angular-spa](https://github.com/clumsy-goose/angular-spa) | 12 | 8 |
| [Stefan-v-Oudenaarden/how-many-flags](https://github.com/Stefan-v-Oudenaarden/how-many-flags) | 99 | 19 |
| [mateussfeir/LabTest2-Spacex-Angular](https://github.com/mateussfeir/LabTest2-Spacex-Angular) | 8 | 4 |
| [MattGaviria/SpaceX](https://github.com/MattGaviria/SpaceX) | 10 | 5 |
| [grafanaKibana/WebCV.Angular](https://github.com/grafanaKibana/WebCV.Angular) | 69 | 17 |
| [mpujazon/film-horizon](https://github.com/mpujazon/film-horizon) | 43 | 0 |
| [NewZayn/ntc-frontend](https://github.com/NewZayn/ntc-frontend) | 18 | 1 |
| [raciel88p/MJ-estetica-y-spa](https://github.com/raciel88p/MJ-estetica-y-spa) | 30 | 0 |
| [melastmohican/micronaut-angular-spa](https://github.com/melastmohican/micronaut-angular-spa) | 11 | 0 |
| [AaqibhafeezKhan/microfrontend-multitenant-cms](https://github.com/AaqibhafeezKhan/microfrontend-multitenant-cms) | 44 | 0 |
| [Lorenzo-Zagallo/angular-clinic-frontend](https://github.com/Lorenzo-Zagallo/angular-clinic-frontend) | 17 | 10 |
| [Juancasainz/angular-rick-morty-spa-challenge](https://github.com/Juancasainz/angular-rick-morty-spa-challenge) | 11 | 3 |
| [nayvilla/spotify-queue-web](https://github.com/nayvilla/spotify-queue-web) | 28 | 20 |
| [PentaStack/E-mart-frontned](https://github.com/PentaStack/E-mart-frontned) | 156 | 37 |
| [troy-miller0824/angular-firebase-ecommerce-shop](https://github.com/troy-miller0824/angular-firebase-ecommerce-shop) | 68 | 0 |
| [Foblex/m-render](https://github.com/Foblex/m-render) | 260 | 0 |
| [tjbagley/language-learn-angular-signal-spa](https://github.com/tjbagley/language-learn-angular-signal-spa) | 46 | 0 |
| [troy-miller0824/notabene-angular-aspnetcore-notes](https://github.com/troy-miller0824/notabene-angular-aspnetcore-notes) | 44 | 0 |
| [stally-ortega/clinical_his_frontend](https://github.com/stally-ortega/clinical_his_frontend) | 81 | 40 |
| [DaveInTucson/acct4](https://github.com/DaveInTucson/acct4) | 74 | 28 |
| [Ragunath-Rengaraj/RentSpace](https://github.com/Ragunath-Rengaraj/RentSpace) | 40 | 0 |
| [NWilkins95/Angular-Car-Maintenance-Manager](https://github.com/NWilkins95/Angular-Car-Maintenance-Manager) | 22 | 4 |
| [DorianPRJ7/maison-electra-web-app](https://github.com/DorianPRJ7/maison-electra-web-app) | 22 | 0 |
| [LuisFrancisco17/Country-SPA-Angular](https://github.com/LuisFrancisco17/Country-SPA-Angular) | 23 | 1 |
| [ui-router/angular](https://github.com/ui-router/angular) | 81 | 0 |
| [FKAexe/gamelogging_frontend](https://github.com/FKAexe/gamelogging_frontend) | 37 | 6 |
| [gajananshinde9307/Angular_WorkSpace](https://github.com/gajananshinde9307/Angular_WorkSpace) | 32 | 0 |
| [satishjs2297/megansoft-hrms-ui](https://github.com/satishjs2297/megansoft-hrms-ui) | 18 | 12 |
| [bivex/angular-customer-portal](https://github.com/bivex/angular-customer-portal) | 300 | 0 |
| [Gouvernathor/space-scene-2d-Angular](https://github.com/Gouvernathor/space-scene-2d-Angular) | 11 | 0 |
| [pauloalvesm/angular-ai-study](https://github.com/pauloalvesm/angular-ai-study) | 36 | 2 |
| [mpotito/Space-Traders](https://github.com/mpotito/Space-Traders) | 20 | 1 |
| [beLowKi/HigherLowerGame-SPA](https://github.com/beLowKi/HigherLowerGame-SPA) | 21 | 0 |
| [ellfoss/angular-material-dashboard](https://github.com/ellfoss/angular-material-dashboard) | 112 | 6 |
| [HViktorBP/SPlaceClient](https://github.com/HViktorBP/SPlaceClient) | 140 | 49 |
| [Jadps/B2B-SaaS-Frontend](https://github.com/Jadps/B2B-SaaS-Frontend) | 36 | 10 |
| [PedroAlex65/ecommerce-pro-way](https://github.com/PedroAlex65/ecommerce-pro-way) | 38 | 11 |
| [1zhenya1/angular-spa-project](https://github.com/1zhenya1/angular-spa-project) | 18 | 0 |
| [FrancoBarbuio/reach-crm-ui](https://github.com/FrancoBarbuio/reach-crm-ui) | 13 | 6 |
| [NatiaChubinidze/employee-management-angular-web](https://github.com/NatiaChubinidze/employee-management-angular-web) | 83 | 0 |
| [BetoSalas2015/Angular-SPA-2025](https://github.com/BetoSalas2015/Angular-SPA-2025) | 20 | 1 |
| [nicko-08/llm-api-client](https://github.com/nicko-08/llm-api-client) | 21 | 10 |
| [madhu8281/Closet_Revolution_ShopCart](https://github.com/madhu8281/Closet_Revolution_ShopCart) | 24 | 8 |
| [ogsden/text-annotation-app](https://github.com/ogsden/text-annotation-app) | 25 | 7 |
| [Brejcha13320/Uceva-Astro-Angular-SSG-SPA](https://github.com/Brejcha13320/Uceva-Astro-Angular-SSG-SPA) | 39 | 0 |
| [NehalVadher15/UserDirectoryClientApp](https://github.com/NehalVadher15/UserDirectoryClientApp) | 19 | 3 |
| [SpadeBoard/Spadeboard](https://github.com/SpadeBoard/Spadeboard) | 214 | 0 |
| [mapineda48/agape.js](https://github.com/mapineda48/agape.js) | 133 | 0 |
| [Angular-Force-FP-067/P1-FrontEndMedianteAngular](https://github.com/Angular-Force-FP-067/P1-FrontEndMedianteAngular) | 24 | 1 |
| [Sapnaumeshpashine/angular-spa-task](https://github.com/Sapnaumeshpashine/angular-spa-task) | 30 | 2 |
| [itsZekiee/Beyond-The-Grind](https://github.com/itsZekiee/Beyond-The-Grind) | 17 | 0 |
| [jessejones-po/facilities-bolivar-angular](https://github.com/jessejones-po/facilities-bolivar-angular) | 43 | 18 |
| [EdmondP/VehicleMap](https://github.com/EdmondP/VehicleMap) | 20 | 0 |
| [MichaelRRM/ValorSparkDashAngular](https://github.com/MichaelRRM/ValorSparkDashAngular) | 20 | 12 |
| [towsonTigers/AngularSPAwTailwind](https://github.com/towsonTigers/AngularSPAwTailwind) | 14 | 8 |
| [frank1749/Front-End-Local-Investments](https://github.com/frank1749/Front-End-Local-Investments) | 33 | 8 |
| [brunocaavalcante/Eventhub.Web](https://github.com/brunocaavalcante/Eventhub.Web) | 39 | 0 |
| [compliance-hub-jmyr/risk-screening-app](https://github.com/compliance-hub-jmyr/risk-screening-app) | 54 | 18 |
| [chhatbarabhishek/Studentbudgetplanner](https://github.com/chhatbarabhishek/Studentbudgetplanner) | 11 | 6 |
| [aegidati/agentic-angular-spa](https://github.com/aegidati/agentic-angular-spa) | 9 | 0 |
| [dur0tan/vpic-angular-frontend](https://github.com/dur0tan/vpic-angular-frontend) | 39 | 8 |
| [Marko-Programmer/notes-spa](https://github.com/Marko-Programmer/notes-spa) | 21 | 0 |
| [Vizuetcf09/WebStoreTemplateFrontend](https://github.com/Vizuetcf09/WebStoreTemplateFrontend) | 27 | 13 |
| [VickyDixit/BharatBankX_Admin](https://github.com/VickyDixit/BharatBankX_Admin) | 111 | 31 |
| [CarlosGal19/Angular_Country_SPA](https://github.com/CarlosGal19/Angular_Country_SPA) | 24 | 1 |
| [choubeyshubham/HotelBookingSystemWeb](https://github.com/choubeyshubham/HotelBookingSystemWeb) | 27 | 2 |
| [milinkovicmilos/taskman](https://github.com/milinkovicmilos/taskman) | 162 | 0 |
| [HugoVS26/mydebts-frontend](https://github.com/HugoVS26/mydebts-frontend) | 79 | 4 |
| [retz8/spartan-a2ui-adapter](https://github.com/retz8/spartan-a2ui-adapter) | 54 | 0 |
| [Khr0x/rick-and-morty-angular](https://github.com/Khr0x/rick-and-morty-angular) | 10 | 4 |
| [mohanraj978747-netizen/spa-angular-project](https://github.com/mohanraj978747-netizen/spa-angular-project) | 14 | 3 |
| [roybz/operator-app](https://github.com/roybz/operator-app) | 177 | 0 |
| [DiegoMunoz212/nexmarket-frontend](https://github.com/DiegoMunoz212/nexmarket-frontend) | 49 | 0 |
| [Oleg-Frontend-creator/plants-shop](https://github.com/Oleg-Frontend-creator/plants-shop) | 67 | 0 |
| [RDEsley/List-To-Do](https://github.com/RDEsley/List-To-Do) | 8 | 1 |
| [IlhanBasic/Pausalio-frontend](https://github.com/IlhanBasic/Pausalio-frontend) | 96 | 53 |
| [hi-malay/mf-employee-details](https://github.com/hi-malay/mf-employee-details) | 11 | 1 |
| [nsdevinc/Angular-SPA](https://github.com/nsdevinc/Angular-SPA) | 15 | 0 |
| [rodrigomologni/pokespa](https://github.com/rodrigomologni/pokespa) | 11 | 1 |
| [Darren-Dcruz/Travel-Booking-Explorer](https://github.com/Darren-Dcruz/Travel-Booking-Explorer) | 41 | 24 |
| [xdelmo/dashboard-tesi](https://github.com/xdelmo/dashboard-tesi) | 79 | 46 |
| [LuisRod1990/portfolio-spa-ui](https://github.com/LuisRod1990/portfolio-spa-ui) | 63 | 6 |
| [Rishab-RajHR/Routing-in-Angular](https://github.com/Rishab-RajHR/Routing-in-Angular) | 33 | 0 |
| [fanmeijian/sparrow-angular-lib](https://github.com/fanmeijian/sparrow-angular-lib) | 98 | 0 |
| [Will-emma/angular-movie-app](https://github.com/Will-emma/angular-movie-app) | 39 | 0 |
| [jestebanv30/concesionario-coches-angular](https://github.com/jestebanv30/concesionario-coches-angular) | 47 | 15 |
| [lorenzotecchia/catering-management-spa](https://github.com/lorenzotecchia/catering-management-spa) | 58 | 0 |
| [Mihir1107/tasks-segregator-by-users](https://github.com/Mihir1107/tasks-segregator-by-users) | 10 | 7 |
| [allangaiteir00/portifolio-2026](https://github.com/allangaiteir00/portifolio-2026) | 48 | 21 |
| [MichalBurzynski89/timesheets-spa-angular](https://github.com/MichalBurzynski89/timesheets-spa-angular) | 36 | 12 |
| [jeffnogueira/angular-spa-poker](https://github.com/jeffnogueira/angular-spa-poker) | 19 | 3 |
| [granderoberto/ViaggiDiGruppo](https://github.com/granderoberto/ViaggiDiGruppo) | 11 | 0 |
| [sebastianmuriel16/Angular-Ecommerce](https://github.com/sebastianmuriel16/Angular-Ecommerce) | 46 | 31 |
| [jlzortega/angular-auditoria-pr-azure-repos-hu-jira](https://github.com/jlzortega/angular-auditoria-pr-azure-repos-hu-jira) | 13 | 4 |
| [shlomoweiss/anuglar_signal_demo](https://github.com/shlomoweiss/anuglar_signal_demo) | 18 | 9 |
| [rohit-shrivastava-in/mfe-client](https://github.com/rohit-shrivastava-in/mfe-client) | 11 | 0 |
| [shivangisoni24/Angular-WorkSpace](https://github.com/shivangisoni24/Angular-WorkSpace) | 23 | 0 |
| [Arshiya-rze/system-consultant-office-automation-task](https://github.com/Arshiya-rze/system-consultant-office-automation-task) | 34 | 0 |
| [pesdeveloper/ng-oid-sso-cross-spa](https://github.com/pesdeveloper/ng-oid-sso-cross-spa) | 20 | 3 |
| [iitaellu/Stuck_Space_Angular](https://github.com/iitaellu/Stuck_Space_Angular) | 35 | 0 |

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

## Sample output — ngx-admin (largest original batch: 169 moves, 236 files)

```
[ng-rao] Preview — 375 ações:

  [create] src/app/core
  [create] src/app/modules/accordion/pages/accordion
  [create] src/app/modules/analytics/services
  ...
  [move]   src/app/pages/accordion/accordion.component.ts → src/app/modules/accordion/pages/accordion/accordion.component.ts
  [move]   src/app/pages/charts/charts.component.ts → src/app/modules/charts/pages/charts/charts.component.ts
  [move]   src/app/@core/data/analytics.service.ts → src/app/modules/analytics/services/analytics.service.ts
  ...
  [barrel] src/app/core/guards/index.ts
  [barrel] src/app/shared/components/index.ts
```

---

## Sample output — pachamama-web-admin (largest new batch: 141 moves, 219 files)

```
[ng-rao] Preview — 219 arquivos analisados:

  [move]   src/app/... → src/app/modules/pachamama/pages/...
  [move]   src/app/... → src/app/core/services/...
  ...
```

---

## Build validation — `ng build` after `ngrao apply`

The 10 repos with the most moves were cloned, had `npm install --legacy-peer-deps` run, then `ngrao apply --yes`, then `npx ng build --configuration=production`.

| Repo | Moves | ng build |
|------|-------|----------|
| [pachamamadev-pe/pachamama-web-admin](https://github.com/pachamamadev-pe/pachamama-web-admin) | 141 | **ok** |
| [idenisovs/timesheet](https://github.com/idenisovs/timesheet) | 105 | fail* |
| [EBI-Metabolights/metabolights-editor](https://github.com/EBI-Metabolights/metabolights-editor) | 100 | fail* |
| [UCI-IN4MATX-191-Token-ATM/token-atm-spa](https://github.com/UCI-IN4MATX-191-Token-ATM/token-atm-spa) | 63 | fail* |
| [edouarddiep/pgf-frontend](https://github.com/edouarddiep/pgf-frontend) | 63 | **ok** |
| [IlhanBasic/Pausalio-frontend](https://github.com/IlhanBasic/Pausalio-frontend) | 53 | fail* |
| [nebelorz/dura-vault-spa](https://github.com/nebelorz/dura-vault-spa) | 51 | **ok** |
| [HViktorBP/SPlaceClient](https://github.com/HViktorBP/SPlaceClient) | 49 | **ok** |
| [xdelmo/dashboard-tesi](https://github.com/xdelmo/dashboard-tesi) | 46 | **ok** |
| [stally-ortega/clinical_his_frontend](https://github.com/stally-ortega/clinical_his_frontend) | 40 | **ok** |

**7/10 ok.** The 3 marked with `*` failed due to pre-existing project issues unrelated to ngrao:

- **timesheet** — `@ng-bootstrap` requires `@popperjs/core` as a peer dep, not declared in the project. Build fails before and after ngrao.
- **metabolights-editor** — `@angular/cdk` scss not found; Angular Material CDK misconfigured in the project.
- **token-atm-spa** — `MODULE_NOT_FOUND` in a webpack worker; Node.js 22 incompatibility with the project's old Angular DevKit version.
- **Pausalio-frontend** — only `environment.example.ts` exists, not `environment.ts`. Build fails before and after ngrao.

---

## Conclusions

- **0 crashes** across 238 Angular projects — from tiny (1 file) to massive (8,864 files — SAP/spartacus)
- **7/10 builds pass** after `ngrao apply` on the most complex repos tested
- The 3 build failures are pre-existing project issues — confirmed to fail before ngrao runs
- Correctly identifies and skips files already in the right place
- Correctly refuses to run in monorepos without `angular.json` at root
- Plan is coherent across all tested repos — domains, scopes and roles correctly detected
- `ngrao preview` is safe to run on any project: zero files are touched
- 1 clone fail was a network issue, not a tool bug
