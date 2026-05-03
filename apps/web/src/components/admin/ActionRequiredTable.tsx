interface ActionItem {
  priority: string
  priorityType: 'warn' | 'test' | 'draft'
  account: string
  issue: string
  arr: string
  owner: string
}

interface ActionRequiredTableProps {
  items: ActionItem[]
}

export function ActionRequiredTable({ items }: ActionRequiredTableProps) {
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Priority</th>
          <th>Account</th>
          <th>Issue</th>
          <th className="tn">ARR</th>
          <th>Owner</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i}>
            <td>
              <span className={`admin-pill ${item.priorityType}`}>{item.priority}</span>
            </td>
            <td><strong>{item.account}</strong></td>
            <td>{item.issue}</td>
            <td className="tn">{item.arr}</td>
            <td>{item.owner}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
