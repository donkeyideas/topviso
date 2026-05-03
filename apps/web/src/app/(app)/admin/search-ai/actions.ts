'use server'

import { crawlOwnSite, type SelfAuditResult } from '@/lib/crawl/self-audit'

export async function runSelfAudit(
  siteUrl?: string,
): Promise<SelfAuditResult> {
  return crawlOwnSite(siteUrl)
}
