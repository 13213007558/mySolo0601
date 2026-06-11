export async function getCurrentGps(): Promise<{ lat: number; lng: number }> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return { lat: 0, lng: 0 };
  }
  return new Promise((resolve) => {
    const fallback = () => {
      resolve({
        lat: 30.6321 + (Math.random() * 0.002 - 0.001),
        lng: 122.3844 + (Math.random() * 0.002 - 0.001),
      });
    };
    const timer = setTimeout(fallback, 1500);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        fallback();
      },
      { timeout: 1500 }
    );
  });
}
