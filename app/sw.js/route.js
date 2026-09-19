export async function GET() {
  const content = `self.options = {
    "domain": "3nbf4.com",
    "zoneId": 11840114
}
self.lary = ""
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw')`;

  return new Response(content, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/'
    }
  });
}
