
import React from 'react'
import data from '../store/manga.json'
import SeriesCard from '../components/SeriesCard'
export default function Search(){
  const [q,setQ] = React.useState('')
  const list = data.series.filter(s=> (s.title+' '+s.tags.join(' ')).toLowerCase().includes(q.toLowerCase()))
  return (
    <main className="container-page">
      <div className="flex gap-2 my-3">
        <input className="w-full px-3 py-2 rounded-xl bg-[#0f1219] border border-edge outline-none" placeholder="Cari judul atau tag..." value={q} onChange={e=>setQ(e.target.value)}/>
        <span className="badge self-center">{list.length} judul</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {list.map(s=> <SeriesCard key={s.slug} s={s}/>)}
      </div>
    </main>
  )
}
