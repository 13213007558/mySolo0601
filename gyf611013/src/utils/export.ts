import JSZip from 'jszip'
import type { Hotspot, Trajectory, Dog } from '@/types'
import { trajectoryToGpx, downloadFile } from './gpx'

export async function exportArbitrationPackage(
  hotspots: Hotspot[],
  trajectories: Trajectory[],
  dogs: Dog[],
  date: string
) {
  const zip = new JSZip()

  const confirmedHotspots = hotspots.filter(
    (h) => h.status === 'confirmed' || h.status === 'over_limit' || h.status === 'expired' || h.status === 'mismatch'
  )

  const gpxFolder = zip.folder('trajectories')!
  trajectories.forEach((traj) => {
    const dog = dogs.find((d) => d.id === traj.dogId)
    const gpxContent = trajectoryToGpx(traj, dog?.name ?? 'unknown')
    gpxFolder.file(`${dog?.name ?? traj.dogId}_${date}.gpx`, gpxContent)
  })

  const photosFolder = zip.folder('photos')!
  confirmedHotspots.forEach((hs) => {
    if (hs.photoUrl) {
      photosFolder.file(
        `${hs.id}.txt`,
        `照片URL: ${hs.photoUrl}\n坐标: ${hs.photoLat}, ${hs.photoLng}\n项圈坐标: ${hs.lat}, ${hs.lng}\n偏差: ${hs.coordDeviation}米\n状态: ${hs.status}\n检测时间: ${new Date(hs.detectedAt).toISOString()}\n确认时间: ${hs.confirmedAt ? new Date(hs.confirmedAt).toISOString() : 'N/A'}`
      )
    }
  })

  const summaryData = confirmedHotspots.map((hs) => ({
    id: hs.id,
    dogId: hs.dogId,
    dogName: dogs.find((d) => d.id === hs.dogId)?.name,
    status: hs.status,
    collarCoord: { lat: hs.lat, lng: hs.lng },
    photoCoord: hs.photoLat ? { lat: hs.photoLat, lng: hs.photoLng } : null,
    deviation: hs.coordDeviation,
    detectedAt: new Date(hs.detectedAt).toISOString(),
    confirmedAt: hs.confirmedAt ? new Date(hs.confirmedAt).toISOString() : null,
  }))

  zip.file('summary.json', JSON.stringify(summaryData, null, 2))

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `仲裁包_${date}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
