# Add color-aware shoe icons to Step 2

## Changes
- Add five distinct inline SVG silhouettes for Running shoes, High heels, Boots, Sandals, and Sneakers.
- Store the purchased product type explicitly with the simulated purchase and use it for the Step 2 label, contract call, and comparison.
- Map common color names to readable SVG fill colors, with a neutral fallback for unknown colors.
- Render the purchased shoe type in the purchased color inside the Agent Shops card.

## Verification
- Check all five product shapes and common color mappings in the live demo.
- Confirm Step 2 still records all purchase data in the existing contract argument order.
