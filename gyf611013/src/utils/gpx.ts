import type { Trajectory, GpsPoint } from '@/types'

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}Z`
}

export function trajectoryToGpx(trajectory: Trajectory, dogName: string): string {
  const points = trajectory.points
    .map(
      (p: GpsPoint) =>
        `    <trkpt lat="${p.lat}" lon="${p.lng}">${p.altitude ? `\n      <ele>${p.altitude}</ele>` : ''}\n      <time>${isoDate(new Date(p.timestamp))}</time>\n    </trkpt>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Truffle Hound Hotspot" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${dogName} - ${trajectory.date}</name>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>`
}

export function downloadFile(content: string, filename: string, mimeType: string = 'application/gpx+xml') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
