
import React from 'react'
export default function Carousel({ items }:{items:{title:string; cover:string; href:string}[]}){
  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto px-1 scrollbar-none snap-x snap-mandatory">
        {items.map((it,i)=>(
          <a key={i} href={it.href} className="min-w-full sm:min-w-[520px] snap-center">
            <div className="relative">
              <img src={it.cover} alt={it.title} className="w-full aspect-[16/7] object-cover rounded-2xl border border-edge"/>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl">
                <div className="font-semibold">{it.title}</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
