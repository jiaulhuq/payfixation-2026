
const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat('bn-BD',{maximumFractionDigits:0}).format(Math.round(Number(n)||0));
const num = id => Number($(id).value)||0;

function fillSelectors(){
  for(let g=1;g<=20;g++){
    const opt=document.createElement('option'); opt.value=g; opt.textContent=`গ্রেড-${g}`;
    $('grade').appendChild(opt);
    $('baseGrade').appendChild(opt.cloneNode(true));
  }
  for(let c=0;c<=6;c++){ const o=document.createElement('option');o.value=c;o.textContent=c; $('children').appendChild(o); }
  $('grade').value='9'; $('baseGrade').value='9';
  loadOldSteps();
}

function loadOldSteps(){
  const g=Number($('grade').value);
  const arr=PAY_SCALE[String(g)].a;
  $('oldBasic').innerHTML='';
  arr.forEach((v,i)=>{
    const o=document.createElement('option');o.value=v;o.textContent=`${money(v)} টাকা — ধাপ ${i+1}`;
    $('oldBasic').appendChild(o);
  });
  $('oldBasic').value=arr[Math.min(4,arr.length-1)];
}

function nextStep(g,value){
  const arr=PAY_SCALE[String(g)].b;
  for(const x of arr) if(x>value) return x;
  return arr[arr.length-1];
}
function equalOrNextStep(g,value){
  const arr=PAY_SCALE[String(g)].b;
  return arr.find(x=>x>=value) ?? arr[arr.length-1];
}

function fixation(g, old){
  const a=PAY_SCALE[String(g)].a, b=PAY_SCALE[String(g)].b;
  const startA=a[0], startB=b[0];
  if(old<=startA) return {target:startB, fixed:nextStep(g,startB), diff:startB-old, method:'প্রারম্ভিক ধাপ'};
  const difference=old-startA;
  const target=startB+difference;
  const fixedBase=equalOrNextStep(g,target);
  const full=nextStep(g,fixedBase);
  return {target,fixedBase,full,diff:full-old,method:'পার্থক্য পদ্ধতি'};
}

function house2026(oldBasic, grade){
  // V1 uses editable/manual 2026 house rent, so this returns 0.
  return 0;
}

function allowance2028(basic,g){
  const city=$('cityJob').checked;
  const children=Math.min(2,Number($('children').value)||0);
  const medical = $('age').value==='65plus' ? 3000 : 2000;
  const education = Math.min(2, Number($('children').value)||0)*APP_DEFAULTS.educationPerChild;
  const tiffin = ($('lunch').checked || g<11) ? 0 : APP_DEFAULTS.tiffin;
  const transport = (city && g>=11) ? APP_DEFAULTS.cityTransport : 0;
  const wash = $('wash2028').checked ? APP_DEFAULTS.wash : 0;
  const acting = $('acting2028').checked ? APP_DEFAULTS.actingDuty : 0;
  const special=num('specialArea'), other=num('other2028');
  // House rent in V1 is carried as a user-entered amount to avoid inventing a gazette rate.
  const house=num('house');
  return {house,medical,education,tiffin,transport,wash,acting,special,other,total:house+medical+education+tiffin+transport+wash+acting+special+other};
}

function renderResult(r){
  $('result').classList.add('show');
  $('personSummary').innerHTML=`<b>${$('name').value||'কর্মচারী'}</b> — ${$('designation').value||'পদবি নেই'}<br>${$('office').value||''}`;
  $('stats').innerHTML=`
    <div class="stat"><small>৩০ জুন ২০২৬ মূল</small><strong>${money(r.old)} ৳</strong></div>
    <div class="stat"><small>২০২৬ ফিক্সেশন</small><strong>${money(r.full2026)} ৳</strong></div>
    <div class="stat"><small>১ জুলাই ২০২৭ মূল</small><strong>${money(r.full2027)} ৳</strong></div>
    <div class="stat"><small>বৃদ্ধির মোট অংশ</small><strong>${money(r.increase)} ৳</strong></div>`;
  const rows=[
    ['জুলাই–ডিসেম্বর ২০২৬', r.basic1, r.basic1-r.old, r.allowOld, r.deduction],
    ['জানুয়ারি–জুন ২০২৭', r.basic2, r.basic2-r.old, r.allowOld, r.deduction],
    ['জুলাই–ডিসেম্বর ২০২৭', r.full2027, r.full2027-r.old, r.allowOld, r.deduction],
    ['জানুয়ারি ২০২৮ থেকে', r.full2027, r.full2027-r.old, r.allow2028.total, r.deduction]
  ];
  $('salaryTable').querySelector('tbody').innerHTML=rows.map(x=>{
    const net=x[1]+x[3]-x[4];
    return `<tr><td>${x[0]}</td><td>${money(x[1])}</td><td>${money(x[2])}</td><td>${money(x[3])}</td><td>${money(x[4])}</td><td><b>${money(net)}</b></td></tr>`;
  }).join('');
  $('steps').innerHTML=`
  <ol>
   <li>৩০ জুন ২০২৬ মূল বেতন: <b>${money(r.old)}</b> টাকা</li>
   <li>২০১৫ স্কেলের প্রারম্ভিক ধাপ: <b>${money(r.oldStart)}</b> টাকা</li>
   <li>পার্থক্য: <b>${money(r.old-r.oldStart)}</b> টাকা</li>
   <li>২০২৬ স্কেলের লক্ষ্য অঙ্ক: <b>${money(r.target)}</b> টাকা</li>
   <li>সমমান/পরবর্তী ধাপে ফিক্সেশন: <b>${money(r.fixedBase)}</b> টাকা</li>
   <li>১ জুলাই ২০২৬-এর বার্ষিক বেতনবৃদ্ধিসহ: <b>${money(r.full2026)}</b> টাকা</li>
   <li>১ জুলাই ২০২৭-এর পরবর্তী ইনক্রিমেন্টসহ: <b>${money(r.full2027)}</b> টাকা</li>
  </ol>`;
  window.scrollTo({top:$('result').offsetTop-10,behavior:'smooth'});
}

$('grade').addEventListener('change',loadOldSteps);
$('customBasic').addEventListener('input',()=>{ if($('customBasic').value) $('oldBasic').disabled=true; else $('oldBasic').disabled=false; });

$('payForm').addEventListener('submit',e=>{
  e.preventDefault();
  const g=Number($('grade').value);
  const old=num('customBasic')||Number($('oldBasic').value);
  const a=PAY_SCALE[String(g)].a;
  const f=fixation(g,old);

  // Optional "one higher grade from 1 July" — V1 moves to the next grade and applies the same method.
  let effectiveGrade=g;
  let fx=f;
  if($('higherFromJuly').checked && g>1){
    effectiveGrade=g-1;
    fx=fixation(effectiveGrade,old);
  }

  const oldStart=PAY_SCALE[String(effectiveGrade)].a[0];
  const fixedBase=fx.fixedBase ?? fx.target;
  const full2026=fx.full ?? fx.fixed ?? fixedBase;
  const full2027=nextStep(effectiveGrade,full2026);
  const increase=full2026-old;
  const highRate=effectiveGrade<=9;
  const p1=highRate ? .4 : .5;
  const p2=highRate ? .7 : .75;
  const basic1=old+increase*p1;
  const basic2=old+increase*p2;
  const allowOld=num('house')+num('medical')+num('education')+num('tiffin')+num('transport')+num('acting')+num('wash')+num('other');
  const r={
    old,oldStart,target:fx.target,fixedBase,full2026,full2027,increase,basic1,basic2,
    allowOld,deduction:num('deduction'),allow2028:allowance2028(full2027,effectiveGrade)
  };
  renderResult(r);
});

$('printBtn').addEventListener('click',()=>window.print());
$('resetBtn').addEventListener('click',()=>{ $('payForm').reset(); $('grade').value='9';$('baseGrade').value='9';$('result').classList.remove('show');$('customBasic').disabled=false;loadOldSteps(); });

fillSelectors();
