async function verify() {
  console.log('--- 1. Testing Static Assets Retrieval ---');
  const assetUrls = [
    'http://localhost:3000/favicon.ico',
    'http://localhost:3000/icon.png',
    'http://localhost:3000/apple-icon.png',
    'http://localhost:3000/og-itclub.png',
    'http://localhost:3000/icon-192.png',
    'http://localhost:3000/icon-512.png',
  ];
  for (const url of assetUrls) {
    try {
      const res = await fetch(url);
      console.log(url, 'Status:', res.status, 'Content-Type:', res.headers.get('content-type'), 'Length:', res.headers.get('content-length'));
    } catch (e) {
      console.error(url, 'Fetch error:', e.message);
    }
  }

  console.log('\n--- 2. Testing Homepage HTML Metadata ---');
  const homeRes = await fetch('http://localhost:3000/');
  const html = await homeRes.text();

  const tagsToFind = [
    'rel="icon"',
    'rel="apple-touch-icon"',
    'property="og:title"',
    'property="og:description"',
    'property="og:url"',
    'property="og:site_name"',
    'property="og:type"',
    'property="og:image"',
    'name="twitter:card"',
    'name="twitter:title"',
    'name="twitter:description"',
    'name="twitter:image"'
  ];

  for (const tag of tagsToFind) {
    const found = html.includes(tag);
    console.log(tag, '-> Present:', found);
  }

  console.log('\n--- 3. Extracting exact metadata tag snippets ---');
  const matches = html.match(/<(meta|link)[^>]+(icon|og:|twitter:|apple-touch-icon)[^>]+>/gi) || [];
  matches.forEach(m => console.log('  ', m));

  console.log('\n--- 4. Testing Public Pages OpenGraph URL and Titles ---');
  const testPages = ['/register', '/tracks', '/process', '/community', '/events', '/sponsors', '/alumni'];
  for (const p of testPages) {
    const res = await fetch('http://localhost:3000' + p);
    const phtml = await res.text();
    const titleMatch = phtml.match(/<title>([^<]+)<\/title>/i);
    const ogTitleMatch = phtml.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    const ogUrlMatch = phtml.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
    console.log(p, '-> Title:', titleMatch ? titleMatch[1] : 'NONE');
    console.log('   og:title:', ogTitleMatch ? ogTitleMatch[1] : 'NONE');
    console.log('   og:url:', ogUrlMatch ? ogUrlMatch[1] : 'NONE');
  }
}

verify().catch(console.error);
