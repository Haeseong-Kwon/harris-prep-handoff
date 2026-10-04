(function(){
  const root=document.getElementById('hp-website');if(!root)return;
  const menu=root.querySelector('.menu-toggle'),nav=root.querySelector('#site-nav');
  if(menu&&nav){menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);menu.textContent=open?'닫기':'메뉴';});nav.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='메뉴';menu.focus();}});}
  const answers=['학교 수업과 또래와의 생활 속에서 영어를 사용합니다. 변화의 정도는 학생마다 다르므로 현재 수준과 적응 준비도를 먼저 상담합니다.','부모 동행 없이 현지 상주 코칭과 주간 리포트를 제공합니다. 숙소·야간 돌봄·긴급 연락 범위는 확인 후 안내하며 신청 전에 함께 검토합니다.','현지 학생과 같은 교복·시간표·과제로 정규 수업에 참여합니다. 주간 리포트로 학교생활을 공유하며, 귀국 후 성과는 증빙 확보 후 공개합니다.','진학 목표와 재학 중인 학교의 일정, 적응 준비도를 함께 고려합니다. 특정 학교 합격이나 입시 성과를 약속하지 않으며 참가 시기를 상담합니다.'];
  const labels=['현재 영어 수준부터 상담하기','현지 돌봄 범위 확인하기','정규 수업 과정 상담하기','참가 시기 상담하기'];
  root.querySelectorAll('[data-concern]').forEach(button=>button.addEventListener('click',()=>{const n=Number(button.dataset.concern);root.querySelectorAll('[data-concern]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const panel=root.querySelector('.hp-answer');panel.hidden=false;root.querySelector('#hp-answer-text').textContent=answers[n];const link=root.querySelector('#hp-fit-cta');link.textContent=labels[n];link.href='contact.html?concern='+n;}));
  const field=root.querySelector('#hp-concern-field');if(field){const n=new URLSearchParams(window.location.search).get('concern');if(n!==null&&/^[0-3]$/.test(n))field.value=labels[Number(n)];}
  root.querySelectorAll('form').forEach(form=>form.addEventListener('submit',event=>event.preventDefault()));
})();
