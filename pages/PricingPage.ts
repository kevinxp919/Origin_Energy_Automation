import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

const STABILIZE_DELAY = 2000;

export class PricingPage extends BasePage {
  readonly addressSearchInput: Locator
  readonly addressSearchResults: Locator
  readonly addressSearchResultItem: Locator
  readonly electricityCheckbox: Locator
  readonly gasCheckbox: Locator
  readonly plansContainer: Locator
  readonly planBpidLinks: Locator

  constructor(page: Page) {
    super(page);

    this.addressSearchInput = page.locator('#address-lookup');
    this.addressSearchResults = page.locator('[role=listbox]');
    this.addressSearchResultItem = page.locator('li[role=option]');
    this.electricityCheckbox = page.locator('input[name="elc-checkbox"]').first();
    this.gasCheckbox = page.locator('input[name="gas-checkbox"]').first();
    this.plansContainer = page.locator('table[data-id="plan-info-table-desktop"]');
    this.planBpidLinks = page.locator('table a[href*=".pdf"]');
  }

  async navigate() {
    await this.goto('/pricing.html')
    await this.closePopups()
    await this.page.waitForTimeout(1000)
  }

  async searchAddress(address: string) {
    await this.addressSearchInput.click()
    await this.addressSearchInput.fill(address)
    await this.addressSearchResults.waitFor({ state: 'visible', timeout: 10000 })
    await this.page.waitForTimeout(300)
  }

  async getSearchResults(): Promise<string[]> {
    await this.addressSearchResults.waitFor({ state: 'visible' })
    return await this.addressSearchResultItem.allTextContents()
  }

  async selectAddress(addressIndex: number = 0) {
    const items = await this.addressSearchResultItem.all()
    if (items.length === 0) throw new Error('No address search results found')
    if (addressIndex >= items.length) throw new Error(`Address index ${addressIndex} out of range`)
    await items[addressIndex].click()
    await this.page.waitForTimeout(2000)
  }

  async verifyPlansDisplayed(): Promise<number> {
    await expect(this.plansContainer).toBeVisible()
    const planCount = await this.planBpidLinks.count()
    if (planCount === 0) throw new Error('No plans found on the page')
    return planCount
  }

  async uncheckElectricity() {
    const currentState = await this.electricityCheckbox.isChecked()
    if (currentState !== false) {
      await this.electricityCheckbox.click()
      await this.page.waitForTimeout(STABILIZE_DELAY)
    }
  }

  async verifyPlansStillVisible(): Promise<number> {
    const planCount = await this.planBpidLinks.count()
    expect(planCount).toBeGreaterThan(0)
    return planCount
  }

  async clickPlanBpidLink(planIndex: number = 0) {
    const links = await this.planBpidLinks.all()
    if (links.length === 0) throw new Error('No plan links found')
    if (planIndex >= links.length) throw new Error(`Plan index ${planIndex} out of range`)
    await links[planIndex].click()
  }

  async getPlanLinkHref(planIndex: number = 0): Promise<string | null> {
    const links = await this.planBpidLinks.all()
    if (planIndex >= links.length) throw new Error(`Plan index ${planIndex} out of range`)
    return await links[planIndex].getAttribute('href')
  }
}
