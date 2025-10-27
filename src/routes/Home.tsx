
import React from 'react'
import data from '../store/manga.json'
import Carousel from '../components/Carousel'
import SeriesCard from '../components/SeriesCard'
export default function Home(){
  const items = data.series.slice(0,5).map(s=>({title:s.title, cover:s.cover, href:`/manga/${s.slug}`}))
  const riwayat = (JSON.parse(localStorage.getItem('mr.history')||'[]') as any[]).slice(0,6)
  return (
    <main className="container-page space-y-6">
      <Carousel items={items}/>
      {riwayat.length>0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Riwayat Baca</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {riwayat.map((h:any,i:number)=>(
              <a key={i} href={`/manga/${h.slug}`} className="card">
                <img src={h.cover} alt={h.title} className="w-full aspect-[3/4] object-cover"/>
                <div className="p-2 text-sm">{h.title}</div>
              </a>
            ))}
          </div>
        </section>
      )}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Rekomendasi</h2>
          <a className="btn" href="/komik">Lihat Semua</a>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {data.series.map(s=> <SeriesCard key={s.slug} s={s}/>)}
        </div>
      </section>
    </main>
  )
}
