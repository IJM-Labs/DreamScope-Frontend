import { expect, test } from "@playwright/test";

const testUser = {
  userId: "11111111-1111-1111-1111-111111111111",
  email: "e2e-user@example.com",
  nickname: "E2E User",
  message: "Login verified"
};

test("user can log in, accept terms, create a dream, and see it in history", async ({ page }) => {
  const requests = {
    acceptedTerms: 0,
    createdDreams: []
  };

  await page.route("**/api/auth/login", async (route) => {
    expect(route.request().method()).toBe("POST");
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({
      email: testUser.email,
      nickname: testUser.nickname
    });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "One-time code sent. Check your email." })
    });
  });

  await page.route("**/api/auth/verify", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({ code: "123456" });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(testUser)
    });
  });

  await page.route("**/api/terms", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        termsId: "22222222-2222-2222-2222-222222222222",
        version: "2026-05",
        content: "DreamScope test terms",
        createdAt: "2026-05-18T10:00:00.000Z"
      })
    });
  });

  await page.route("**/api/terms/accept-terms", async (route) => {
    requests.acceptedTerms += 1;
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({
      termsId: "22222222-2222-2222-2222-222222222222"
    });

    await route.fulfill({ status: 204 });
  });

  await page.route("**/api/dreams", async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([])
      });
      return;
    }

    if (method === "POST") {
      const body = route.request().postDataJSON();
      requests.createdDreams.push(body);

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          dreamId: "33333333-3333-3333-3333-333333333333",
          threadId: body.threadId,
          title: "Kilimanjaro mountain",
          content: body.content,
          createdAt: "2026-05-18T11:00:00.000Z",
          interpretations: [
            {
              interpretationId: "44444444-4444-4444-4444-444444444444",
              text: "This dream may point to a personal challenge that feels large but meaningful."
            }
          ]
        })
      });
      return;
    }

    await route.fallback();
  });

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Login with your email" })).toBeVisible();

  await page.getByRole("button", { name: "Accept" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.getByRole("textbox", { name: "Name" }).fill(testUser.nickname);
  await page.getByRole("textbox", { name: "Email" }).fill(testUser.email);
  await page.getByRole("button", { name: "Send one-time code" }).click();
  await expect(page.getByText("One-time code sent. Check your email.")).toBeVisible();

  await page.getByLabel("One-time code:").fill("123456");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/dreams$/);
  await expect(page.getByRole("heading", { name: "What did you dream?" })).toBeVisible();
  await expect(requests.acceptedTerms).toBe(1);

  const dreamText = "I dreamt I climbed Kilimanjaro and saw sunrise above the clouds.";
  await page.getByLabel("Write your dream").fill(dreamText);
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText(dreamText)).toBeVisible();
  await expect(page.getByText("This dream may point to a personal challenge")).toBeVisible();
  await expect(page.getByRole("button", { name: "Kilimanjaro mountain" })).toBeVisible();

  expect(requests.createdDreams).toHaveLength(1);
  expect(requests.createdDreams[0]).toMatchObject({ content: dreamText });
});
