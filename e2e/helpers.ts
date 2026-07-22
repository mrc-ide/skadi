import { Locator, Page } from "@playwright/test";

type PlaywrightCtx = { page: Page }
export const refreshPage = async ({ page }: PlaywrightCtx) =>
  await page.goto("http://localhost:5173/example/build/index.html")

export class Slider {
  // L for locator
  private sliderL: Locator;
  private labelL: Locator;
  private valueL: Locator;
  private thumbL: Locator;

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

export class Plot {
  private plotL: Locator;
  private tickXL: Locator;
  private tickYL: Locator;
  private firstTraceL: Locator;

  constructor(private page: Page, n: number) {
    this.plotL = page.locator(`:nth-match(.w-plot, ${n})`);
    this.tickXL = this.plotL.locator(`g[id^="x-axes"]`);
    this.tickYL = this.plotL.locator(`g[id^="y-axes"]`);
    this.firstTraceL = this.plotL.locator(`path[id^="trace"]`).first();
  };

  get tickX() {
    return this.tickXL.textContent()
  };

  get tickY() {
    return this.tickYL.textContent()
  };

  get trace() {
    return this.firstTraceL.getAttribute("d");
  };

  async zoomIn() {
    const box = await this.plotL.boundingBox();
    if (!box) throw new Error("No box found for plot");
    const { width, height } = box;
    await this.plotL.hover({
      position: { x: width * 0.25, y: height * 0.25 }
    });
    await this.page.mouse.down();
    await this.plotL.hover({
      position: { x: width * 0.75, y: height * 0.75 }
    });
    await this.page.waitForTimeout(100);
    await this.page.mouse.up();
    // wait 500ms for zoom animation
    await this.page.waitForTimeout(500);
  }
}
