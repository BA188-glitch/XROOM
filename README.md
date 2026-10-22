# XROOM

Site estático do CorredorX. Publique a raiz do repositório.

## Lives

As abas incorporam os canais públicos do YouTube (@CorredorX23) e Twitch (fv46__corred0x23). Configure esses destinos no Restream e inicie a transmissão por lá; o site usa os players oficiais para exibir o conteúdo recebido. Não há integração com a API privada do Restream nem indicador próprio de status ao vivo. O estado online/offline é apresentado pelos players das plataformas.

O YouTube usa o ID público do canal em `broadcast.js`. A incorporação de lives precisa estar permitida no canal; há um link direto como alternativa quando o player está indisponível. A Twitch recebe automaticamente o domínio atual no parâmetro `parent`, incluindo os domínios de preview.

## Highlights

A aba apresenta uma cascata de cartões dos dois vídeos existentes. Clique em um cartão para iniciar. Cada trecho avança automaticamente após até 50 segundos de reprodução; buffering e pausas não contam. O player passa ao próximo quando um vídeo termina antes desse limite e repete a sequência ao final. A reprodução pausa ao sair da aba de highlights ou ocultar a página.

Como não foram fornecidas marcações de melhores momentos, os cortes iniciais são de 00:00 a 00:50 e estão identificados como trechos iniciais na interface. Para selecionar os highlights reais, altere `start` (segundos), `id` e `title` na lista `clips` de `broadcast.js`, e atualize os cartões correspondentes em `index.html`. Não há análise automática do conteúdo dos vídeos.

Verificação de sintaxe: `node --check broadcast.js`. Teste os players no domínio publicado para validar permissões de incorporação e disponibilidade dos canais.
