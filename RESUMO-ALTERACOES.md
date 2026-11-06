# Cambuí Terraplenagem — Resumo das alterações

_Atualizado em 05/11/2026_

## Rodada 1 (já publicada no GitHub)

| #   | Pedido                 | Como ficou                                                                                                                                                                                                                       |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Admin lançar e editar  | Aba **Lançamentos** no menu do admin, com "Lançar Dia" e "Foto / PDF". Cada lançamento tem **Editar** e **Excluir**. O operador edita os seus que ainda não foram aprovados; se corrigir um devolvido, ele volta para aprovação. |
| 2   | Excluir itens          | Refeito na rodada 2 (ver abaixo).                                                                                                                                                                                                |
| 3   | Foto ou PDF            | Ao anexar, o sistema pergunta **Foto ou PDF** e salva o arquivo no Supabase. Vale para folha do dia, anexos do lançamento e cupom do abastecimento.                                                                              |
| 4   | Campos opcionais       | Cadastros, lançamentos e abastecimentos salvam com campos em branco.                                                                                                                                                             |
| 5   | Veículos separados     | Aba **Veículos** em Cadastros, separada de Máquinas. Caminhões existentes foram movidos para Veículos.                                                                                                                           |
| 6   | Horímetro x km         | Máquina usa **horímetro**; veículo usa **km** (mostra "km rodados"). Veículo não gera cobrança por hora.                                                                                                                         |
| 7   | Abastecimento          | Só **litros**. Saíram valor/litro, valor total e horímetro.                                                                                                                                                                      |
| 8   | Local do abastecimento | Fixo em **Garagem**, com botão **Editar** para escrever outro local.                                                                                                                                                             |

## Rodada 2

### Excluir por item (substitui o "Excluir todos os dados")

- O botão que apagava tudo foi **removido**.
- Em **Cadastros**, cada cliente, obra, máquina, veículo e colaborador tem agora **Editar** e **Excluir**. Tipos de serviço também têm um botão de excluir.
- Ao excluir, o sistema pede confirmação.
- Os lançamentos ligados ao item **não são apagados**: só ficam com aquele campo em branco (ex.: lançamento sem cliente).

### Novas cores: azul Pepsi + prata

- **Azul Pepsi (#004B93):** botões principais, abas ativas, números em destaque e logo.
- **Prata:** barra do topo (degradê prata com linha azul), fundos de cards selecionados e caixas de destaque.
- Texto branco nos botões azuis. O modo escuro também foi ajustado.
- A cor do app no celular (barra do navegador / ícone instalado) também passou para azul.
- Se quiser testar outra combinação, basta pedir: as cores ficam centralizadas e é rápido trocar.

## Como ver no site

1. Fazer o **merge** do pull request no GitHub.
2. No **Skip**, sincronizar com o GitHub e clicar em **Publicar**.
3. Abrir o endereço do sistema e atualizar a página.
