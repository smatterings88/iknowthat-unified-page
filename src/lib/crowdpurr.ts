export function buildCrowdpurrUrl(nickname: string, email: string) {
  const url = new URL(import.meta.env.VITE_CROWDPURR_URL);
  url.searchParams.set("f", nickname);
  url.searchParams.set("e", email);
  return url.toString();
}
