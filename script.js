(function(){
  var params=new URLSearchParams(window.location.search);
  var fields={};
  var paramMap={
    'first_name':'firstName','last_name':'lastName','full_name':'fullName',
    'email':'email','phone':'phone','company':'company',
    'city':'city','state':'state','country':'country'
  };
  var skipTags={'SCRIPT':1,'STYLE':1,'NOSCRIPT':1,'TEXTAREA':1,'CODE':1,'PRE':1};
  var hasUrlFields=false;
  for(var p in paramMap){
    var v=params.get(p);
    if(v){fields[paramMap[p]]=v;hasUrlFields=true;}
  }
  var contactId=params.get('contact_id');
  function esc(s){
    if(!s)return s;
    var d=document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }
  function doReplace(data){
    var r={};
    r['{{full_name}}']=esc(((data.firstName||'')+' '+(data.lastName||'')).trim()||((data.fullName||data.name)||''));
    r['{{first_name}}']=esc(data.firstName||(data.name?data.name.split(' ')[0]:'')||'');
    r['{{last_name}}']=esc(data.lastName||(data.name&&data.name.indexOf(' ')>-1?data.name.substring(data.name.indexOf(' ')+1):'')||'');
    r['{{email}}']=esc(data.email||'');
    r['{{phone}}']=esc(data.phone||'');
    r['{{company}}']=esc(data.company||'');
    r['{{city}}']=esc(data.city||'');
    r['{{state}}']=esc(data.state||'');
    r['{{country}}']=esc(data.country||'');
    r['{{date}}']=new Date().toLocaleDateString();
    r['{{time}}']=new Date().toLocaleTimeString();
    r['{{location}}']=[data.city,data.state,data.country].filter(Boolean).join(', ');
    r['{{tracking_id}}']=esc(data.trackingId||'');
    r['{{lastClickedProduct}}']=esc(data.lastClickedProduct||'');
    r['{{lastProductClickDate}}']=esc(data.lastProductClickDate||'');
    r['{{lastClickedProductPrice}}']=esc(data.lastClickedProductPrice||'');
    r['{{lastClickedProductURL}}']=esc(data.lastClickedProductURL||'');
    r['{{productsClickedCount}}']=esc(data.productsClickedCount||'0');
    r['{{ip_address}}']=esc(data.ipAddress||'');
    r['{{ip}}']=esc(data.ipAddress||'');
    if(data.customFields){
      for(var k in data.customFields){
        r['{{'+k+'}}']=esc(String(data.customFields[k]||''));
      }
    }
    params.forEach(function(v,k){
      if(!paramMap[k]&&k!=='contact_id'&&k!=='page_id'&&k.indexOf('utm_')!==0){
        r['{{'+k+'}}']=esc(v);
      }
    });
    var hasValues=false;
    for(var key in r){if(r[key]){hasValues=true;break;}}
    if(!hasValues)return;
    var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
      acceptNode:function(n){
        var p=n.parentNode;
        if(p&&skipTags[p.nodeName])return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while(node=walker.nextNode()){
      var txt=node.nodeValue;
      if(txt&&txt.indexOf('{{')>-1){
        var changed=txt;
        for(var ph in r){
          if(r[ph]&&changed.indexOf(ph)>-1){
            changed=changed.split(ph).join(r[ph]);
          }
        }
        if(changed!==txt)node.nodeValue=changed;
      }
    }
    var attrs=['value','placeholder','content','alt','title'];
    attrs.forEach(function(attr){
      var els=document.querySelectorAll('['+attr+'*="{{"]');
      for(var i=0;i<els.length;i++){
        var tag=els[i].tagName;
        if(skipTags[tag])continue;
        var val=els[i].getAttribute(attr);
        if(val){
          var nv=val;
          for(var ph in r){
            if(r[ph]&&nv.indexOf(ph)>-1){
              nv=nv.split(ph).join(r[ph]);
            }
          }
          if(nv!==val)els[i].setAttribute(attr,nv);
        }
      }
    });
  }
  function run(){
    if(contactId){
      var xhr=new XMLHttpRequest();
      xhr.open('GET','https://paymegpt.com/api/landing/context/'+encodeURIComponent(contactId)+'?page_id=2223');
      xhr.onload=function(){
        if(xhr.status===200){
          try{
            var resp=JSON.parse(xhr.responseText);
            if(resp.success&&resp.contact){
              var merged=resp.contact;
              for(var k in fields){merged[k]=fields[k];}
              doReplace(merged);
              return;
            }
          }catch(e){}
        }
        if(hasUrlFields)doReplace(fields);
      };
      xhr.onerror=function(){if(hasUrlFields)doReplace(fields);};
      xhr.send();
    }else if(hasUrlFields){
      doReplace(fields);
    }
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',run);}
  else{run();}
})();

(function(){
  var slug='sbbW3C8e';
  var apiBase='https://paymegpt.com';
  window.__processPayment=function(opts){
    if(!opts||typeof opts!=='object'){return Promise.reject('Invalid payment options');}
    var amountCents=opts.amountCents;var email=opts.email;var productName=opts.productName;
    var productDescription=opts.productDescription||'';var customerName=opts.name||'';var quantity=opts.quantity||1;
    if(!productName){alert('Product name is required.');return Promise.reject('no_product_name');}
    if(!amountCents||amountCents<100){alert('Amount must be at least $1.00');return Promise.reject('invalid_amount');}
    if(!email){alert('Please enter your email address.');return Promise.reject('no_email');}
    var successBase=window.location.href.split('?')[0];
    return fetch(apiBase+'/api/landing-pages/public/'+slug+'/payment/checkout',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email,name:customerName,amountCents:amountCents,productName:productName,productDescription:productDescription,quantity:quantity,successUrl:successBase+'?payment=success&product='+encodeURIComponent(productName)+'&session_id={CHECKOUT_SESSION_ID}',cancelUrl:successBase+'?payment=cancelled'})
    }).then(function(r){return r.json();}).then(function(d){
      if(d.checkoutUrl){window.location.href=d.checkoutUrl;}
      else{alert(d.error||'Failed to process payment');throw new Error(d.error);}
    });
  };
  document.addEventListener('DOMContentLoaded',function(){
    var urlParams=new URLSearchParams(window.location.search);
    if(urlParams.get('payment')==='success'){
      var pName=urlParams.get('product')||'your item';
      var overlay=document.createElement('div');overlay.id='payment-success-overlay';
      overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999999;font-family:system-ui,-apple-system,sans-serif;';
      overlay.innerHTML='<div style="background:white;border-radius:16px;padding:40px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.15);"><div style="width:64px;height:64px;border-radius:50%;background:#dcfce7;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div><h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#111827;">Payment Successful!</h2><p style="margin:0 0 24px;color:#6b7280;font-size:16px;">Thank you for purchasing '+pName.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'.</p><button onclick="document.getElementById(\'payment-success-overlay\').remove();window.history.replaceState({},\'\',window.location.pathname);" style="padding:12px 32px;font-size:16px;font-weight:600;background:#16a34a;color:white;border:none;border-radius:8px;cursor:pointer;">Continue</button></div>';
      document.body.appendChild(overlay);
    }
  });
})();

// Mock global payment function if not present
        if (typeof window.__processPayment !== 'function') {
            window.__processPayment = function(amountCents, productName, productDescription) {
                console.log("Processing Mock Payment:", { amountCents, productName, productDescription });
                return new Promise(resolve => setTimeout(resolve, 1500));
            };
        }

        document.addEventListener('DOMContentLoaded', () => {
            
            // Scroll Reveal Animation
            const reveals = document.querySelectorAll('.reveal');
            const revealOptions = {
                threshold: 0.1,
                rootMargin: "0px 0px -50px 0px"
            };

            const revealOnScroll = new IntersectionObserver(function(entries, observer) {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                });
            }, revealOptions);

            reveals.forEach(reveal => {
                revealOnScroll.observe(reveal);
            });

            // Modal Logic
            const modal = document.getElementById('checkout-modal');
            const closeBtn = document.getElementById('close-modal');
            const buyButtons = document.querySelectorAll('.buy-btn');
            const paymentForm = document.getElementById('payment-form');
            
            // UI Containers
            const formContainer = document.getElementById('checkout-form-container');
            const processingContainer = document.getElementById('processing-container');
            const successContainer = document.getElementById('success-container');

            // State
            let currentTier = {};

            buyButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    currentTier = {
                        name: btn.getAttribute('data-tier'),
                        priceCents: parseInt(btn.getAttribute('data-price'), 10),
                        desc: btn.getAttribute('data-desc')
                    };

                    document.getElementById('modal-tier-name').innerText = currentTier.name;
                    document.getElementById('modal-price-display').innerText = '$' + (currentTier.priceCents / 100).toFixed(2);
                    
                    // Reset UI
                    formContainer.style.display = 'block';
                    processingContainer.style.display = 'none';
                    successContainer.style.display = 'none';
                    paymentForm.reset();

                    modal.classList.add('active');
                });
            });

            const closeModal = () => {
                modal.classList.remove('active');
            };

            closeBtn.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            // Handle Form Submission
            paymentForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const name = document.getElementById('fullName').value;
                const email = document.getElementById('emailAddress').value;

                if(!name || !email) return;

                // Show processing state
                formContainer.style.display = 'none';
                processingContainer.style.display = 'block';

                try {
                    // Call the requested global function
                    await window.__processPayment(
                        currentTier.priceCents, 
                        currentTier.name, 
                        currentTier.desc
                    );

                    // Show success
                    processingContainer.style.display = 'none';
                    successContainer.style.display = 'block';
                    
                    setTimeout(() => {
                        closeModal();
                    }, 3000);

                } catch (error) {
                    alert("Payment failed. Please try again.");
                    processingContainer.style.display = 'none';
                    formContainer.style.display = 'block';
                }
            });
        });