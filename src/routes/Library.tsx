
import React from 'react'
import data from '../store/manga.json'
import { fav } from '../utils/store'
import SeriesCard from '../components/SeriesCard'
export default function Library(){
  const [favs,setFavs] = React.useState<string[]>(fav.list())
  React.useEffect(()=>{ const t=setInterval(()=>setFavs(fav.list()),500); return ()=>clearInterval(t)},[])
  const list = data.series.filter(s=> favs.includes(s.slug))
  return (
    <main className="container-page">
      <h1 className="text-lg font-semibold mb-2">Daftar Bacaan</h1>
      {list.length===0 ? <p className="muted">Belum ada favorit. Buka judul lalu tekan ❤️ untuk tambah.</p> : null}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {list.map(s=> <SeriesCard key={s.slug} s={s}/>)}
      </div>
    </main>
  )
}
