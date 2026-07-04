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

test("lets users browse tabs and entry details from the portrait app", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "快闪" }).click();
  await expect(page.getByText("当前浏览：快闪")).toBeVisible();
  await expect(page.getByText("平台快闪：周六低压散步")).toBeVisible();

  await page.getByRole("button", { name: "推荐", exact: true }).click();
  await page.getByRole("button", { name: "浏览帖子详情" }).first().click();
  await expect(page.getByRole("dialog", { name: "想整理桌面 10 分钟，有人看见就好详情" })).toBeVisible();
  await page.getByRole("button", { name: "关闭详情" }).click();

  await page.getByRole("button", { name: "浏览推荐任务" }).first().click();
  await expect(page.getByRole("dialog", { name: "咖啡馆安静共坐详情" })).toBeVisible();
  await page.getByRole("button", { name: "关闭详情" }).click();

  await page.getByRole("button", { name: "人格岛" }).click();
  await page.getByRole("button", { name: "浏览岛屿任务：20 分钟低压散步" }).click();
  await expect(page.getByRole("dialog", { name: "20 分钟低压散步详情" })).toBeVisible();
  await page.getByRole("button", { name: "关闭详情" }).click();

  await page.getByRole("button", { name: "搭子 / 小队" }).click();
  await page.getByRole("button", { name: "浏览小队详情" }).first().click();
  await expect(page.getByRole("dialog", { name: "低压散步小队详情" })).toBeVisible();
});

test("uses personality color systems instead of the reference image as a background", async ({ page }) => {
  await page.goto("/");

  const heroBackground = await page.locator(".realm-panel").evaluate((element) => {
    return window.getComputedStyle(element).backgroundImage;
  });
  expect(heroBackground).not.toContain("personality-realms.png");

  await page.getByRole("button", { name: "人格岛" }).click();
  const islandBackgrounds = await page.locator(".island-card").evaluateAll((elements) => {
    return elements.map((element) => window.getComputedStyle(element).backgroundImage);
  });
  expect(islandBackgrounds.join("\n")).not.toContain("personality-realms.png");
});

test("applies the selected personality palette to the whole app shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".app-shell")).toHaveClass(/realm-nf/);
  const initialNavBackground = await page.locator(".side-nav").evaluate((element) => {
    return window.getComputedStyle(element).backgroundImage;
  });

  await page.getByRole("button", { name: "人格岛" }).click();
  await page.getByRole("button", { name: /NT/ }).click();

  await expect(page.locator(".app-shell")).toHaveClass(/realm-nt/);
  const ntNavBackground = await page.locator(".side-nav").evaluate((element) => {
    return window.getComputedStyle(element).backgroundImage;
  });
  expect(ntNavBackground).not.toEqual(initialNavBackground);
});

test("recreates key reference design elements as functional UI modules", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".realm-opening")).toBeVisible();
  await expect(page.getByText("认知维度探索")).toBeVisible();
  await expect(page.locator(".cognition-card")).toHaveCount(4);
  await expect(page.getByText("你的能量光谱")).toBeVisible();
  await expect(page.locator(".energy-node")).toHaveCount(4);
  await expect(page.getByText("今日建设行动")).toBeVisible();
  await expect(page.locator(".action-step")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "查看完整画像" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看疗愈方案" })).toBeVisible();
});
