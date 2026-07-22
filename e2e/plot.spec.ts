import { test, expect } from '@playwright/test';
import { Plot, refreshPage } from './helpers';

test.beforeEach(refreshPage);

test("syncs y axis on zoom", async ({ page }) => {
  const plots = [1, 2, 3].map(x => new Plot(page, x));
  const xTicks = await Promise.all(plots.map(p => p.tickX));
  const yTicks = await Promise.all(plots.map(p => p.tickY));

  await plots[0].zoomIn();

  const newXTicks = await Promise.all(plots.map(p => p.tickX));
  const newYTicks = await Promise.all(plots.map(p => p.tickY));

  // all are equal at the start and end of zoom (i.e. they are synced)
  expect(Array(3).fill(yTicks[0])).toStrictEqual(yTicks);
  expect(Array(3).fill(newYTicks[0])).toStrictEqual(newYTicks);

  // x ticks synced at the start
  expect(Array(3).fill(xTicks[0])).toStrictEqual(xTicks);

  // plot has zoomed in on x axis
  expect(xTicks[0]).not.toBe(newXTicks[0]);

  // two plots with same id still sync x axis
  expect(newXTicks[0]).toBe(newXTicks[1]);

  // plots without same id do not sync x axis
  expect(newXTicks[0]).not.toBe(newXTicks[2]);
});
