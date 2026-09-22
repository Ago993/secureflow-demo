# SecureFlow

SecureFlow is a browser-first portfolio demo for presenting a **security baseline review** in a way that is easy to understand and prioritize.

## What it does
- loads a built-in sample dataset or a local JSON file;
- groups security controls by category and severity;
- calculates a weighted baseline score;
- highlights Critical / High findings and Review items;
- shows evidence and remediation guidance;
- exports a local JSON report.

## What it does not do
SecureFlow does **not** scan networks, websites, endpoints, cloud accounts or identity providers. It performs no authentication, enumeration or remote requests. The demo works only with locally supplied data.

## Data format
The JSON object accepts: `name`, `scope`, `updatedAt`, and a `findings` array. Each finding can contain `id`, `control`, `category`, `status` (Pass/Fail/Review), `severity` (Critical/High/Medium/Low/Info), `priority`, `evidence`, and `remediation`.

## Security / privacy
- local processing only;
- strict CSP with `connect-src 'none'`;
- no analytics, trackers or external dependencies;
- no `innerHTML` rendering;
- imported JSON limited to 1 MB and 500 findings.

## Portfolio scope
This repository demonstrates UI/workflow capability. It is not a certification, vulnerability scanner, penetration-testing tool, SOC, or compliance product.