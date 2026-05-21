# Phase 2: Interface Alienígena "Eternos" - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-21
**Phase:** 2-Interface Alienígena "Eternos"
**Areas discussed:** Estética da Animação do Canvas, Captação de Frequência do Áudio (Web Audio API), Painéis Flutuantes de Controle

---

## Estética da Animação do Canvas

| Option | Description | Selected |
|--------|-------------|----------|
| Órbitas Celestes Giratórias | Círculos concêntricos e runas douradas de Eternos giratórias pulsando em raio e brilho com o áudio. | ✓ |
| Linha de Onda senoidal | Linha clássica de osciloscópio no centro da tela. | |

**User's choice:** Órbitas Celestes Giratórias (Default Recomendado)
**Notes:** Escolhido autonomamente no modo YOLO para garantir a imersão visual pretendida pelo usuário com a estética do filme *Eternos*.

---

## Captação de Frequência do Áudio (Web Audio API)

| Option | Description | Selected |
|--------|-------------|----------|
| Análise de Frequência Bidirecional | Captura de frequências separadamente para o microfone do usuário e para o player de áudio da IA. | ✓ |
| Apenas Player de Áudio | A animação reage unicamente quando a IA está falando. | |

**User's choice:** Análise de Frequência Bidirecional (Default Recomendado)
**Notes:** Permite que a interface pulse tanto quando o usuário está falando quanto quando a IA está respondendo, oferecendo uma UI de feedback completo de voz.

---

## Painéis Flutuantes de Controle

| Option | Description | Selected |
|--------|-------------|----------|
| Gavetas Laterais com Glassmorphism | Painéis retráteis translúcidos para logs de texto e seletor de modelos da IA nas bordas da tela. | ✓ |
| Layout em Grid CSS Fixo | Divisão de tela clássica com bordas definidas para os elementos de controle. | |

**User's choice:** Gavetas Laterais com Glassmorphism (Default Recomendado)
**Notes:** Otimiza o espaço de tela, mantendo o canvas central totalmente visível e desobstruído durante a interação por voz.
