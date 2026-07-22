import { test, expect } from '@playwright/test';
import { Plot, refreshPage, Slider } from './helpers';

test.beforeEach(refreshPage);

test("moving param slider changes graph", async ({ page }) => {
  const plot = new Plot(page, 1);
  const slider = new Slider(page, 1);

  const trace = await plot.trace;

  await slider.move();

  expect(await plot.trace).not.toBe(trace);
});
