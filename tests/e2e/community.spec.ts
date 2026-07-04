import { expect, test } from "@playwright/test";

test("renders the MVP community shell and keeps navigation simplified", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "任务广场" })).toBeVisible();
  await expect(page.getByRole("button", { name: "人格岛" })).toBeVisible();
  await expect(page.getByRole("button", { name: "搭子 / 小队" })).toBeVisible();
  await expect(page.getByText("我的复盘")).toHaveCount(0);
  await expect(page.locator(".section-heading .eyebrow", { hasText: "社区大厅" })).toBeVisible();
});

test("presents the site as a portrait app shell inside the web page", async ({ page }) => {
  await page.goto("/");

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  const shellBox = await page.locator(".app-shell").boundingBox();
  const navBox = await page.locator(".side-nav").boundingBox();

  expect(shellBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  expect(shellBox!.width).toBeLessThanOrEqual(Math.min(viewport!.width, 460));
  expect(navBox!.y).toBeGreaterThan(viewport!.height - 130);

  if (viewport!.width > 700) {
    const shellCenter = shellBox!.x + shellBox!.width / 2;
    expect(Math.abs(shellCenter - viewport!.width / 2)).toBeLessThan(24);
  }
});

test("publishes a task and displays recommended recipients", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "发布" }).click();
  await page.getByRole("button", { name: "发任务帖" }).click();
  await page.getByLabel("标题").fill("想找一个安静陪走的低压散步任务");
  await page.getByRole("button", { name: "发布到任务广场" }).click();

  await expect(page.getByText("想找一个安静陪走的低压散步任务").first()).toBeVisible();
  await expect(page.getByText("已为这条任务推荐给")).toBeVisible();
  await expect(page.locator(".recipient-row span", { hasText: "林澈" })).toBeVisible();
});

test("supports personality island and team participation flows", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "人格岛" }).click();
  await page.getByRole("button", { name: /NT/ }).click();
  await expect(page.getByText("理性决策清单")).toBeVisible();

  await page.getByRole("button", { name: "搭子 / 小队" }).click();
  await page.getByRole("button", { name: "加入小队" }).click();
  await expect(page.getByText("已加入低压散步小队")).toBeVisible();
});

test("mobile layout does not horizontally overflow", async ({ page }) => {
  await page.goto("/");

  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 1;
  });

  expect(hasHorizontalOverflow).toBe(false);
});
