-- Set info@donkeyideas.com as superuser
UPDATE profiles
SET is_superuser = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'info@donkeyideas.com'
);
