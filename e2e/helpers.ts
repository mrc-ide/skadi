import { Locator, Page } from "@playwright/test";

type PlaywrightCtx = { page: Page }
export const refreshPage = async ({ page }: PlaywrightCtx) =>
  await page.goto("http://localhost:5173/example/build/index.html")

export class Slider {
  // L for locator
  sliderL: Locator;
  labelL: Locator;
  valueL: Locator;
  thumbL: Locator;

  constructor(page: Page, n: number) {
    this.sliderL = page.locator(`:nth-match(.SliderRoot, ${n})`);
    this.labelL = this.sliderL.locator(".SliderLabel").locator("label");
    this.valueL = this.sliderL.locator(".SliderLabel").locator("div");
    this.thumbL = this.sliderL.locator(".SliderThumb");
  };

  get label() {
    return this.labelL.textContent()
  };

  get value() {
    return this.valueL.textContent()
  };

  async move() {
    await this.thumbL.dragTo(this.valueL);
  }
}
