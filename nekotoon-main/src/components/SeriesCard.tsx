
import React from 'react'
import { Link } from 'react-router-dom'
export default function SeriesCard({ s }:{ s:any }){
  return (
    <Link to={`/manga/${s.slug}`} className="card">
      <img src={s.cover} alt={s.title} className="w-full aspect-[3/4] object-cover"/>
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div><div className="font-semibold">{s.title}</div><div className="muted">{s.tags.join(' • ')}</div></div>
          <span className="badge">{s.chapters.length} ep</span>
        </div>
      </div>
    </Link>
  )
}
