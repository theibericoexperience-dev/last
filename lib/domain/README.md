# Domain layer

This folder contains *stable contracts* and *client-safe API wrappers* for the business backbone.

- Orders = reservations backbone
- Payments = Stripe Checkout
- Profile = user profile data

UI components should prefer importing from `lib/domain/*` instead of hardcoding `fetch()` shapes.
