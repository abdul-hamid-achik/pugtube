import React from 'react'

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 105 30" {...props}>
      <text x="0" y="20" font-family="Verdana" font-size="20" fill="#2563EB">
        pug
      </text>
      <text x="40" y="20" font-family="Verdana" font-size="20" fill="#0F172A">
        tube
      </text>
    </svg>
  )
}
