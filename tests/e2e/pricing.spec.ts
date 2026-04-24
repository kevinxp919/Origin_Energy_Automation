import { test, expect } from '@playwright/test'
import { PricingPage } from '../../pages/PricingPage'
import { isPdfGasPlan } from '../../utils/pdfUtils'
import * as fs from 'fs'
import * as path from 'path'

const TEST_ADDRESS = '17 Bolinda Road, Balwyn North, VIC 3104'
const DOWNLOADS_DIR = path.join(process.cwd(), 'downloads')

/**
 * Origin Energy — Full Plan Search & PDF Verification Flow
 *
 * Scenario:
 *  1. Navigate to pricing page
 *  2. Search for an address
 *  3. Select the address from the list
 *  4. Verify that the plans list is displayed
 *  5. Uncheck the Electricity checkbox
 *  6. Verify that plans are still displayed
 *  7. Click on the plan link in the Plan BPID/EFS column
 *  8. Verify that the plan details page opens in a new tab
 *  9. Download the plan PDF to the local file system
 * 10. Assert that the PDF content confirms it is a Gas plan
 */
test.describe('Origin Energy — Plan Search & PDF Verification', () => {

  let pricingPage: PricingPage

  test.beforeEach(async ({ page }) => {
    pricingPage = new PricingPage(page)
    if (!fs.existsSync(DOWNLOADS_DIR)) {
      fs.mkdirSync(DOWNLOADS_DIR, { recursive: true })
    }
  })

  test('complete plan search and gas PDF verification flow', async ({ context }) => {
    // ── Step 1: Navigate to pricing page ──────────────────────────────────────
    await pricingPage.navigate()
    await expect(pricingPage.addressSearchInput).toBeVisible({ timeout: 15000 })

    // ── Step 2: Search for address ────────────────────────────────────────────
    await pricingPage.searchAddress(TEST_ADDRESS)

    const results = await pricingPage.getSearchResults()
    expect(results.length, 'Address search should return results').toBeGreaterThan(0)
    expect(results[0].toUpperCase(), 'First result should contain Balwyn North').toContain('BALWYN NORTH')

    // ── Step 3: Select address ─────────────────────────────────────────────────
    await pricingPage.selectAddress(0)

    // ── Step 4: Verify plans list is displayed ─────────────────────────────────
    const planCount = await pricingPage.verifyPlansDisplayed()
    expect(planCount, 'Plans should be displayed after address selection').toBeGreaterThan(0)

    // ── Step 5: Uncheck Electricity checkbox ─────────────────────────────────
    await pricingPage.uncheckElectricity()

    // ── Step 6: Verify plans are still displayed after filter ─────────────────
    const filteredCount = await pricingPage.verifyPlansStillVisible()
    expect(filteredCount, 'Plans should still be visible after unchecking electricity').toBeGreaterThan(0)

    // ── Step 7: Click plan BPID/EFS link ──────────────────────────────────────
    const bpidHref = await pricingPage.getPlanLinkHref(0)
    expect(bpidHref, 'BPID link href should exist').toBeTruthy()
    expect(bpidHref, 'BPID link should be a PDF').toMatch(/\.pdf$/)

    // ── Step 8: Verify plan details page opens in new tab ─────────────────────
    const [newTab] = await Promise.all([
      pricingPage.page.waitForEvent('popup'),
      pricingPage.clickPlanBpidLink(0),
    ])
    expect(newTab.url(), 'New tab URL should differ from pricing page').not.toBe(pricingPage.page.url())
    await newTab.close()

    // ── Step 9: Download the plan PDF via Playwright context request ─────────
    const pdfResponse = await context.request.get(bpidHref!)
    if (!pdfResponse.ok()) {
      throw new Error(`PDF download failed: ${pdfResponse.status()} ${pdfResponse.statusText()}`)
    }
    const pdfBuffer = await pdfResponse.body()
    const pdfPath = path.join(DOWNLOADS_DIR, path.basename(bpidHref!.split('?')[0]))
    fs.writeFileSync(pdfPath, pdfBuffer)
    expect(fs.existsSync(pdfPath), `PDF should exist at ${pdfPath}`).toBe(true)
    const stats = fs.statSync(pdfPath)
    expect(stats.size, 'Downloaded PDF should not be empty').toBeGreaterThan(0)

    // ── Step 10: Assert PDF content confirms Gas plan ─────────────────────────
    const isGas = await isPdfGasPlan(pdfPath)
    expect(isGas, 'PDF content should confirm it is a Gas plan').toBe(true)
  })
})
