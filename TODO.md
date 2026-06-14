- [ ] Update `database/migrations/0001_01_01_000000_create_users_table.php` to add `name`, `email` (unique), and `email_verified_at` (nullable) columns (keep existing `username`, `password`, remember_token, timestamps).
- [ ] Update `app/Models/User.php` `$fillable` to include `name`, `email`, `username`, `password`.
- [ ] Run migrations to apply changes and re-test seeding/user creation.

