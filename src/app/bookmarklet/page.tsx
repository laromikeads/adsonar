'use client';

import { TrendingUp, Bookmark, Globe, Play } from 'lucide-react';

const ADSONAR_URL = 'https://adsonar.vercel.app';

const code = [
  "javascript:(function(){",
  "var HOST='" + ADSONAR_URL + "';",
  "var ads=[];",
  "var cards=document.querySelectorAll('[data-testid=\"ad-archive-ad-card\"]');",
  "if(!cards.length){cards=document.querySelectorAll('div[class*=\"_7jyr\"]');}",
  "if(!cards.length){alert('AdSonar: No ad cards found. Make sure you are on Meta Ad Library with results loaded.');return;}",
  "cards.forEach(function(card,i){var text=card.innerText||'';var pageName=(card.querySelector('a[href*=\"facebook.com\"]')||{}).textContent||'Ad '+(i+1);ads.push({id:'ad_'+i,text:text.slice(0,500),pageName:pageName.trim()});});",
  "fetch(HOST+'/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ads:ads})})",
  ".then(function(r){return r.json();})",
  ".then(function(data){",
  "data.results.forEach(function(r,i){",
  "var card=cards[i];if(!card)return;",
  "card.style.position='relative';",
  "var old=card.querySelector('.adsonar-badge');if(old)old.remove();",
  "var badge=document.createElement('div');",
  "badge.className='adsonar-badge';",
  "badge.style.cssText='position:absolute;top:8px;right:8px;z-index:9999;padding:4px 10px;border-radius:20px;font-size:13px;font-weight:700;font-family:sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.2);background:#fff;border:2px solid '+r.color+';color:'+r.color+';';",
  "badge.textContent=r.label+(r.score>0?' ('+r.score+')':'');",
  "card.appendChild(badge);});",
  "var hot=data.results.filter(function(r){return r.score>=75;}).length;",
  "alert('AdSonar scored '+ads.length+' ads. '+hot+' are Hot sourcing opportunities!');",
  "}).catch(function(e){alert('AdSonar error: '+e.message);});",
  "})();"
].join('');

const SEARCHES = [
  'ولاية', 'توصيل', 'كريم تبييض', 'حذاء رياضي', 'مكياج', 'supplement', 'livraison',
];

export default function BookmarkletPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">

      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">AdSonar Bookmarklet</h1>
        </div>
        <p className="text-gray-500">
          Score ads directly on Meta Ad Library — sees everything Meta shows, not just the API.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-blue-900">How it works</h2>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex gap-3">
            <span className="font-bold">1.</span>
            <span>Open Meta Ad Library and search any product (e.g. &ldquo;ولاية&rdquo;, &ldquo;توصيل&rdquo;)</span>
          </div>
          <div className="flex gap-3">
            <span className="font-bold">2.</span>
            <span>Click <strong>AdSonar Score</strong> in your bookmarks bar</span>
          </div>
          <div className="flex gap-3">
            <span className="font-bold">3.</span>
            <span>Every ad gets a sourcing score badge — 🔥 Hot, ✅ Good, ~ Weak, ○ Low</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-blue-600" />
          Install — 3 steps
        </h2>

        <div className="space-y-4 text-sm text-gray-700">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <div>
              Show your bookmarks bar:<br />
              <code className="bg-gray-100 px-2 py-0.5 rounded">Ctrl+Shift+B</code> on Windows &nbsp;|&nbsp;
              <code className="bg-gray-100 px-2 py-0.5 rounded">Cmd+Shift+B</code> on Mac
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <div className="w-full">
              <p className="mb-3">Drag this button to your bookmarks bar:</p>
              <div className="flex justify-center">
                
                  href={code}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-blue-700 cursor-grab select-none"
                  onClick={(e) => { e.preventDefault(); alert('Drag this button to your bookmarks bar — do not click it here!'); }}
                >
                  <TrendingUp className="w-4 h-4" />
                  AdSonar Score
                </a>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">drag to your bookmarks bar</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span>Go to Meta Ad Library, search a product, wait for results, then click <strong>AdSonar Score</strong>.</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Play className="w-5 h-5 text-green-600" />
          Open Meta Ad Library
        </h2>
        <p className="text-sm text-gray-500">Click a search to open Ad Library, then use the bookmarklet:</p>
        <div className="flex flex-wrap gap-2">
          {SEARCHES.map((q) => (
            
              key={q}
              href={`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=DZ&q=${encodeURIComponent(q)}&search_type=keyword_unordered`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 rounded-full px-3 py-1.5 transition-colors"
            >
              {q} →
            </a>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
        <Globe className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <span>Works in Chrome, Firefox, and Edge. You must be logged into Facebook to see Ad Library results.</span>
      </div>

    </div>
  );
}
