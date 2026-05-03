interface FeedItem {
  time: string
  message: string
  meta: string
}

interface LiveFeedProps {
  items: FeedItem[]
}

export function LiveFeed({ items }: LiveFeedProps) {
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="act-item">
          <div className="act-ts">{item.time}</div>
          <div className="act-msg" dangerouslySetInnerHTML={{ __html: item.message }} />
          <div className="act-meta">{item.meta}</div>
        </div>
      ))}
    </>
  )
}
