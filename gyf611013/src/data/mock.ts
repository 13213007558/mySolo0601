import type { Dog, Farmer, Cooperative, Trajectory, Hotspot } from '@/types'

const BASE_LAT = 44.3615
const BASE_LNG = 2.5738

export const cooperative: Cooperative = {
  id: 'coop-1',
  name: '佩里戈尔松露合作社',
  leaderId: 'farmer-1',
  defaultDailyLimit: 5,
  defaultShareRatio: 0.6,
}

export const farmers: Farmer[] = [
  { id: 'farmer-1', name: '杜邦·皮埃尔', phone: '+33 6 12 34 56 78', cooperativeId: 'coop-1' },
  { id: 'farmer-2', name: '马丁·让', phone: '+33 6 23 45 67 89', cooperativeId: 'coop-1' },
  { id: 'farmer-3', name: '贝尔纳·苏菲', phone: '+33 6 34 56 78 90', cooperativeId: 'coop-1' },
]

export const dogs: Dog[] = [
  { id: 'dog-1', name: '诺瓦', breed: '拉戈托罗马阁挪露犬', collarId: 'COL-001', farmerId: 'farmer-1', age: 4, shareRatio: 0.6, dailyHotspotLimit: 5, avatarColor: '#1B4332' },
  { id: 'dog-2', name: '可可', breed: '拉戈托罗马阁挪露犬', collarId: 'COL-002', farmerId: 'farmer-2', age: 3, shareRatio: 0.55, dailyHotspotLimit: 5, avatarColor: '#7C3AED' },
  { id: 'dog-3', name: '松露', breed: '法国斗牛犬', collarId: 'COL-003', farmerId: 'farmer-3', age: 5, shareRatio: 0.5, dailyHotspotLimit: 4, avatarColor: '#B45309' },
  { id: 'dog-4', name: '露娜', breed: '英国史宾格犬', collarId: 'COL-004', farmerId: 'farmer-1', age: 2, shareRatio: 0.65, dailyHotspotLimit: 5, avatarColor: '#0369A1' },
]

function generateTrajectoryPoints(dogId: string, date: string, seed: number): Trajectory {
  const points = []
  const rng = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297 + 233280) * 49297
    return x - Math.floor(x)
  }

  let lat = BASE_LAT + (rng(1) - 0.5) * 0.02
  let lng = BASE_LNG + (rng(2) - 0.5) * 0.02
  const baseTime = new Date(date + 'T06:00:00').getTime()

  for (let i = 0; i < 120; i++) {
    lat += (rng(i * 3 + 10) - 0.48) * 0.0008
    lng += (rng(i * 3 + 20) - 0.48) * 0.0008
    points.push({
      lat,
      lng,
      timestamp: baseTime + i * 300000,
      altitude: 350 + rng(i * 3 + 30) * 200,
      speed: rng(i * 3 + 40) * 3,
    })
  }
  return { id: `traj-${dogId}-${date}`, dogId, date, points }
}

function generateHotspots(trajectory: Trajectory, seed: number): Hotspot[] {
  const points = trajectory.points
  const hotspots: Hotspot[] = []
  const rng = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297 + 233280) * 49297
    return x - Math.floor(x)
  }

  const hotspotIndices = [15, 35, 55, 72, 95]
  const statuses: Hotspot['status'][] = ['confirmed', 'pending', 'expired', 'confirmed', 'over_limit']

  hotspotIndices.forEach((idx, i) => {
    if (idx >= points.length) return
    const point = points[idx]
    const status = statuses[i % statuses.length]
    const detectedAt = point.timestamp

    hotspots.push({
      id: `hs-${trajectory.dogId}-${trajectory.date}-${i}`,
      dogId: trajectory.dogId,
      trajectoryId: trajectory.id,
      lat: point.lat,
      lng: point.lng,
      detectedAt,
      confirmedAt: status === 'confirmed' ? detectedAt + 180000 : null,
      photoUrl: status === 'confirmed'
        ? `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('truffle found in forest soil close-up earthy tones')}&image_size=square`
        : null,
      photoLat: status === 'confirmed' ? point.lat + (rng(i * 7) - 0.5) * 0.0001 : null,
      photoLng: status === 'confirmed' ? point.lng + (rng(i * 7 + 1) - 0.5) * 0.0001 : null,
      coordDeviation: status === 'confirmed' ? Math.round(rng(i * 7 + 2) * 25 + 2) : null,
      status,
      countdownRemaining: status === 'pending' ? 600 - Math.floor(rng(i * 5) * 300) : 0,
    })
  })

  return hotspots
}

const today = new Date().toISOString().split('T')[0]
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

export const trajectories: Trajectory[] = [
  generateTrajectoryPoints('dog-1', today, 1),
  generateTrajectoryPoints('dog-2', today, 2),
  generateTrajectoryPoints('dog-3', today, 3),
  generateTrajectoryPoints('dog-4', today, 4),
  generateTrajectoryPoints('dog-1', yesterday, 5),
  generateTrajectoryPoints('dog-2', yesterday, 6),
]

export const hotspots: Hotspot[] = [
  ...generateHotspots(trajectories[0], 10),
  ...generateHotspots(trajectories[1], 20),
  ...generateHotspots(trajectories[2], 30),
  ...generateHotspots(trajectories[3], 40),
  ...generateHotspots(trajectories[4], 50),
  ...generateHotspots(trajectories[5], 60),
]

export const mapCenter: [number, number] = [BASE_LAT, BASE_LNG]
