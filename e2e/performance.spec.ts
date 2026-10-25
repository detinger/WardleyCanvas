import { expect, Page, test } from './fixtures';
import { largeMap } from '../tests/fixtures/large-map';

type PerfWindow = Window & {
  __editorReady?: number;
  __frameDeltas?: number[];
  __samplingFrames?: boolean;
  __pointerLatencies?: number[];
  __pendingPointerAt?: number;
};

const fixture = largeMap();

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

async function nextFrame(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
}

async function exerciseDenseMap(page: Page) {
  const canvas = page.getByRole('group', { name: 'Wardley map canvas' });
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const bounds = box!;

  await page.evaluate(() => {
    const perf = window as PerfWindow;
    perf.__frameDeltas = [];
    perf.__samplingFrames = true;
    let previous = performance.now();
    const sample = (now: number) => {
      if (!perf.__samplingFrames) return;
      perf.__frameDeltas!.push(now - previous);
      previous = now;
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

  // Pan once per animation frame.
  await page.getByRole('button', { name: 'Pan tool (H)' }).click();
  const panX = bounds.x + 24;
  const panY = bounds.y + 24;
  await page.mouse.move(panX, panY);
  await page.mouse.down();
  for (let i = 1; i <= 30; i++) {
    await page.mouse.move(panX + i * 2, panY + i * 0.5);
    await nextFrame(page);
  }
  await page.mouse.up();

  // Exercise the wheel-zoom path once per animation frame.
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  for (let i = 0; i < 24; i++) {
    await page.mouse.wheel(0, i % 2 === 0 ? -18 : 18);
    await nextFrame(page);
  }

  // Measure pointer-event-to-DOM-preview latency while dragging the topmost
  // fixture component. The observer timestamp excludes Playwright round trips.
  await page.getByRole('button', { name: 'Select tool (S)' }).click();
  const target = canvas.getByRole('button', { name: 'Component 199', exact: true });
  const targetCircle = target.locator('circle').last();
  const targetBox = await targetCircle.boundingBox();
  expect(targetBox).not.toBeNull();

  await page.evaluate(() => {
    const perf = window as PerfWindow;
    const svg = document.querySelector<SVGSVGElement>('svg[aria-label="Wardley map canvas"]')!;
    const groups = Array.from(svg.querySelectorAll<SVGGElement>('g[role="button"]'));
    const targetGroup = groups.find((group) => group.getAttribute('aria-label') === 'Component 199')!;
    const shape = targetGroup.querySelector('circle')!;
    perf.__pointerLatencies = [];
    perf.__pendingPointerAt = undefined;
    svg.addEventListener('pointermove', () => {
      perf.__pendingPointerAt = performance.now();
    }, true);
    new MutationObserver(() => {
      if (perf.__pendingPointerAt === undefined) return;
      perf.__pointerLatencies!.push(performance.now() - perf.__pendingPointerAt);
      perf.__pendingPointerAt = undefined;
    }).observe(shape, { attributes: true, attributeFilter: ['cx', 'cy'] });
  });

  const dragX = targetBox!.x + targetBox!.width / 2;
  const dragY = targetBox!.y + targetBox!.height / 2;
  await page.mouse.move(dragX, dragY);
  await page.mouse.down();
  for (let i = 1; i <= 30; i++) {
    await page.mouse.move(dragX + i * 0.7, dragY - i * 0.25);
    await nextFrame(page);
  }
  await page.mouse.up();
  await nextFrame(page);

  return page.evaluate(() => {
    const perf = window as PerfWindow;
    perf.__samplingFrames = false;
    return {
      frameDeltas: perf.__frameDeltas ?? [],
      pointerLatencies: perf.__pointerLatencies ?? [],
    };
  });
}

test('dense editor meets browser interaction budgets', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Chromium is the documented performance baseline');

  await page.addInitScript((map) => {
    localStorage.setItem('wardleyStudio.maps', JSON.stringify({
      [map.id]: { current: map, versions: [] },
    }));

    const perf = window as PerfWindow;
    const markReady = () => {
      const canvas = document.querySelector('svg[aria-label="Wardley map canvas"]');
      const toolbar = document.querySelector('[role="toolbar"][aria-label="Map editor toolbar"]');
      const elements = canvas?.querySelectorAll('[role="button"]').length ?? 0;
      if (canvas && toolbar && elements === 200) {
        perf.__editorReady = performance.now();
      } else {
        requestAnimationFrame(markReady);
      }
    };
    requestAnimationFrame(markReady);
  }, fixture);

  // Prime the production assets and route, then measure five warm reloads.
  await page.goto(`/maps/${fixture.id}`);
  await expect(page.getByRole('toolbar', { name: 'Map editor toolbar' })).toBeVisible();
  await page.waitForLoadState('networkidle');

  const readyTimes: number[] = [];
  for (let i = 0; i < 5; i++) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof (window as PerfWindow).__editorReady === 'number');
    readyTimes.push(await page.evaluate(() => (window as PerfWindow).__editorReady!));
  }

  const { frameDeltas, pointerLatencies } = await exerciseDenseMap(page);
  const medianFrameMs = percentile(frameDeltas, 0.5);
  const medianFps = 1000 / medianFrameMs;
  const pointerP95 = percentile(pointerLatencies, 0.95);
  const readyP95 = percentile(readyTimes, 0.95);

  console.log('BROWSER_PERF_REPORT', JSON.stringify({
    readyP95: Math.round(readyP95 * 100) / 100,
    medianFps: Math.round(medianFps * 100) / 100,
    pointerP95: Math.round(pointerP95 * 100) / 100,
    frames: frameDeltas.length,
    pointerSamples: pointerLatencies.length,
  }));

  expect(readyP95, 'warm editor readiness p95').toBeLessThanOrEqual(2500);
  expect(frameDeltas.length, 'sampled animation frames').toBeGreaterThanOrEqual(60);
  expect(medianFps, 'dense pan/zoom/drag median FPS').toBeGreaterThanOrEqual(55);
  expect(pointerLatencies.length, 'drag preview latency samples').toBeGreaterThanOrEqual(20);
  expect(pointerP95, 'pointer-to-preview p95').toBeLessThanOrEqual(50);
});
