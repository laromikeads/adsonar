'use client';

import { useEffect, useRef } from 'react';
import { TrendingUp, Bookmark, Globe, Play } from 'lucide-react';

const ADSONAR_URL = 'https://adsonar.vercel.app';
const SEARCHES = ['ولاية', 'توصيل', 'كريم تبييض', 'حذاء رياضي', 'مكياج', 'supplement', 'livraison'];

function getCode() {
  const parts = [
    'javascript:(function(){',
    'var H="' + ADSONAR_URL + '";',
    'var c=document.querySelectorAll(\'[data-testid="ad-archive-ad-card"]\');',
    'if(!c.length){c=document.querySelectorAll(\'div[class*="_7jyr"]\');}',
    'if(!c.length){alert("AdSonar: No ads found on this page.");return;}',
    'var a=[];',
    'c.forEach(function(el,i){a.push({id:"a"+i,text:(el.innerText||"").slice(0,500)});});',
    'var encoded=encodeURIComponent(JSON.stringify(a));',
    'var w=window.open(H+"/score?ads="+encoded,"adsonar_score","width=480,height=600,scrollbars=yes");',
    'if(!w){alert("AdSonar: Please allow popups for this site.");}',
    '})();',
  ];
  return parts.join('');
}

function BookmarkButton() {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (linkRef.current) {
      linkRef.current.setAttribute('href', getCode());
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a ref={linkRef} href="#" draggable onClick={function(e){e.preventDefault();}} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-blue-700 cursor-grab select-none"><TrendingUp className="w-4 h-4" /><span>AdSonar Score</span></a>
      <p className="text-xs text-gray-400">drag to bookmarks bar, do not click</p>
    </div>
  );
}

export default function BookmarkletPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">AdSonar Bookmarklet</h1>
        </div>
        <p className="text-gray-500">Score ads on Meta Ad Library directly — sees everything Meta shows.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-blue-900">How it works</h2>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex gap-3"><span className="font-bold">1.</span><span>Open Meta Ad Library and search any product</span></div>
          <div className="flex gap-3"><span className="font-bold">2.</span><span>Click <strong>AdSonar Score</strong> in your bookmarks bar</span></div>
          <div className="flex gap-3"><span className="font-bold">3.</span><span>A popup shows every ad scored: 🔥 Hot, ✅ Good, ~ Weak, ○ Low</span></div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-blue-600" />
          Install
        </h2>
        <div className="space-y-4 text-sm text-gray-700">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <div>
              Show bookmarks bar:
              <code className="bg-gray-100 px-2 py-0.5 rounded ml-1">Ctrl+Shift+B</code> Windows /
              <code className="bg-gray-100 px-2 py-0.5 rounded ml-1">Cmd+Shift+B</code> Mac
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <div className="w-full">
              <p className="mb-3">Drag this button to your bookmarks bar:</p>
              <BookmarkButton />
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
        <p className="text-sm text-gray-500">Click to open Ad Library then use the bookmarklet:</p>
        <div className="flex flex-wrap gap-2">
          {SEARCHES.map((q) => (
            <a key={q} href={'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=DZ&q=' + encodeURIComponent(q) + '&search_type=keyword_unordered'} target="_blank" rel="noopener noreferrer" className="text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 rounded-full px-3 py-1.5 transition-colors">{q} →</a>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
        <Globe className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <span>Works in Chrome, Firefox, and Edge. Allow popups from facebook.com when prompted.</span>
      </div>
    </div>
  );
}
