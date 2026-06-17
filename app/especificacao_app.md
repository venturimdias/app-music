### 1. Visão geral
App para gerenciar uma biblioteca de músicas cifradas liturgicas e montar playlists para ser compatilhado com toda a equipe.

### 2. Stack / Restrições
- Frontend: React + Vite + TypeScript + Tailwind + axios (pasta `frontend/`); transposição via `utils/cifra.ts` próprio (não usa chord-transposer — a lib corromperia letras maiúsculas)
- Backend: NestJS + TypeScript + SQLite via TypeORM (pasta `backend/`)
- Autenticação por JWT, armazenado em cookie httpOnly (sem header Bearer no front).

### 3. Funcionalidades

#### 3.1 Autenticação
- Usuário se cadastra com nome, email e senha.
- Regras de senha (validadas em backend e frontend):
  - mínimo 8 caracteres
  - ao menos 1 letra maiúscula
  - ao menos 1 letra minúscula
  - ao menos 2 números
  - ao menos 1 caractere especial (não alfanumérico)
  - senha guardada com hash (bcrypt)
- Perfil no cadastro: o PRIMEIRO usuário cadastrado no sistema recebe o perfil ADM;
  todos os cadastros seguintes recebem PARTICIPANTE.
- Login define o JWT (válido por 24h) em cookie httpOnly.
- Erro: email já existe → 409 "Email já cadastrado".

#### 3.2 Perfil do Usuário
Após fazer a modelagem do banco, cadastre os perfis: ADM e PARTICIPANTE

##### 3.2.1 Perfil ADM
- Usuário com perfil ADM pode cadastrar, editar, deletar e listar as seguintes tabelas: música, tempo, momento, artista, usuário e perfil.
- Regras: campos obrigatórios conforme o modelo de dados.
- Erro: campo obrigatório vazio → 400 com a lista de campos faltando.
- Página que pode acessar: `/usuario`, `/perfil`, `/tempo`, `/momento`, `/artista`, `/songs`, `/songs/new`, `/songs/:id`, `/songs/:id/edit`, `/playlists`, `/playlists/:id`, `/lista-repertorio/:slug`


##### 3.2.2 Perfil PARTICIPANTE
- O usuário pode criar conta, listar as músicas, trocar o tom das músicas e organizar playlists. Quando troca o tom de uma música, o tom escolhido é armazenado na tabela SongTom.
- As músicas são acessíveis a todos os usuários.
- A playlist só pode ser editada pelo usuário que a criou.
- A playlist é pública e pode ser acessada de forma externa, pelo slug `[usuarioId]-[guid]` (guid gerado pelo sistema) e por uma senha gerada pelo sistema com 5 caracteres alfanuméricos (números e letras), armazenada em texto puro.
- Páginas que pode acessar: `/songs`, `/songs/:id`, `/playlists`, `/playlists/:id`, `/lista-repertorio/:slug`

#### 3.3 Cadastro de músicas
- A tela de inserir/editar usa `utils/cifra.ts` (transpositor próprio).
- Campos do formulário: Titulo, Tom, Cifra (URL da cifra original), Video, Slide,
  Tempo (vários), Momento (vários), Artista (máx. 3).
- A `descricao` é um `<textarea>` de TEXTO PURO, com os acordes marcados entre colchetes
  `[Acorde]` (ou chaves duplas `{{Acorde}}`). Ex.:
      [F]        [Bb]      [Dm]
      Lembra, Senhor, o teu amor fiel
- A tela divide-se em duas seções:
  - Seção 1 (editar): o textarea acima.
  - Seção 2 (visualizar): botões com os tons [C, C#, D, D#, E, F, F#, G, G#, A, Bb, B];
    ao clicar, o chord-transposer transpõe o texto todo (`transpose(texto).toKey(tom)`),
    e a visualização renderiza com os acordes destacados (colchetes viram `<span>`).

#### 3.4 Playlists
- Toda Playlist é pública
- Usuário cria playlist com nome, data e descrição opcional.
- Usuário acessa a playlist é necessário exibir a url e a senha gerada para compartilhar com a equipe.
- Adiciona/remove músicas da playlist.
- Ao exibir as músicas da playlist, cada uma aparece já com o tom salvo do dono da
  playlist (SongTom de playlist.userId + songId); sem SongTom, usa o tom original da música.
- Regras: nome obrigatório; uma música pode estar em várias playlists;
  não pode adicionar a mesma música 2x na mesma playlist.
- O perfil do usuário pode limitar o número de músicas por playlist
  (ex.: perfil DEMO = 4). Ver seção 13.



### 4. Modelo de dados

**User**
- `id`: number (PK)
- `nome`: string
- `email`: string (único)
- `passwordHash`: string
- `createdAt`: datetime
- `perfilId` : number (FK -> Perfil)

**Perfil**
- `id`: number (PK)
- `titulo`: string
- `max_songs_per_playlist`: number | null   // limite de músicas por playlist; null = sem limite (ver seção 13)

**Tempo**  
- `id`: number (PK)
- `titulo`: string (obrigatório)
- `descricao`: string (opcional) 

**Momento**  
- `id`: number (PK)
- `titulo`: string (obrigatório)
- `descricao`: string (opcional) 

**Artista** 
- `id`: number (PK)
- `titulo`: string (obrigatório)
- `descricao`: string (opcional) 

**Song**
- `id`: number (PK)
- `titulo`: string (obrigatório)
- `tom`: string (obrigatório)        // tom original; um de [C, C#, D, D#, E, F, F#, G, G#, A, Bb, B]
- `cifra`: string (opcional)         // URL da cifra original
- `video`: string (opcional)
- `slide`: string (opcional)
- `descricao` : string (obrigatório) // texto puro com acordes em [..]/{{..}}; transposto pelo chord-transposer
- `createdAt`: datetime
- (Tempo, Momento e Artista são N:N — ver tabelas de junção abaixo)

**SongTempo** (relação N:N)
- `songId`: number (FK -> Song)
- `tempoId`: number (FK -> Tempo)

**SongMomento** (relação N:N)
- `songId`: number (FK -> Song)
- `momentoId`: number (FK -> Momento)

**SongArtista** (relação N:N — máx. 3 artistas por música, validado no backend)
- `songId`: number (FK -> Song)
- `artistaId`: number (FK -> Artista)

**SongTom**  (tom escolhido por usuário, por música — único por par userId+songId)
- `id`: number (PK)
- `userId`: number (FK -> User)
- `songId`: number (FK -> Song)
- `tom`: string (obrigatório)
- Regra: ao exibir uma música dentro de uma playlist, usa-se o SongTom do DONO da
  playlist (playlist.userId + songId); se não houver registro, usa o tom original da Song.

**Playlist**
- `id`: number (PK)
- `nome`: string (obrigatório)
- `data`: datetime (obrigatório)
- `descricao`: string (opcional)
- `senha`: string (obrigatório)      // texto puro, gerado pelo sistema com números e letras
- `slug` : string (obrigatório)      // formato [usuarioId]-[guid], gerado pelo sistema
- `userId`: number (FK -> User)
- `createdAt`: datetime

**PlaylistSong** (relação N:N — único por par (playlistId, songId), sem música repetida)
- `playlistId`: number (FK -> Playlist)
- `songId`: number (FK -> Song)
- `ordem`: number (obrigatório)       // ordem da música dentro da playlist (repertório)

### 5. API (endpoints)

```
POST /auth/register
  body: { nome, email, password, recaptchaToken }   // reCAPTCHA v3 — ver seção 12
  resposta 201: define o JWT em cookie httpOnly e retorna { id, nome, email, perfilId }
                // o cadastro já autentica (não faz um 2º login) — ver 12.3

POST /auth/login
  body: { email, password, recaptchaToken }          // reCAPTCHA v3 — ver seção 12
  resposta 200: define o JWT em cookie httpOnly e retorna { id, nome, email, perfilId }

PUT  /auth/password             (autenticado) -> usuário troca a PRÓPRIA senha
  body: { currentPassword, newPassword }   // newPassword segue as regras de senha (3.1)
  resposta 200: { ok: true }
  401 "Senha atual incorreta"  |  400 "A nova senha deve ser diferente da atual"
  // após sucesso, o frontend encerra a sessão e volta ao /login

GET    /usuario                 -> lista usuario
POST   /usuario                 -> criar usuario
  body: { nome, email, password, perfilId }
  resposta 201: { id, nome, email, perfilId }
PUT    /usuario/:id             -> edita
DELETE /usuario/:id             -> remove

GET    /perfil                 -> lista perfil
POST   /perfil                 -> criar perfil
  body: { titulo, max_songs_per_playlist? }   // limite de músicas/playlist; ausente/null = sem limite
  resposta 201: { id, titulo, max_songs_per_playlist }
PUT    /perfil/:id             -> edita
DELETE /perfil/:id             -> remove

GET    /tempo                 -> lista tempo
POST   /tempo                 -> criar tempo
  body: { titulo, descricao? }
  resposta 201: { id, titulo, descricao }
PUT    /tempo/:id             -> edita
DELETE /tempo/:id             -> remove

GET    /momento                 -> lista momento
POST   /momento                 -> criar momento
  body: { titulo, descricao? }
  resposta 201: { id, titulo, descricao }
PUT    /momento/:id             -> edita
DELETE /momento/:id             -> remove

GET    /artista                 -> lista artista
POST   /artista                 -> criar artista
  body: { titulo, descricao? }
  resposta 201: { id, titulo, descricao }
PUT    /artista/:id             -> edita
DELETE /artista/:id             -> remove

GET    /songs                 -> lista todas as músicas (compartilhadas entre todos os usuários)
GET    /songs/:id             -> retorna uma música (carrega a tela de detalhe/edição)
POST   /songs                 -> cria música
  body: { titulo, tom, cifra?, video?, slide?, descricao,
          tempoIds: number[], momentoIds: number[], artistaIds: number[] (máx. 3) }
  resposta 201: { id, titulo, tom, ... }
PUT    /songs/:id             -> edita
DELETE /songs/:id             -> remove

GET    /playlists                       -> lista as playlists do usuário logado
GET    /playlists/:id                   -> retorna uma playlist + suas músicas (ordenadas)
POST   /playlists             body: { nome, data, descricao? }   // slug e senha gerados pelo sistema
PUT    /playlists/:id         body: { nome?, data?, descricao? }  // só o dono (playlist.userId)
DELETE /playlists/:id                   -> remove a playlist (só o dono)
POST   /playlists/:id/songs   body: { songId, ordem }
  // 403 { code: 'LIMITE_MUSICAS_PERFIL', limit } se o perfil do usuário atingiu o limite (seção 13)
DELETE /playlists/:id/songs/:songId

GET    /songTom?songId=         -> tom salvo do usuário logado para a(s) música(s)
POST   /songTom                 -> salva/atualiza o tom do usuário logado p/ uma música
  body: { songId, tom }         // userId vem do token JWT, não do body
DELETE /songTom/:id

# Acesso externo à playlist (sem token, validado por senha):
POST   /lista-repertorio/:slug  -> valida a senha e retorna a playlist pública
  body: { senha }
  resposta 200: { playlist, songs[] }  |  401 se senha inválida

POST   /lista-repertorio/:slug/liturgia  -> liturgia do dia da playlist (ver seção 14)
  body: { senha }                  // mesma senha valida o acesso
  resposta 200: { data, titulo, cor, leituras[], fonte }  (normalizado, cache por data)
  503 se a fonte externa estiver indisponível e não houver cache
```

> Todos os endpoints (exceto `/auth/*` e `POST /lista-repertorio/:slug`) exigem autenticação:
> o JWT é enviado automaticamente pelo cookie httpOnly definido no login (sem header Bearer).

### 6. Layout e navegação (frontend)

O layout usa uma **sidebar fixa** no lado esquerdo (240 px), visível no desktop. No mobile há um botão hambúrguer que abre a sidebar como drawer sobreposto.

Os grupos **Cadastros** e **Administração** são **recolhíveis** (clique no cabeçalho do
grupo alterna abrir/fechar, com seta indicando o estado). A preferência de cada grupo é
lembrada no `localStorage` (`nav:cadastros` / `nav:administracao`) para sobreviver a
recarregamentos — útil conforme as listas crescem. **Default sem preferência salva:**
**Cadastros** começa **aberto**; **Administração** (e quaisquer grupos futuros) começam
**fechados**.

**Estrutura da sidebar — PARTICIPANTE:**
- **Cadastros:** Músicas (`/songs`), Playlists (`/playlists`)
- **Administração:** Alterar senha (`/account/password`), Planos (`/planos`), Minha Assinatura (`/account/subscription`)

**Estrutura da sidebar — ADM:**
- **Cadastros:** Músicas, Playlists, Tempos, Momentos, Artistas
- **Administração:** Alterar senha (`/account/password`), Planos (`/admin/planos`), Pagamentos (`/admin/pagamentos`), Usuários (`/usuario`), Perfis (`/perfil`)

> **Alterar senha** (`/account/password`) aparece para **todos os perfis** (ADM, PARTICIPANTE, DEMO).

O conteúdo principal tem `ml-60` no desktop para compensar a sidebar.

### 7. Telas (frontend)
- `/login` — formulário com campo de senha com toggle mostrar/ocultar (ícone de olho)
- `/register` — formulário com:
  - Campo "Confirmar senha" (PasswordInput com toggle mostrar/ocultar)
  - Barra de força de senha (5 segmentos: Muito fraca → Forte)
  - Checklist de requisitos sempre visível (não depende de ter digitado)
  - Botão "Criar conta" desabilitado até senha válida e senhas coincidentes
- `/account/password` — **Alterar senha** (qualquer usuário logado): campos
  Senha atual, Nova senha (com barra de força + checklist de requisitos,
  reaproveitados do cadastro) e Confirmar nova senha; botão desabilitado até a
  nova senha ser válida e a confirmação coincidir. Sucesso → encerra a sessão e
  volta ao `/login` (logar de novo com a nova senha). Senha atual errada → toast
  "Senha atual incorreta".
- `/usuario` — lista os usuários (tabela com nome, email, botões
editar, excluir) + botão "Novo usuário" (abre modal)
- `/perfil` — lista perfis (tabela com título, botão,
editar, excluir) + botão "Novo perfil" (abre modal)
- `/tempo` — lista dos tempos litúrgicos (tabela com título, descrição, botão,
editar, excluir) + botão "Novo tempo" (abre modal)
- `/momento` — lista dos momentos litúrgicos (tabela com título, descrição, botão,
editar, excluir) + botão "Novo momento" (abre modal)
- `/artista` — lista de artista (tabela com título, descrição, botão,
editar, excluir) + botão "Novo artista" (abre modal)
- `/songs` — lista de músicas (tabela com título, tom, tempo(s), momento(s), artista(s),
  editar, excluir) + botão "Nova música" → abre a página `/songs/new` (ADM).
  - Filtros acima da tabela: busca por título, busca por trecho na letra
    (procura na `descricao`, ignorando a marcação de acordes `[..]`/`{{..}}`,
    sem diferenciar maiúsculas/acentos) e selects de tempo, momento e artista
    (todos combináveis; botão "Limpar filtros"; contador "X de Y músicas").
  - Cada linha tem o botão "+ Playlist": abre um modal para escolher uma das
    playlists do usuário logado e adiciona a música nela (ordem = última + 1;
    música repetida na mesma playlist → erro 409 exibido em toast).
- `/songs/new` e `/songs/:id/edit` — página completa de cadastro/edição (só ADM),
  layout de duas seções conforme 3.3 (referência: `Musica.tsx`)
  - Tempo e Momento são grupos de chips com um botão **"+ Novo"** que abre um
    modal de cadastro rápido (título + descrição opcional); o item criado já
    entra selecionado na música, sem sair da página.
  - Artista usa um **combobox com busca** (a lista pode ser grande): os
    selecionados aparecem como chips removíveis (×) e o input filtra por
    título sem diferenciar maiúsculas/acentos, mostrando até 8 sugestões;
    a última opção do dropdown é **Criar artista "texto digitado"**, que abre
    o mesmo modal de cadastro rápido com o título já preenchido. Atingido o
    limite de 3, o input é desabilitado até remover um selecionado.
- `/songs/:id` — detalhe da música: exibe a descrição (acordes), botões de tom
  [C, C#, D, D#, E, F, F#, G, G#, A, Bb, B] e o chord-transposer para transpor;
  o participante pode salvar o tom escolhido (grava em SongTom).
  - Exibe os links de **cifra original**, **vídeo** e **slide** (abrem em nova
    aba; cada link só aparece quando o campo correspondente está preenchido).
  - Botão "+ Playlist": mesmo comportamento do botão da lista `/songs` —
    abre um modal para escolher uma das playlists do usuário logado e adiciona
    a música nela (ordem = última + 1; música repetida → erro 409 em toast).
- `/playlists` — grid de playlists do usuário; clicar abre o detalhe
  + botão "Nova playlist" (abre modal com `nome`, `data`, `descricao?`)
- `/playlists/:id` — músicas da playlist (ordenáveis) + remover;
  exibe a URL pública e a senha para compartilhar.
  - A adição de músicas é feita pelo botão "+ Playlist" da lista `/songs` ou
    do detalhe `/songs/:id` (não há seletor de adicionar nesta tela); aqui só
    se reordena (▲▼) e remove.
  - A caixa de compartilhamento mostra também um **QR code** da URL pública
    (gerado localmente com `qrcode.react`, sem serviço externo) — apontar a
    câmera do celular abre direto a tela `/lista-repertorio/:slug`
    (a senha continua sendo informada à parte).
  - Botões "Copiar URL" e "Copiar senha": tentam `navigator.clipboard.writeText()`
    (HTTPS/localhost); se falhar (HTTP via IP de rede), usam fallback com
    `<textarea>` temporário + `document.execCommand('copy')`.
- `/lista-repertorio/:slug` - acesso externo: pede a senha de 5 caracteres alfanuméricos e lista o repertório
  - **Organizada em 3 abas** (ver seção 14): **Playlist** (o repertório, abaixo),
    **Liturgia** (liturgia do dia da playlist) e **Orações** (Orações Eucarísticas).
    Na aba Playlist as músicas começam **abertas** (cifra à mostra) e cada uma exibe
    o **momento litúrgico** sob o título (ver 14.1).
  - Cada música expandida mostra a cifra transposta para o tom do dono e os
    links de **cifra original**, **vídeo** e **slide** (quando preenchidos;
    abrem em nova aba).
  - **Troca de tons por música (on-the-fly):** dentro de cada música expandida há
    uma fila de 12 botões de tom (C, C#, D … B). Clicar num tom transpõe a cifra
    daquela música apenas para aquela sessão (não persiste no servidor). O botão
    do tom ativo fica destacado. O cabeçalho da música mostra o tom em uso.
  - **Toggle global "Ocultar acordes":** botão no topo da lista que alterna entre
    exibir a cifra completa (acordes + letra) e exibir somente a letra
    (`soLetra()` remove linhas de acorde, tokens `[..]`/`{{..}}` e marcadores de
    seção soltos). Quando acordes estão ocultos, os botões de transposição também
    são ocultados (sem sentido transpor sem ver acordes).
  - **Transpositor próprio (`utils/cifra.ts`):** a lib `chord-transposer` foi
    substituída por implementação própria porque corrompia letras em MAIÚSCULAS
    (ex.: "E NA ALEGRIA" virava "F NA ALEGRIA" ao subir um semitom de E→F). O
    transpositor próprio detecta linhas-de-acorde via regex estrita e transpõe
    somente elas (e tokens inline), preservando qualquer letra intacta.
  - Acima da lista há um **toggle "Salvar offline neste dispositivo"**: ligado,
    grava a **senha e o repertório** no **localStorage** (chave
    `repertorio:{slug}`) para acesso rápido e consulta sem conexão — as visitas
    seguintes abrem direto da cópia local, sem pedir a senha (toggle já ligado),
    e a lista é revalidada na API em segundo plano com a senha guardada
    (mantendo a cópia atualizada); desligado, remove a cópia local e a senha
    volta a ser exigida no próximo acesso.
  - Se a revalidação retornar 401/404 (senha não confere mais ou playlist
    excluída), a cópia local é descartada e a senha volta a ser pedida; sem
    conexão, vale a cópia local. Ao ler o cache, o formato é validado (senha é
    string, slug confere e `musicas` é array); cache inválido/antigo é
    descartado.

### 8. Regras transversais
- Idioma da interface: português
- Datas formatadas dd/mm/aaaa
- Mensagens de erro do backend mostradas em "toast" no frontend
- Rotas protegidas: sem sessão (cookie) válida → redireciona pra `/login`

### 9. Critérios de aceite
- [ ] Consigo me cadastrar, logar e a sessão é mantida via cookie
- [ ] Logado, troco minha própria senha em `/account/password` (exige a senha atual);
      depois entro com a nova senha e a antiga deixa de funcionar
- [ ] Crio, edito e excluo músicas e elas persistem no SQLite
- [ ] Crio, edito e excluo tempo e elas persistem no SQLite
- [ ] Crio, edito e excluo momento e elas persistem no SQLite
- [ ] Crio, edito e excluo artista e elas persistem no SQLite
- [ ] Vinculo vários Tempo/Momento e até 3 Artistas a uma música
- [ ] Na tela da música transponho o tom e o resultado é salvo em SongTom
- [ ] Crio playlist e adiciono/removo músicas sem duplicar (ordenáveis)
- [ ] A música na playlist aparece com o tom salvo do dono
- [ ] Gero uma playlist pública e acesso por `/lista-repertorio/:slug` com a senha
- [ ] Senha inválida no acesso externo retorna 401
- [ ] PARTICIPANTE não acessa páginas de ADM (ex.: `/usuario`, `/tempo`)
- [ ] Sem sessão (cookie), sou redirecionado pro login
- [ ] Erros de validação aparecem como mensagem clara na tela

### 10. Decisões (todas resolvidas ✅)
- **Primeiro ADM:** o primeiro usuário cadastrado recebe perfil ADM; os demais, PARTICIPANTE (ver 3.1).
- **SongTom** por usuário+música (tom exibido na playlist = SongTom do dono).
- **Descrição** = texto puro com acordes em `[..]` (textarea + chord-transposer, sem tiptap).
- **Tempo/Momento/Artista** N:N (máx. 3 artistas).
- **Senha** da playlist em texto puro; **JWT** em cookie httpOnly.
- **Seed de Perfil** (ADM e PARTICIPANTE); **matriz de permissão** por perfil (ver 3.2.1/3.2.2).

---

### 11. Pagamentos e Assinaturas (Pagar.me + Asaas)

O app suporta **dois gateways em paralelo**, escolhidos pelo método de pagamento:

| Método de pagamento (`payment_method`) | Gateway  | Uso                              |
|----------------------------------------|----------|----------------------------------|
| `credit_card`                          | Pagar.me | Cartão de crédito (checkout hospedado) |
| `pix`                                  | Asaas    | PIX recorrente (QR a cada ciclo) |

A lógica de cada gateway fica isolada em `pagarme.service.ts` e `asaas.service.ts`.
O `BillingService.assinar()` roteia por `dto.payment_method`. As entidades guardam
`provider: 'pagarme' | 'asaas'` para que cancelamento, reembolso e webhooks saibam
qual gateway acionar.

#### 11.1 Modelo de dados (billing)

**Subscription**
- `id`, `userId` (FK), `planId` (FK), `billing_cycle` ('monthly' | 'yearly')
- `status`: 'pending' | 'active' | 'past_due' | 'canceled'
- `provider`: 'pagarme' | 'asaas' (default 'pagarme')
- `pagarme_subscription_id` (nullable), `asaas_subscription_id` (nullable)
- `started_at`, `current_period_end`, `past_due_since`, `canceled_at`, `cancel_reason`

**Payment**
- `id`, `subscriptionId` (FK), `userId` (FK), `amount` (decimal), `status` ('paid'|'failed'|'refunded')
- `provider`: 'pagarme' | 'asaas' (default 'pagarme')
- `pagarme_charge_id` (nullable), `asaas_payment_id` (nullable)
- `payment_method`, `card_last_digits`, `paid_at`

**User** (campos adicionais): `pagarme_customer_id`, `asaas_customer_id` (ambos nullable)

**WebhookLog**: registra todos os eventos recebidos (`event_type`, `payload`, `processed`, `error_message`) para auditoria/idempotência.

#### 11.2 Endpoints

```
POST   /billing/assinar                          (autenticado)
  body: { planId, billing_cycle, payment_method, cpfCnpj? }
  resposta cartão: { provider: 'pagarme', checkoutUrl }
  resposta PIX:    { provider: 'asaas', pixQrCode, pixCopiaECola, expiresAt }
GET    /billing/minha-assinatura                 (autenticado)  // reconcilia com Asaas
GET    /billing/minha-assinatura/pagamentos      (autenticado)
GET    /billing/minha-assinatura/pix-pendente    (autenticado)  // QR da cobrança do ciclo atual
DELETE /billing/minha-assinatura                 (autenticado)

POST   /billing/webhook                           (público, HMAC x-hub-signature) -> Pagar.me
POST   /billing/webhook/asaas?token=TOKEN         (público, valida ASAAS_WEBHOOK_TOKEN) -> Asaas

GET    /admin/subscriptions   /admin/payments                    (ADM)
POST   /admin/subscriptions/:id/grant-access  /admin/payments/:id/refund  (ADM)
```

#### 11.3 Fluxo PIX (Asaas)

1. Usuário escolhe "PIX" em `/planos`, informa **CPF/CNPJ** (obrigatório no Asaas) e assina.
2. Backend cria/atualiza o `customer` no Asaas e cria a `subscription` com `billingType: 'PIX'`.
3. Backend aguarda o QR da primeira cobrança (ver retry em 11.4) e retorna QR + copia-e-cola.
4. Frontend navega para `/billing/pix` mostrando o QR; faz **polling** em `/billing/minha-assinatura` a cada 5s.
5. Ao confirmar o pagamento (webhook **ou** reconciliação), status vira `active` → redireciona para `/billing/sucesso`.
6. Em `/account/subscription`, o `PixPendenteCard` mostra o QR do ciclo atual e faz polling (10s) até confirmar.

#### 11.4 Armadilhas e decisões (APRENDIZADOS — leia antes de mexer)

- **CPF/CNPJ é obrigatório** para criar cobrança PIX no Asaas. O campo vai no `AssinarDto`
  e em `/planos`. `criarOuBuscarCliente` faz `PUT /customers/{id}` para **sincronizar o CPF**
  quando o cliente já existe (uma 1ª tentativa sem CPF criava o customer sem ele e travava as seguintes).
- **QR PIX não fica disponível na hora.** Após criar a subscription, a primeira cobrança e o
  QR demoram alguns segundos. `asaas.obterPixComRetry()` tenta **até 6× com 1,5s** antes de desistir.
  Sem isso, a assinatura era criada no Asaas mas o frontend recebia erro (sintoma: "envia pro Asaas
  mas não tem resposta").
- **O endpoint de lista de cobranças NÃO retorna `pixTransaction`.** É preciso chamar
  `GET /payments/{id}/pixQrCode` separadamente (`asaas.buscarPixQrCode`). O campo `encodedImage`
  é o PNG base64; `payload` é o copia-e-cola.
- **Não dependa do webhook.** `minhaAssinatura()` faz **reconciliação**: se a assinatura local está
  `pending`/`past_due` mas a cobrança no Asaas está `RECEIVED`/`CONFIRMED`, ativa localmente
  (`reconciliarAsaas`). Isso cobre webhook que falhou/não chegou e a mudança manual de status no
  painel do sandbox. O webhook continua sendo o canal ideal (mais rápido), mas é fallback-safe.
- **`onAsaasPaid` é idempotente:** não reativa assinatura já ativa nem duplica `Payment`
  (checa `asaas_payment_id` existente). Importante porque webhook + reconciliação podem rodar juntos.
- **Assinatura `pending` presa:** ao reassinar com PIX havendo uma assinatura Asaas pendente, o backend
  **retorna o QR existente** em vez de `ConflictException`. O botão "Cancelar assinatura" aparece também
  para status `pending`, permitindo sair do estado preso.
- **Cache HTTP desligado:** `main.ts` envia `Cache-Control: no-store` em todas as respostas e o polling
  usa `?_t=Date.now()` — sem isso o browser servia 304 e o status nunca atualizava na tela.
- **Tela branca = crash de render.** Há um `ErrorBoundary` global (`components/ErrorBoundary.tsx`) que
  mostra a mensagem do erro em vez de desmontar a árvore. `fmt()`/`fmtDate()` são blindados contra
  `undefined`/`NaN`/data inválida (`undefined.toLocaleString()` lançava e apagava a página).
- **Webhook Asaas autentica por query param** `?token=...` validado contra `ASAAS_WEBHOOK_TOKEN`
  (valor real no `.env` de produção — não versionado). URL configurada no painel:
  `https://app-music-production.up.railway.app/billing/webhook/asaas?token=<ASAAS_WEBHOOK_TOKEN>`.
- Eventos Asaas mapeados: `PAYMENT_RECEIVED`/`PAYMENT_CONFIRMED` → pago; `PAYMENT_OVERDUE` → past_due;
  `SUBSCRIPTION_DELETED` → cancelado; `PAYMENT_REFUNDED` → reembolsado.

#### 11.5 Variáveis de ambiente (billing)

```
# Asaas
ASAAS_API_KEY=                                   # vazio -> AsaasService lança ServiceUnavailableException
ASAAS_API_URL=https://sandbox.asaas.com/api/v3   # produção: https://api.asaas.com/v3
ASAAS_WEBHOOK_TOKEN=                             # validado no /billing/webhook/asaas?token=...

# Pagar.me
PAGARME_API_KEY=
PAGARME_WEBHOOK_SECRET=                          # HMAC do header x-hub-signature
```

Configuradas no Railway (backend) em produção. Deploy: push em `master` → Railway (backend) + Vercel (frontend).

---

### 12. Verificação anti-bot (reCAPTCHA v3)

Login e cadastro são protegidos por **Google reCAPTCHA v3** (invisível, baseado em
score). O frontend gera um token por ação e o backend valida com o Google antes de
autenticar.

#### 12.1 Funcionamento
- **Frontend** (`react-google-recaptcha-v3`): o `GoogleReCaptchaProvider` fica montado
  uma única vez em `main.tsx` (chave `VITE_RECAPTCHA_SITE_KEY`). As telas de Login e
  Register chamam `executeRecaptcha('login' | 'register')` e enviam o token junto do payload.
- **Backend** (`auth/recaptcha.service.ts`): `POST https://www.google.com/recaptcha/api/siteverify`
  com `RECAPTCHA_SECRET_KEY`. Aprova só se `success === true`, a `action` confere e
  `score >= 0.5`. Sem `RECAPTCHA_SECRET_KEY` configurado, a verificação é **pulada** (dev).
- `LoginDto`/`RegisterDto` ganham `recaptchaToken: string`. `AuthController.login`/`register`
  chamam `recaptcha.verify(token, action)` antes de processar.

#### 12.2 Decisões e armadilhas (APRENDIZADOS — leia antes de mexer)
- **Fail-closed (decisão deliberada):** se a verificação não puder ser feita (token
  ausente/inválido), o acesso é **bloqueado**. O modo *fail-open* foi avaliado e recusado.
- **Provider montado uma vez, não por rota.** Montar/desmontar o `GoogleReCaptchaProvider`
  por rota faz a lib **vazar** o script/badge/iframe ao trocar de página (bug confirmado).
  Mantê-lo global em `main.tsx` evita isso.
- **Badge oculto + atribuição obrigatória.** O badge flutuante do reCAPTCHA fica escondido
  via CSS (`.grecaptcha-badge { visibility: hidden }` em `index.css`) em todo o app; em
  troca, o texto de atribuição do Google ("Este site é protegido por reCAPTCHA…") aparece
  **só** nas páginas de Login e Register — exigência da política do Google quando o badge
  não é exibido.
- **Timeout de 10s no `executeRecaptcha`.** Se a chamada ao Google for bloqueada (extensão
  de ad block/privacidade no navegador do usuário), a Promise **nunca resolve** e o
  formulário trava em "Entrando…" (sem cair no catch). O helper `auth/recaptcha.ts`
  (`obterTokenRecaptcha`) corre o `executeRecaptcha` contra um timeout e lança
  `RecaptchaError` com mensagem acionável (toast).
- **O bloqueio é do navegador, não da rede.** Extensões de privacidade/ad block barram a
  chamada `api2/reload` do Google; sintoma = timeout só no navegador do usuário (funciona
  em **aba anônima**, que roda sem extensões). Solução para o usuário: liberar o site na
  extensão ou desativá-la.

#### 12.3 Cadastro agora autentica direto
Com o reCAPTCHA, `POST /auth/register` passou a **definir o cookie JWT e autenticar na
hora** (antes fazia um segundo `login`, que exigiria um 2º token de reCAPTCHA).
`AuthService.register` recarrega o usuário com a relação `perfil` (eager) e o controller
assina o token + seta o cookie.

#### 12.4 `/auth/me` só com indício de sessão
Para não disparar um `401` no console a cada F5 da tela de login (deslogado), o
`AuthContext` só chama `GET /auth/me` quando existe a flag `app-music:sessao` no
`localStorage` (gravada no login/registro, removida no logout). **Não é segurança** — a
autenticação real continua sendo o cookie httpOnly; é só para evitar a requisição
desnecessária. Se o cookie expirar, o 401 da chamada limpa a flag.

#### 12.5 Variáveis de ambiente (reCAPTCHA)
```
# Backend
RECAPTCHA_SECRET_KEY=        # vazio -> verificação pulada (dev)
# Frontend
VITE_RECAPTCHA_SITE_KEY=     # site key v3
```
Criadas em https://www.google.com/recaptcha/admin (tipo **reCAPTCHA v3**), com os domínios
(incluindo `localhost`) registrados. Os `.env` são gitignorados — configurar no deploy.

---

### 13. Limite de músicas por playlist por perfil

O **Perfil** ganhou um limite opcional de músicas por playlist, **configurável pelo admin**.

- **Modelo:** `Perfil.max_songs_per_playlist: number | null` (`null` = sem limite).
- **Regra:** `PlaylistService.addSong` lê o perfil do usuário (via `perfilId` do JWT); se o
  perfil tem limite e a playlist já o atingiu, retorna **403**
  `{ code: 'LIMITE_MUSICAS_PERFIL', limit }` com a mensagem
  *"Seu perfil (X) permite no máximo N música(s) por playlist."* — exibida em toast pelo
  interceptor do axios.
- **Perfil DEMO:** novo perfil semeado com `max_songs_per_playlist = 4`. **ADM** e
  **PARTICIPANTE** ficam com `null` (ilimitado). Em termos de páginas/permissões, o DEMO
  espelha o PARTICIPANTE (ver 3.2.2) — a única diferença é o teto de músicas por playlist.
- **Seed idempotente:** `seedPerfis` garante ADM/PARTICIPANTE/DEMO mesmo em banco já
  populado, **sem sobrescrever** um perfil que já exista (preserva edições do admin). Por
  isso, se um DEMO já existir sem limite, ajuste-o uma vez pela tela de Perfis.
- **Admin:** a tela `/perfil` mostra a coluna "Músicas/playlist" e tem um campo
  "Limite de músicas por playlist" (vazio = sem limite). Para tornar um usuário Demo,
  selecione o perfil **DEMO** na tela `/usuario`.

---

### 14. Página pública em 3 abas (Playlist · Liturgia · Orações)

A tela externa `/lista-repertorio/:slug` passou a ter **3 abas**, mantendo o acesso por
senha e o "Salvar offline" existentes. Implementada em fases (A backend liturgia →
B orações markdown → C abas + offline no front).

#### 14.1 Aba Playlist
Repertório com cifras, transposição por música e ocultar acordes (conteúdo movido para
dentro da aba).
- **Lista aberta por padrão:** as músicas já aparecem **expandidas** (cifra à mostra);
  cada uma pode ser recolhida/expandida individualmente. Implementado rastreando as
  músicas **fechadas** (conjunto vazio = todas abertas), permitindo várias abertas ao
  mesmo tempo.
- **Momento litúrgico:** o(s) momento(s) de cada música aparecem sob o título. O dado já
  vem no payload público (`Song.momentos` é `eager`), sem mudança no backend.

#### 14.2 Aba Liturgia (API externa + cache no backend)
A liturgia é a **da data da playlist** (campo `data`), não "hoje".

- **Decisão: o backend é proxy.** Evita CORS, normaliza formatos, cacheia e resiste à
  origem cair. O front só consome um contrato estável.
- **Modelo (cache):** entidade `Liturgia { data (única, YYYY-MM-DD), payload (json
  normalizado), fonte, fetched_at }`. A liturgia de uma data é **imutável** → cache
  "para sempre" e serve de fallback se a fonte cair.
- **Fluxo:** `LiturgiaService.obterPorData(data)` → cache-first; senão busca no provedor,
  normaliza, grava e retorna. Falha sem cache → `503` (a aba mostra "indisponível" +
  "tentar de novo", **sem quebrar** a playlist).
- **Provedor atual:** `liturgia.up.railway.app/v2/?dia&mes&ano` (`LiturgiaRailwayProvider`,
  atrás da interface `ProvedorLiturgia` — trocável). Normalização **defensiva** (cada
  leitura pode vir objeto **ou** array — pega a 1ª opção). Datas via getters **UTC** (a
  `playlist.data` é meia-noite UTC).
- **Contrato normalizado:** `{ data, titulo (celebração), cor, leituras[{ tipo, referencia?,
  titulo?, refrao?, texto }], fonte }`. A **atribuição da fonte** é exibida na aba.
- **Endpoint:** `POST /lista-repertorio/:slug/liturgia` (valida a senha, deriva a data).
  O interceptor do axios **silencia** o toast de `/liturgia` (a aba já mostra mensagem inline).
- ⚠️ **Provedor é comunitário** ("por enquanto"): confirmar **estabilidade e licença** do
  conteúdo litúrgico. Cache + fallback já mitigam quedas.

#### 14.3 Aba Orações (markdown embutido)
- Orações Eucarísticas como **arquivos `.md` no front** (`src/content/oracoes/*.md`),
  carregados via `import.meta.glob`/`?raw` + manifesto (`index.ts`), renderizados com
  **`react-markdown`** (estilo na classe `.markdown` do `index.css`).
- **Offline de graça** (fazem parte do bundle — sem backend, sem localStorage).
- ⚠️ **Conteúdo é ESPAÇO RESERVADO.** Os textos oficiais (tradução da CNBB) são protegidos
  por direitos autorais e **não** foram incluídos — devem ser colados pelo responsável,
  com a devida autorização. É só editar os `.md`.

#### 14.4 Offline
O cache `localStorage["repertorio:{slug}"]` passou de `{ senha, playlist }` para
`{ senha, playlist, liturgia? }`. Ao ligar "Salvar offline", a liturgia é buscada (se
ainda não estava) e salva junto; a revalidação em segundo plano preserva a liturgia
salva. O validador de cache **tolera `liturgia` ausente** (compatível com cache antigo).
As Orações não precisam de cache (estão no bundle).
