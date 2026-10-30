import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png' };
const names = ['index.html', 'ai.html', 'drama.html', 'recommend.html', 'story.html', 'styles.css', 'voice-config.js', 'ai.js', 'recommend.js', 'keyword-menu.js', 'story.js', 'grid-scan.js', 'chladni-tune.js', 'gallery.js', 'home.js', 'tech-text.js', 'swarm-cursor.js', 'motion.js', 'particle-drift.js', 'flux-lines.js', 'flying-posters.js', 'soda-atmosphere.js', 'assets/provisional-government.png', 'assets/eras/three-kingdoms.jpg', 'assets/eras/goryeo.jpg', 'assets/eras/joseon.jpg', 'assets/eras/open-port.jpg', 'assets/eras/korean-empire.jpg'];
const assets = {};
for (const name of names) {
  const ext = name.slice(name.lastIndexOf('.'));
  const body = await readFile(resolve(dist, name));
  assets[`/${name}`] = ext === '.jpg' || ext === '.png'
    ? { type: types[ext], body: body.toString('base64'), encoding: 'base64' }
    : { type: types[ext], body: body.toString('utf8') };
}
const source = await readFile(resolve(root, 'worker/index.js'), 'utf8');
const baseDramas = JSON.parse(await readFile(resolve(root, 'data/dramas.json'), 'utf8'));
const dramaAdditions = JSON.parse(await readFile(resolve(root, 'data/drama-additions.json'), 'utf8'));
const storyGroups = JSON.parse(await readFile(resolve(root, 'data/story-groups.json'), 'utf8'));
const groupTitles = new Map(storyGroups.flatMap((group) => group.titles.map((title) => [title.normalize('NFKC'), group.titles[0]])));
const dramaDatabase = [...baseDramas, ...dramaAdditions].map((drama) => ({
  ...drama,
  country: drama.country || '대한민국',
  aliases: [...new Set([...(drama.aliases || []), drama.title])],
  storyAnchor: drama.storyAnchor || groupTitles.get(drama.title.normalize('NFKC')) || drama.title,
  mainCharacters: drama.mainCharacters || [],
}));
const manifest = JSON.parse(await readFile(resolve(root, '.openai/hosting.json'), 'utf8'));
if (manifest.static) throw new Error('Worker manifest must not declare static.directory');
await mkdir(resolve(dist, 'server'), { recursive: true });
await mkdir(resolve(dist, '.openai'), { recursive: true });
await writeFile(resolve(dist, 'server/index.js'), `const STATIC_ASSETS = ${JSON.stringify(assets)};\nconst DRAMA_DATABASE = ${JSON.stringify(dramaDatabase)};\nconst STORY_GROUPS = ${JSON.stringify(storyGroups)};\n${source}`);
await writeFile(resolve(dist, '.openai/hosting.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Built Worker with ${names.length} assets and ${dramaDatabase.length} drama records`);
