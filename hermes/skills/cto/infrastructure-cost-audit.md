---
name: infrastructure-cost-audit
description: Pull cloud billing data, identify waste (idle resources, oversized instances, unused storage), and produce a prioritized optimization plan with estimated savings.
version: 1.0.0
trigger:
  - "infrastructure cost audit"
  - "cloud cost audit"
  - "AWS cost review"
  - "GCP cost review"
  - "Vercel cost review"
  - "check cloud spend"
  - "review infrastructure costs"
  - "find cloud waste"
  - "infra cost review"
  - "billing audit"
  - "where is cloud money going"
integrations:
  - bash-aws-cli
  - bash-gcloud-cli
  - vault-sqlite-fts5
inputs:
  - name: cloud_provider
    description: Which provider to audit — "aws", "gcp", "vercel", "all", or "manual" (manual = paste CSV data)
    required: true
  - name: time_period
    description: Billing period to analyze — e.g. "2026-03" for March 2026, or "last-3-months" (defaults to last full calendar month)
    required: false
  - name: billing_csv
    description: Path to a downloaded billing CSV file (used when cloud_provider is "manual" or as fallback)
    required: false
output_artifact: "wiki/infra-cost-YYYY-MM.md"
frequency: cron:0 9 2 * *
pack: cto
---

# Infrastructure Cost Audit

## When to run

On the second of each month, as a cron job, after billing data for the prior month has finalized. Also run when your cloud bill feels higher than expected, before a fundraise (investors will ask about burn components), and any time you provision a new significant resource.

Infrastructure cost is one of the few areas where a solo founder can cut spend without cutting output. Idle resources, unattached volumes, and oversized instances are money leaving every month with zero value delivered.

## What you'll get

A wiki page with the prior month's cloud spend broken down by service, a list of waste items with their monthly cost, a prioritized list of specific actions to take with estimated savings, and a trend line if prior audit data exists in the vault. The output is specific enough to act on the same day you read it.

## Steps

1. Determine the billing period. Default to the last full calendar month. Parse the `time_period` input if provided.

2. Pull billing data based on `cloud_provider`:

   **AWS:** Use AWS Cost Explorer CLI:
   ```bash
   aws ce get-cost-and-usage \
     --time-period Start=<YYYY-MM-01>,End=<YYYY-MM-DD> \
     --granularity MONTHLY \
     --metrics BlendedCost \
     --group-by Type=DIMENSION,Key=SERVICE \
     --output json > /tmp/aws-billing.json
   ```
   Also pull resource utilization signals:
   ```bash
   aws ce get-rightsizing-recommendation \
     --service EC2 \
     --output json > /tmp/aws-rightsizing.json
   aws ec2 describe-volumes \
     --filters Name=status,Values=available \
     --query 'Volumes[*].{ID:VolumeId,Size:Size,Type:VolumeType}' \
     --output json > /tmp/aws-unattached-volumes.json
   ```

   **GCP:** Use gcloud billing API:
   ```bash
   bq query --format=json "
     SELECT service.description, SUM(cost) as total_cost
     FROM \`[BILLING_ACCOUNT].gcp_billing_export_v1_*\`
     WHERE DATE(_PARTITIONTIME) BETWEEN '<start>' AND '<end>'
     GROUP BY 1 ORDER BY 2 DESC
   " > /tmp/gcp-billing.json
   ```

   **Vercel:** Vercel billing is UI-only for most plans. Pull from manual CSV if available. Otherwise, use the Vercel API for usage stats:
   ```bash
   curl -H "Authorization: Bearer $VERCEL_TOKEN" \
     "https://api.vercel.com/v2/usage" > /tmp/vercel-usage.json
   ```

   **Manual CSV fallback:** If `billing_csv` is provided or no API credentials are available, read the CSV file directly. Parse it into the same structure: service name, monthly cost, resource IDs where available.

3. Parse the billing output. Build a cost table sorted by spend (highest first). Calculate:
   - Total spend for the period
   - Top 5 services by cost and their percentage of total
   - Month-over-month change if prior audit data exists in vault

4. Identify waste items. For AWS specifically:
   - **Unattached EBS volumes** (from the volumes query — `status=available` means no EC2 attached)
   - **Rightsizing recommendations** (from the rightsizing API — flag instances where CPU utilization is consistently below 20%)
   - **Idle load balancers** — any ALB or NLB with zero or near-zero request count
   - **Old snapshots** — snapshots older than 90 days not associated with an AMI
   - For GCP / Vercel / generic: look for services with cost >$10/month and zero or near-zero usage metrics.

5. For each waste item, estimate monthly savings: (current cost of the resource) or (cost of current instance - cost of recommended instance).

6. Prioritize actions by estimated monthly savings. Group into three tiers:
   - **Quick wins** — no risk, immediate action (delete unattached volumes, stop idle instances)
   - **Rightsizing** — moderate risk, test in staging first (instance type changes)
   - **Architecture changes** — higher effort, planned work (reserved instances, spot fleet, CDN for static assets)

7. Search the vault for prior cost audits: `sqlite3 vault.db "SELECT path, updated FROM pages WHERE path LIKE 'wiki/infra-cost-%' ORDER BY updated DESC LIMIT 3;"`. If found, compare total spend to the prior month and note the trend.

8. Write to `wiki/infra-cost-<YYYY-MM>.md`.

## Output format

```markdown
---
type: wiki
title: "Infrastructure Cost Audit — YYYY-MM"
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft
tags: [infra-cost, cto, cloud, billing]
provider: [aws | gcp | vercel | multi]
period: YYYY-MM
total_spend: "$XXX.XX"
prior_month_spend: "$XXX.XX"
estimated_monthly_savings: "$XX.XX"
---

# Infrastructure Cost Audit — YYYY-MM

## Summary

- **Total spend:** $XXX.XX ([+/-]XX% vs. prior month)
- **Prior month:** $XXX.XX
- **Estimated recoverable waste:** $XX.XX/month

## Spend by Service

| Service | Monthly Cost | % of Total | vs. Last Month |
|---------|-------------|------------|----------------|
| [EC2 / Compute] | $XX | XX% | [+/-]XX% |
| [RDS / Database] | $XX | XX% | [+/-]XX% |
| [S3 / Storage] | $XX | XX% | [+/-]XX% |
| [Data Transfer] | $XX | XX% | [+/-]XX% |
| Other | $XX | XX% | |
| **Total** | **$XXX** | **100%** | |

## Waste Items

| Resource | Type | Monthly Cost | Action | Savings |
|----------|------|-------------|--------|---------|
| vol-abc123 | Unattached EBS 100GB gp2 | $10.00 | Delete | $10.00 |
| i-xyz789 (t3.xlarge) | Oversized EC2 (8% avg CPU) | $120.00 | Downsize to t3.medium | $90.00 |

**Total identified waste:** $XX.XX/month

## Recommended Actions

### Quick Wins (do this week)

1. **Delete [N] unattached EBS volumes** — saves $XX.XX/month.
   ```bash
   aws ec2 delete-volume --volume-id vol-abc123
   ```

### Rightsizing (do this sprint)

2. **Downsize [instance] from t3.xlarge to t3.medium** — saves $XX.XX/month.
   CPU utilization averaged X% over the past 30 days. Test in staging first.

### Architecture Changes (plan next quarter)

3. **Move static assets to CloudFront** — estimated $XX/month reduction in data transfer.

## Trend

[Month-over-month table if prior audits exist in vault]
```

## Example output (truncated)

```markdown
# Infrastructure Cost Audit — 2026-03

## Summary

- **Total spend:** $342.18 (+12% vs. prior month)
- **Prior month:** $305.40
- **Estimated recoverable waste:** $87.50/month

## Waste Items

| Resource | Type | Monthly Cost | Action | Savings |
|----------|------|-------------|--------|---------|
| vol-0a1b2c3d (200GB gp2) | Unattached EBS | $20.00 | Delete | $20.00 |
| vol-04e5f6a7 (50GB gp2) | Unattached EBS | $5.00 | Delete | $5.00 |
| i-0abc1234 (m5.2xlarge) | EC2 — 6% avg CPU | $240.00 | Downsize to m5.large | $180.00 |
| us-east-1 ALB (0 req/day) | Idle load balancer | $16.50 | Delete | $16.50 |

## Recommended Actions

### Quick Wins

1. Delete 2 unattached EBS volumes (vol-0a1b2c3d, vol-04e5f6a7) — saves $25/month.
   Verify no snapshot restore dependency first: `aws ec2 describe-snapshots --filters Name=volume-id,Values=vol-0a1b2c3d`.

2. Delete idle ALB in us-east-1 — saves $16.50/month. Confirm no DNS records point to it.
```
