# Refine the Redress demo inputs and purchase simulation

## Changes
- Start each new mandate with blank product, color, size, price, deadline, and return-window fields.
- Rename the product label to “Product (Shoes)” and replace its text box with a fixed shoe-type dropdown.
- Generate one candidate purchase after the Step 2 search delay, randomly varying any combination of color, size, price, delivery, and return terms; allow fully matching purchases too.
- Keep the generated candidate stable through purchase confirmation and adjudication so the on-chain data and comparison view stay consistent.
- Replace the fixed blue-shoe photo with a neutral shoe graphic that does not conflict with the selected type or color.
- Reset to a fresh blank mandate when starting over.

## Technical details
- Preserve the existing GenLayer contract calls and argument order.
- Validate that all required values are present and numeric values are valid before `create_mandate` is called.
- Use the selected product in Step 2 and in the comparison table.
- Verify direct entry, dropdown selection, randomized matching/mismatching outcomes, reset behavior, and the live preview at desktop size.
