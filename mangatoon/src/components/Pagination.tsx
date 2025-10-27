
import React from 'react'
export default function Pagination({ total, page, perPage, onPage, onPerPage }:
  { total:number; page:number; perPage:number; onPage:(p:number)=>void; onPerPage:(pp:number)=>void }){
  const pages = Math.max(1, Math.ceil(total / perPage))
  const btn = 'px-3 py-2 rounded-lg border border-edge'
  const display = Array.from({length: pages}).slice(0, 10).map((_,i)=>i+1)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className={btn} onClick={()=>onPage(Math.max(1,page-1))} disabled={page===1}>←</button>
      {display.map(n=>(<button key={n} className={`${btn} ${n===page?'bg-[#1a2130]':''}`} onClick={()=>onPage(n)}>{n}</button>))}
      <button className={btn} onClick={()=>onPage(Math.min(pages,page+1))} disabled={page===pages}>→</button>
      <span className="ml-2 text-sm text-muted">Total {total} episode</span>
      <select className="ml-auto btn" value={perPage} onChange={e=>onPerPage(Number(e.target.value))}>
        {[10,20,30,50].map(v=>(<option key={v} value={v}>{v}/hal</option>))}
      </select>
    </div>
  )
}
