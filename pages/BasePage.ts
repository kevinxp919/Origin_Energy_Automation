import { Page } from '@playwright/test'

export class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' })
  }

  async closePopups() {
    const closeButtons = await this.page.locator('button[aria-label*="Close"], button[aria-label*="close"]').all()
    for (const button of closeButtons) {
      if (await button.isVisible()) {
        await button.click().catch(() => {})
      }
    }
  }
}
