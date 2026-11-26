
(()=>{const q=s=>document.querySelector(s),arena=q('.arena'),panel=q('.game-panel'),chat=q('.chat-panel');
const frame=document.createElement('div');frame.className='play-frame';arena.before(frame);frame.append(arena);
arena.append(q('.arena-hud'));arena.append(q('.game-toolbar'));q('.scoreboard').append(q('#round-dots'));
const connectionRow=document.createElement('div');connectionRow.className='connection-row';q('#connection').before(connectionRow);connectionRow.append(q('#connection'),q('#reset-settings'));q('#reset-settings').title='Restore original game settings and start a fresh round';
frame.append(q('.controls'));frame.append(q('#result'));frame.append(q('#change-feedback'));
const composer=q('.composer');chat.insertBefore(composer,q('.studio-history-head'));composer.prepend(q('#composer-react'));const shell=document.createElement('div');shell.className='prompt-composer-shell';q('#composer-react').before(shell);shell.append(q('#composer-react'),q('#undo-code'));q('#undo-code').title='Undo the last applied AI change';
const toggle=document.createElement('button');toggle.type='button';toggle.className='chat-toggle';toggle.textContent='Change the game';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','studio-chat');chat.id='studio-chat';panel.append(toggle);toggle.onclick=()=>{const open=chat.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Close editor':'Change the game';if(open)chat.scrollIntoView({behavior:'smooth',block:'nearest'});};
})();