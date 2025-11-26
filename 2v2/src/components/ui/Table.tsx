import { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

const Table = ({ children, className = '' }: TableProps) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-4 border-border">
        {children}
      </table>
    </div>
  )
}

const TableHeader = ({ children }: { children: ReactNode }) => {
  return (
    <thead className="bg-bg-secondary">
      <tr>{children}</tr>
    </thead>
  )
}

const TableBody = ({ children }: { children: ReactNode }) => {
  return <tbody>{children}</tbody>
}

const TableRow = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <tr className={`border-t-4 border-border hover:bg-bg-secondary/50 transition-colors ${className}`}>
      {children}
    </tr>
  )
}

const TableHead = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <th className={`px-4 py-3 text-left font-mono text-sm text-neon-green font-bold ${className}`}>
      {children}
    </th>
  )
}

const TableCell = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  return (
    <td className={`px-4 py-3 font-mono text-sm text-white ${className}`}>
      {children}
    </td>
  )
}

Table.Header = TableHeader
Table.Body = TableBody
Table.Row = TableRow
Table.Head = TableHead
Table.Cell = TableCell

export default Table
