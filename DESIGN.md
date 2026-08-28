# Sistema de Design da PAGORA (Design System & Motion Guidelines)

> **Identidade da Marca**: PAGORA — "Cobre com confiança. Receba sem perseguir."  
> **Linguagem e Localização**: Português de Portugal (PT-PT)  
> **Objetivo de Design**: Transmitir **Controlo, Clareza, Confiança, Ação, Precisão e Calma**. Eliminar qualquer aspeto genérico de template de IA ("AI Slop").

---

## 1. Princípios Fundamentais Anti-Genericidade

1. **Anti-"Card Soup"**: Nem toda a informação precisa de ser colocada num cartão dentro de outro cartão. Usar superfícies abertas, divisórias elegantes (`border-slate-200`), tabelas estruturadas e hierarquia tipográfica pura.
2. **Propósito Visual**: Cada cor, elevação e transição existe para guiar a tomada de decisão operacional do utilizador (saber quem cobrar, quanto receber, quando intervir).
3. **Tipografia Financeira com Precisão**: Valores monetários (ex.: `1 250,00 €`, `850,00 €`) são formatados em Português de Portugal e utilizam números tabulares (`tabular-nums` / `font-mono`) para leitura imediata e comparação vertical sem desalinhamento.
4. **Sem Efeitos Artificiais de IA**: Proibido usar "AI glow", gradientes roxo-para-azul de templates genéricos, botões em pílula excessivos (`rounded-full`), ou ilustrações 3D descontextualizadas.

---

## 2. Paleta Cromática Funcional

| Função | Código Hex | Utilização |
|---|---|---|
| **Primária (Brand)** | `#4F46E5` (Indigo-600) | Ações principais, destaques funcionais e navegação ativa |
| **Primária Escura** | `#3730A3` (Indigo-800) | Cabeçalhos de decisão, estados ativos e gradientes profundos |
| **Sucesso / Quitação** | `#10B981` (Emerald-500) | Recebimentos confirmados, promessas cumpridas e liquidações |
| **Atenção / Prazos** | `#F59E0B` (Amber-500) | Vencimentos próximos, promessas a vencer e risco moderado |
| **Crítico / Atrasos** | `#EF4444` (Rose-500) | Atrasos prolongados (>7 dias), promessas quebradas e alto risco |
| **Fundo de Aplicação** | `#F8FAFC` (Slate-50) | Canvas base limpo com saturação subtil |
| **Superfícies & Texto** | `#0F172A` (Slate-900) | Tipografia principal de alto contraste e superfícies escuras |

---

## 3. Escala Tipográfica e Hierarquia

- **Títulos de Secção / Vistas**: `text-xl` a `text-2xl`, peso `font-bold` (700), `text-slate-900`, tracking tight.
- **Subtítulos / Diagnósticos**: `text-sm` a `text-base`, peso `font-semibold` (600), `text-slate-700`.
- **Corpo de Texto**: `text-xs` a `text-sm`, `text-slate-600`, entrelinha `leading-relaxed` (1.5–1.6).
- **Rótulos e Metadados**: `text-[10px]` a `text-[11px]`, peso `font-bold` (700), uppercase com tracking alargado (`tracking-wider`), `text-slate-400`.
- **Métricas Financeiras**: `text-lg` a `text-3xl`, peso `font-bold`, `tabular-nums font-mono`.

---

## 4. Escala de Raios e Superfícies

| Elemento | Border Radius | Classe Tailwind |
|---|---|---|
| Controlos pequenos (checkbox, tags) | 6px | `rounded-md` |
| Botões e Campos de Input | 8px | `rounded-lg` |
| Cartões, Blocos e Painéis | 12–16px | `rounded-xl` |
| Modais e Janelas de Decisão | 16–20px | `rounded-2xl` |
| Badges / Chips de Estado | 9999px | `rounded-full` (apenas para etiquetas de uma só linha) |

---

## 5. Níveis de Elevação (Profundidade)

- **Nível 0**: Superfície base da aplicação (`bg-slate-50`, sem sombra).
- **Nível 1 (Cartão de dados)**: `bg-white border border-slate-200/90 shadow-2xs`.
- **Nível 2 (Menus e Dropdowns)**: `bg-white border border-slate-200 shadow-sm`.
- **Nível 3 (Modais e Painéis de Decisão)**: `bg-white border border-slate-200 shadow-md` (ou fundo escuro `bg-slate-900 shadow-md`).

---

## 6. Sistema de Motion & Microinterações

### Durações Padrão
- **Microinterações** (feedback de botões, cópia de chaves, seleção): **120ms – 180ms**.
- **Transições de Componentes** (abertura de abas, acordions, expansão de listas): **200ms – 280ms**.
- **Transições Estruturais** (modais, gavetas de navegação): **250ms – 350ms**.

### Curvas de Transição
- Aceleração suave e desaceleração natural: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out natural).
- Proibido qualquer efeito elástico infantil ("bounce" excessivo) que cause atraso na produtividade.

### Acessibilidade de Movimento (`prefers-reduced-motion`)
Quando o sistema operativo solicitar redução de movimento:
- Desativar deslocamentos (`translateY`, `translateX`).
- Manter transições instantâneas de opacidade (`opacity: 1`) para feedback funcional imediato sem animações espaciais.

---

## 7. Estados Visuais Completos

Todos os componentes interativos devem implementar explicitamente:
1. `default`: Aparência limpa e legível.
2. `hover`: Subida subtil de contraste (`hover:bg-slate-50` ou `hover:border-slate-300`).
3. `active`: Feedback táctil leve (`active:scale-[0.98]`).
4. `focus-visible`: Anel de foco com contraste nítido (`focus:ring-2 focus:ring-indigo-500 focus:outline-none`).
5. `disabled`: Opacidade reduzida com cursor `not-allowed` (`disabled:opacity-50 disabled:cursor-not-allowed`).
6. `loading`: Skeleton contextual respeitando as dimensões reais do conteúdo.
7. `empty`: Mensagem positiva de orientação com ação direta de resolução.
