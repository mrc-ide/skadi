import { test, expect } from '@playwright/test';
import { refreshPage, Slider } from './helpers';

test.beforeEach(refreshPage);

test("moving param slider changes displayed value", async ({ page }) => {
  const slider = new Slider(page, 1);
  expect(await slider.label).toBe("beta");
  const firstValue = await slider.value;

  await slider.move();
  expect(await slider.value).not.toBe(firstValue);
});
